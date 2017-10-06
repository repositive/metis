import { Pool } from 'pg';
import annotate from './annotate';

// --------------------------
// ingestion:
export async function ingestion({
  _payload,
  _postgres,
  _selectFromDb = selectFromDb,
  _getAnnotation = getAnnotation
 }: {
    _payload: { field: string, term: string },
    _postgres: Pool
    _selectFromDb?: typeof selectFromDb,
    _getAnnotation?: typeof getAnnotation
  }) {

  let result = await _selectFromDb({ _postgres, _term: _payload.term })
    .catch((e: any) => console.error(e.stack));

  // // if result undefined
  if (!result) {
    const stored = await _getAnnotation({ _payload, _postgres });

    result = await _selectFromDb({ _postgres, _term: _payload.term })
      .catch((e: any) => console.error(e.stack));

  }
  return result;
}

// // --------------------------

export async function selectFromDb({
  _postgres,
  _term
}: {
    _postgres: Pool,
    _term: string
  }) {
  // // query = term
  const query = {
    text: 'SELECT ontology_uid, confidence FROM original_terms WHERE original = $1',
    values: [_term]
  };

  // you can also use async/await
  const result = await _postgres.query(query)
    .then((data: any) => console.log(data))
    .catch((e: any) => console.error(e.stack));
  // await pool.end();

  return result;
}

// ------------------------

export async function getAnnotation({
  _payload,
  _postgres,
  _annotate = annotate
  }: {
    _payload: { field: string, term: string },
    _postgres: Pool
    _annotate?: typeof annotate
  }) {

  const standardised = await _annotate({ _payload })
    .then((data: any) => {
      console.log(data);
      return data;
    })
    .catch((e: any) => console.error(e.stack));

  //  createQuery = standardised
  const createQuery = {
    text: 'INSERT INTO original_terms(original, ontology_uid, confidence) VALUES($1, $2, $3)',
    values: [_payload.term, standardised.term, standardised.confidence]
  };

  // you can also use async/await
  const stored = await _postgres.query(createQuery)
    .then((data: any) => console.log(data))
    .catch((e: any) => console.error(e.stack));
  // await pool.end();
}

// // --------------------------
// // search:
export async function search({
  _payload,
  _postgres,
  _selectFromDb = selectFromDb
}: {
    _payload: { field: string, term: string },
    _postgres: Pool
    _selectFromDb?: typeof selectFromDb
  }) {
  return await _selectFromDb({ _postgres, _term: _payload.term })
    .catch((e: any) => console.error(e.stack));
}

// // --------------------------

