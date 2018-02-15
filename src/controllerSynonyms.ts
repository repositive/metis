import { Pool } from 'pg';
import { synonyms, allSynonyms } from './synonyms';
import * as fs from 'fs';
import * as Ajv from 'ajv';
import * as R from 'ramda';

const ajv = new Ajv({ allErrors: true, verbose: true });

// --------------------------

const schema: any = JSON.parse(fs.readFileSync('./schemas/synonyms-is-valid.json', 'utf8'));

/**
 * @desc This method is linked to the action iris.synonyms.get. It checks in the database whether a list of synonyms for the given symbol exists.
 * If it does not exist, a request is send to the HUGO API at gennames.org to retrieve the required synonyms.
 * The response from the HUGO is stored to the database and retruned.
 *
 * @param {String} payload - contains the requested symbol as a string.
 * @param {Object} _postgres - Pass postgres element to work with database.
 * @returns {String} A list of synonyms for the requested symbol.
 */

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


/**
 * @desc This method is linked to the action iris.synonyms.all and returns all stored lists of synonyms from the database.
 *
 * @param {Object} _postgres - Pass postgres element to work with database.
 * @returns {Promise} A list of all synonym lists in the database.
 */
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

/**
 * @desc This method returns the list of synonyms for the provided symbol.
 *
 * @param {Object} _postgres - Pass postgres element to access the database.
 * @param {String} _symbol - Symbol for which the synonyms are requested.
 * @returns {Promise} A list of synonyms from the database.
 */
export async function selectSynonymsFromDb({
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

/**
 * @desc This method returns all lists of synonyms stored in the database.
 * @param {Object} _postgres - Pass postgres element to access the database.
 * @returns {Promise} A list of synonyms from the database.
 */
export async function selectAllSynonymsFromDb({
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

/**
 * @desc This method returns all lists of synonyms stored in the database.
 * @param {Object} _postgres - Pass postgres element to access the database.
 * @returns {Promise} A list of synonyms from the database.
 */

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

/**
 * @desc This method resets the current content in the database and replaces it with the response from Hugo for all synonyms.
 * @param {Object} _postgres - Pass postgres element to access the database.
 */
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

/**
 * @desc This method stores synonyms and symbols in the database.
 * @param {Object} _postgres - Pass postgres element to access the database.
 */
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

/**
 * @desc This method deletes synonyms and symbols from the database.
 * @param {Object} _postgres - Pass postgres element to access the database.
 * @param {Promise} listSynonyms - The list of synonyms, which has to be deleted from the database.
 */
export async function deleteSynonymsFromDb({
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
/**
 * @desc This method deletes all synonyms and symbols from the database.
 * @param {Object} _postgres - Pass postgres element to access the database.
 */
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
