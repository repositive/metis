import { Pool } from 'pg';
import synonyms from './synonyms';
import * as fs from 'fs';
import * as Ajv from 'ajv';
const ajv = new Ajv({ allErrors: true, verbose: true });

// --------------------------

const schema: any = JSON.parse(fs.readFileSync('./schemas/synonyms-is-valid.json', 'utf8'));

export async function getSynonyms({
  payload,
  _postgres,
  _selectSynonymsFromDb = selectSynonymsFromDb,
  _getSynonyms = getSynonyms,
  _ajv = ajv,
  _schema = schema
 }: {
    payload: { symbol : string},
    _postgres: Pool,
    _selectSynonymsFromDb?: typeof selectSynonymsFromDb,
    _getSynonyms?: typeof getSynonyms,
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
  }
  return result;
}

// --------------------------

export async function selectSynonymsFromDb({
  _postgres,
  _symbol
}: {
    _postgres: Pool,
    _symbol: string
  }) {
  const query = {
    text:
    `SELECT list_synonyms
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

  if (listSynonyms) {
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

// --------------------------
