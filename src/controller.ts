import { Pool } from 'pg';
import annotate from './annotate';
import * as fs from 'fs';
import * as Ajv from 'ajv';
const ajv = new Ajv({ allErrors: true, verbose: true });

// --------------------------
// ingestion:
const ingestionSchema: any = JSON.parse(fs.readFileSync('./schemas/ingestion-schema.json', 'utf8'));

export async function ingestion({
  payload,
  _postgres,
  _selectFromDb = selectFromDb,
  _getAnnotation = getAnnotation,
  _ajv = ajv,
  _schema = ingestionSchema
 }: {
    payload: { field: string, term: string },
    _postgres: Pool
    _selectFromDb?: typeof selectFromDb,
    _getAnnotation?: typeof getAnnotation,
    _ajv?: typeof ajv,
    _schema?: typeof ingestionSchema
  }) {

  const valid = ajv.validate(ingestionSchema, payload);
  if (!valid) {
    console.log(ajv.errors);
    throw new Error('Payload schema error');
  }

  let result = await _selectFromDb({ _postgres, _term: payload.term })
    .catch((e: any) => console.error(e));

  // if result undefined (ie. no rows found)
  if (!result) {
    const stored = await _getAnnotation({ payload, _postgres })
      .catch((e: any) => console.error(e.stack));

    result = await _selectFromDb({ _postgres, _term: payload.term })
      .catch((e: any) => console.error(e.stack));

  }
  return result;
}

// --------------------------

export async function selectFromDb({
  _postgres,
  _term
}: {
    _postgres: Pool,
    _term: string
  }) {
  const query = {
    text: 'SELECT ontology_uid, confidence FROM original_terms WHERE original = $1',
    values: [_term]
  };

  const result = await _postgres.query(query)
    .then(data => data.rows[0])
    .catch((e: any) => console.error(e.stack));

  return result;
}

// ------------------------

export async function getAnnotation({
  payload,
  _postgres,
  _annotate = annotate
  }: {
    payload: { field: string, term: string },
    _postgres: Pool
    _annotate?: typeof annotate
  }) {

  const standardised = await _annotate({ payload })
    .catch((e: any) => console.error(e.stack));

  //
  const insertOntologyTerm = {
    text: 'INSERT INTO ontology_terms(ontology_uri, ontology_term, source_uri, short_name) VALUES($1, $2, $3, $4) RETURNING * ',
    values: [standardised[0].iri, standardised[0].term, standardised[0].source, standardised[0].short_name]
  };

  await _postgres.query(insertOntologyTerm)
    .catch((e: any) => console.error(e.stack));

  // get ontology_uid
  const getOntologyTermUID = {
    text: 'SELECT id FROM ontology_terms WHERE ontology_term = $1',
    values: [standardised[0].term]
  };

  const ontology_uid = await _postgres.query(getOntologyTermUID)
    .then((data: any) => data) // required
    .catch((e: any) => console.error(e.stack));

  //
  const createQuery = {
    text: 'INSERT INTO original_terms(original, ontology_uid, confidence) VALUES($1, $2, $3)',
    values: [payload.term, ontology_uid.rows[0].id, standardised[0].confidence]
  };

  await _postgres.query(createQuery)
    .catch((e: any) => console.error(e.stack));
}

// --------------------------
// search:
const searchSchema: any = JSON.parse(fs.readFileSync('./schemas/search-schema.json', 'utf8'));

export async function search({
  payload,
  _postgres,
  _selectFromDb = selectFromDb,
  _ajv = ajv,
  _schema = searchSchema
}: {
    payload: { field: string, term: string },
    _postgres: Pool
    _selectFromDb?: typeof selectFromDb,
    _ajv?: typeof ajv,
    _schema?: typeof searchSchema
  }) {

  const valid = ajv.validate(searchSchema, payload);
  if (!valid) {
    console.log(ajv.errors);
    throw new Error('Payload schema error');
  }

  return await _selectFromDb({ _postgres, _term: payload.term })
    .catch((e: any) => console.error(e.stack));
}

// --------------------------

