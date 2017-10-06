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

  const valid = _ajv.validate(_schema, payload);
  if (!valid) {
    console.log(_ajv.errors);
    throw new Error('Payload schema error');
  }

  let result = await _selectFromDb({ _postgres, _term: payload.term });

  // if result undefined (ie. no rows found)
  if (!result) {
    const stored = await _getAnnotation({ payload, _postgres });
    result = await _selectFromDb({ _postgres, _term: payload.term });
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
    text:
    `SELECT
    original_terms.ontology_uid,
    original_terms.confidence,
    ontology_terms.ontology_uri,
    ontology_terms.ontology_term,
    ontology_terms.source_uri,
    ontology_terms.short_name
    FROM original_terms
    INNER JOIN ontology_terms
    ON ontology_terms.id = original_terms.ontology_uid
    WHERE original = $1`,
    values: [_term]
  };

  const result = await _postgres.query(query)
    .then(data => data.rows[0]);

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

  // get ontology term from zooma
  const standardised = await _annotate({ payload })
    .then(data => data[0]);

  const insertOntologyTerm = {
    text: 'INSERT INTO ontology_terms(ontology_uri, ontology_term, source_uri, short_name) VALUES($1, $2, $3, $4) RETURNING * ',
    values: [standardised.iri, standardised.term, standardised.source, standardised.short_name]
  };

  // insert standardised terms into table, return the row id to link to original term
  const ontology_uid = await _postgres.query(insertOntologyTerm)
    .then((data: any) => data.rows[0].id);

  const createQuery = {
    text: 'INSERT INTO original_terms(original, ontology_uid, confidence) VALUES($1, $2, $3)',
    values: [payload.term, ontology_uid, standardised.confidence]
  };

  await _postgres.query(createQuery);
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
    payload: { term: string },
    _postgres: Pool
    _selectFromDb?: typeof selectFromDb,
    _ajv?: typeof ajv,
    _schema?: typeof searchSchema
  }) {

  const valid = _ajv.validate(_schema, payload);
  if (!valid) {
    console.log(_ajv.errors);
    throw new Error('Payload schema error');
  }

  return await _selectFromDb({ _postgres, _term: payload.term });
}

// --------------------------

