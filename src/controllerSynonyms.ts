import { Pool } from 'pg';
import { synonyms } from './synonyms';
import { allSynonyms } from './synonyms';
import * as fs from 'fs';
import * as Ajv from 'ajv';
import * as R from 'ramda';

const ajv = new Ajv({ allErrors: true, verbose: true });

// --------------------------

const schema: any = JSON.parse(fs.readFileSync('./schemas/synonyms-is-valid.json', 'utf8'));

export async function getSynonyms({
  payload,
  _postgres,
  _selectSynonymsFromDb = selectSynonymsFromDb,
  _deleteSynonymsFromDb = deleteSynonymsFromDb,
  _ajv = ajv,
  _schema = schema
 }: {
    payload: { symbol : string},
    _postgres: Pool,
    _selectSynonymsFromDb?: typeof selectSynonymsFromDb,
    _deleteSynonymsFromDb?: typeof deleteSynonymsFromDb,
    _ajv?: typeof ajv,
    _schema?: typeof schema
  }): Promise<any[]> {

  const valid = _ajv.validate(_schema, payload);
  if (!valid) {
    console.log(_ajv.errors);
    throw new Error('Payload schema error');
  }

  let result = await _selectSynonymsFromDb({ _postgres, _symbol: payload.symbol });

  // if result undefined (ie. no rows found)
  if (result[0] === undefined && payload.symbol) {
    const { symbol } = payload;
    const stored = await updateSynonyms({ payload : { symbol } , _postgres });
    result = await _selectSynonymsFromDb({ _postgres, _symbol: payload.symbol });
  } else if(result[0] !== undefined && payload.symbol && ((Date.now() - result[0].last_update) / ( 1000 * 60 * 60 * 24 ) ) > 30) { // Update synonyms when last updated 31 days ago.
    // Delete entry first and trigger update afterwards
    const listSynonyms = result[0].list_synonyms;
    await _deleteSynonymsFromDb({_postgres, listSynonyms });

    const { symbol } = payload;
    const stored = await updateSynonyms({ payload : { symbol } , _postgres });
    result = await _selectSynonymsFromDb({ _postgres, _symbol: payload.symbol });
  }
  const reduceToListSynonyms = R.pick(['list_synonyms']);
  return R.map(reduceToListSynonyms, result);
}


// --------------------------

export async function getAllSynonyms({
  payload,
  _postgres,
  _selectAllSynonymsFromDb = selectAllSynonymsFromDb
 }: {
    payload: { symbol : string},
    _postgres: Pool,
    _selectAllSynonymsFromDb?: typeof selectAllSynonymsFromDb
  }): Promise<any[]> {

  let result =  await _selectAllSynonymsFromDb({ _postgres });
  const reduceToListSynonyms = R.pick(['list_synonyms']);
  result = R.map(reduceToListSynonyms, result);
  result = R.map(R.values, result);
  console.log(result);

  return result;
}

// --------------------------

function selectSynonymsFromDb({
  _postgres,
  _symbol
}: {
    _postgres: Pool,
    _symbol: string
  }) {
  const query = {
    text:
    `SELECT list_synonyms, last_update
    FROM synonyms
    INNER JOIN symbols
    ON synonyms.id = symbols.synonyms_uid
    WHERE symbols.symbol = $1`,
    values: [_symbol]
  };

  const result = _postgres.query(query)
    .then(data => data.rows);

  return result;
}

// --------------------------

function selectAllSynonymsFromDb({
  _postgres
}: {
    _postgres: Pool
  }) {
  const query = {
    text:
    `SELECT list_synonyms FROM synonyms`
  };

  const result = _postgres.query(query)
  .then(data => data.rows);

  return result;
}

// ------------------------

export async function updateSynonyms({
  payload,
  _postgres
  }: {
    payload: { symbol: string },
    _postgres: Pool
  }) {

  // get synonyms from HUGO
  const listSynonyms = await synonyms({ payload });
  storeSynonyms({ listSynonyms, _postgres });
}

// ------------------------

export async function populateSynonyms({
  _postgres,
  _deleteAllSynonymsFromDb = deleteAllSynonymsFromDb
  }: {
    _postgres: Pool,
    _deleteAllSynonymsFromDb?: typeof deleteAllSynonymsFromDb
  }) {

  // get synonyms from HUGO
  deleteAllSynonymsFromDb({ _postgres });
  const listlistSynonyms = await allSynonyms();
  listlistSynonyms.forEach((listSynonyms: any) => {
    storeSynonyms({ listSynonyms, _postgres });
  });
  console.log('Database populated!');
}

// --------------------------
export async function storeSynonyms({
  listSynonyms,
  _postgres
  }: {
    listSynonyms: any,
    _postgres: Pool
  }) {

  if (listSynonyms && listSynonyms.length >= 1) {
    const convertedListSynonyms = JSON.stringify(listSynonyms).replace('[','\[').replace(']','\]').replace('\'','');
    const insertSynonyms= {
      text: 'INSERT INTO synonyms(list_synonyms, last_update) VALUES($1, CURRENT_TIMESTAMP) RETURNING * ',
      values: [convertedListSynonyms]
    };

    // insert standardised terms into table, return the row id to link to original term
    const synonyms_uid = await _postgres.query(insertSynonyms)
      .then((data: any) => data.rows[0].id);

    for ( const synonymToken of listSynonyms ) {
      const createQuery = {
        text: 'INSERT INTO symbols(synonyms_uid, symbol) VALUES($1, $2)',
        values: [synonyms_uid, synonymToken]
      };


      await _postgres.query(createQuery);
    }
  }
}

function deleteSynonymsFromDb({
  _postgres,
  listSynonyms
}: {
    _postgres: Pool,
    listSynonyms: any
  }) {

  const stringListSynonyms = listSynonyms.replace('[','(').replace(']',')').replace(/\"/g,'\'');
  const queryDeleteSymbols= {
    text: `DELETE FROM symbols WHERE "symbol" IN `.concat(stringListSynonyms)
  };

  _postgres.query(queryDeleteSymbols);

  const queryDeleteSynonyms = {
    text:
    `DELETE FROM synonyms WHERE list_synonyms = $1`,
    values: [listSynonyms]
  };

  _postgres.query(queryDeleteSynonyms);
}

function deleteAllSynonymsFromDb({
  _postgres
}: {
    _postgres: Pool
  }) {
  const queryDeleteSymbols= {
    text: `DELETE FROM symbols`
  };

  _postgres.query(queryDeleteSymbols);

  const queryDeleteSynonyms = {
    text:
    `DELETE FROM synonyms`
  };

  _postgres.query(queryDeleteSynonyms);
}
