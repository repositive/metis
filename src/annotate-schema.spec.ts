import * as test from 'tape';
import { Test } from 'tape';
import * as Ajv from 'ajv';
import * as fs from 'fs';

//--------------------------

const schemas: any[] = [
  JSON.parse(fs.readFileSync('./schemas/ingestion-schema.json', 'utf8')),
  JSON.parse(fs.readFileSync('./schemas/search-schema.json', 'utf8'))
];

const ajv = new Ajv({ allErrors: true, verbose: true, schemas });

test('The schemas are valid', (t: Test) => {
  schemas.forEach((item) => {
    const schema = ajv.getSchema(item.id);
    t.ok(schema !== undefined, `Schema ${item.id} loads`);
  });
  t.end();
});

test('Term is required for ingestion', (t: Test) => {
  const schema = ajv.getSchema('ingestion-schema.json');
  const json = { field: 'abc' };
  const valid = schema(json);
  t.notOk(valid, 'Object without term is not valid payload');
  t.ok(schema.errors, `There are errors in ingestion-schema.json`);
  if (schema.errors) {
    t.equals(schema.errors[0]['message'], 'should have required property \'term\'', 'Correct error message');
  }
  t.end();
});

test('Term is required for search', (t: Test) => {
  const schema = ajv.getSchema('search-schema.json');
  const json = {};
  const valid = schema(json);
  t.notOk(valid, 'Object without term is not valid payload');
  t.ok(schema.errors, `There are errors in search-schema.json`);
  if (schema.errors) {
    t.equals(schema.errors[0]['message'], 'should have required property \'term\'', 'Correct error message');
  }
  t.end();
});


test('Field is required for ingestion', (t: Test) => {
  const schema = ajv.getSchema('ingestion-schema.json');
  const json = { term: 'abc' };
  const valid = schema(json);
  t.notOk(valid, 'Object without field is not valid payload');
  t.ok(schema.errors, 'There are errors');
  if (schema.errors) {
    t.equals(schema.errors[0]['message'], 'should have required property \'field\'', 'Correct error message');
  }
  t.end();
});
