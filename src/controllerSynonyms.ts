import { Pool } from 'pg';
import { synonyms, allSynonyms } from './synonyms';
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
  _updateSynonyms = updateSynonyms,
  _synonyms = synonyms,
  _ajv = ajv,
  _schema = schema
 }: {
    payload: { symbol: string },
    _postgres: Pool,
    _selectSynonymsFromDb?: typeof selectSynonymsFromDb,
    _deleteSynonymsFromDb?: typeof deleteSynonymsFromDb,
    _updateSynonyms?: typeof updateSynonyms,
    _synonyms?: typeof synonyms,
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
  const { symbol } = payload;
  if (R.isEmpty(result) && payload.symbol) {

    await _updateSynonyms({ payload: { symbol }, _postgres, _synonyms });
    result = await _selectSynonymsFromDb({ _postgres, _symbol: payload.symbol });
  } else if (R.isEmpty(result) && payload.symbol && ((Date.now() - result[0].last_update) / (1000 * 60 * 60 * 24)) > 30) { // Update synonyms when last updated 31 days ago.
    // Delete entry first and trigger update afterwards

    R.map(R.compose(c =>_deleteSynonymsFromDb({_postgres, listSynonyms : c }), R.prop('list_synonyms')), result);

    await _updateSynonyms({ payload: { symbol }, _postgres, _synonyms });
    result = await _selectSynonymsFromDb({ _postgres, _symbol: payload.symbol });
  }
  const reduceToListSynonyms = R.pick(['list_synonyms']);
  return R.map(reduceToListSynonyms, result);
}


// --------------------------

export async function getAllSynonyms({
  _postgres,
  _selectAllSynonymsFromDb = selectAllSynonymsFromDb
 }: {
    _postgres: Pool,
    _selectAllSynonymsFromDb?: typeof selectAllSynonymsFromDb
  }): Promise<any[]> {

  const result = await _selectAllSynonymsFromDb({ _postgres });
  const reduceToListSynonyms = R.pick(['list_synonyms']);

  return R.pipe(R.map(reduceToListSynonyms), R.map(R.values))(result);
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
    .then(data => data.rows)
    .catch((err: any) => {
      //console.log('_request error: ' + err);
      throw new Error('_request error: ' + err);
    });

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
    .then(data => data.rows)
    .catch((err: any) => {
      //console.log('_request error: ' + err);
      throw new Error('_request error: ' + err);
    });

  return result;
}

// ------------------------

async function updateSynonyms({
  payload,
  _postgres,
  _synonyms = synonyms,
  _storeSynonyms = storeSynonyms
  }: {
    payload: { symbol: string },
    _postgres: Pool,
    _synonyms?: typeof synonyms,
    _storeSynonyms?: typeof storeSynonyms
  }) {

  // get synonyms from HUGO
  const listlistSynonyms = await _synonyms({ payload });
  listlistSynonyms.forEach((listSynonyms: any) => {
    _storeSynonyms({ listSynonyms, _postgres });
  });
}

// ------------------------

export async function populateSynonyms({
  _postgres,
  _deleteAllSynonymsFromDb = deleteAllSynonymsFromDb,
  _storeSynonyms = storeSynonyms,
  _allSynonyms = allSynonyms
  }: {
    _postgres: Pool,
    _deleteAllSynonymsFromDb?: typeof deleteAllSynonymsFromDb,
    _storeSynonyms?: typeof storeSynonyms,
    _allSynonyms?: typeof allSynonyms
  }) {

  // get synonyms from HUGO
  _deleteAllSynonymsFromDb({ _postgres });
  const listlistSynonyms = await _allSynonyms({});
  listlistSynonyms.forEach((listSynonyms: any) => {
    _storeSynonyms({ listSynonyms, _postgres });
  });

}

// --------------------------
async function storeSynonyms({
  listSynonyms,
  _postgres
  }: {
    listSynonyms: any,
    _postgres: Pool
  }) {

  if (listSynonyms && listSynonyms.length >= 1) {
    const convertedListSynonyms = JSON.stringify(listSynonyms).replace('[', '\[').replace(']', '\]').replace('\'', '');
    const insertSynonyms = {
      text: 'INSERT INTO synonyms(list_synonyms, last_update) VALUES($1, CURRENT_TIMESTAMP) RETURNING * ',
      values: [convertedListSynonyms]
    };

    // insert standardised terms into table, return the row id to link to original term
    const synonyms_uid = await _postgres.query(insertSynonyms)
      .then((data: any) => data.rows[0].id)
      .catch((err: any) => {
        //console.log('_request error: ' + err);
        throw new Error('_request error: ' + err);
      });

    listSynonyms.forEach(function(synonymToken : string) {
      const createQuery = {
        text: 'INSERT INTO symbols(synonyms_uid, symbol) VALUES($1, $2)',
        values: [synonyms_uid, synonymToken]
      };

      _postgres.query(createQuery).catch((err: any) => {
        //console.log('_request error: ' + err);
        throw new Error('_request error: ' + err);
      });
    });
  }
}

function deleteSynonymsFromDb({
  _postgres,
  listSynonyms
}: {
    _postgres: Pool,
    listSynonyms: any
  }) {

  const stringListSynonyms = listSynonyms.replace('[', '(').replace(']', ')').replace(/\"/g, '\'');
  const queryDeleteSymbols = {
    text: `DELETE FROM symbols WHERE "symbol" IN `.concat(stringListSynonyms)
  };

  _postgres.query(queryDeleteSymbols)
  .catch((err: any) => {
    //console.log('_request error: ' + err);
    throw new Error('_request error: ' + err);
  });

  const queryDeleteSynonyms = {
    text:
      `DELETE FROM synonyms WHERE list_synonyms = $1`,
    values: [listSynonyms]
  };

  _postgres.query(queryDeleteSynonyms)
  .catch((err: any) => {
    //console.log('_request error: ' + err);
    throw new Error('_request error: ' + err);
  });
}

function deleteAllSynonymsFromDb({
  _postgres
}: {
    _postgres: Pool
  }) {
  const queryDeleteSymbols = {
    text: `DELETE FROM symbols`
  };

  _postgres.query(queryDeleteSymbols)
  .catch((err: any) => {
    //console.log('_request error: ' + err);
    throw new Error('_request error: ' + err);
  });

  const queryDeleteSynonyms = {
    text:
      `DELETE FROM synonyms`
  };

  _postgres.query(queryDeleteSynonyms)
  .catch((err: any) => {
    //console.log('_request error: ' + err);
    throw new Error('_request error: ' + err);
  });
}
