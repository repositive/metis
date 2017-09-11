import * as test from 'tape';
import { Test } from 'tape';
import * as Ajv from 'ajv';
import * as fs from 'fs';

//--------------------------

const schemas: any[] = [JSON.parse(fs.readFileSync('./schemas/annotate-is-valid.json', 'utf8'))];
const ajv = new Ajv({ allErrors: true, verbose: true, schemas });

test('The schema is valid', (t: Test) => {
  const schema = ajv.getSchema('annotate-is-valid.json');
  t.ok(schema !== undefined, 'Schema loads');
  t.end();
});

test('Term is required', (t: Test) => {
  const schema = ajv.getSchema('annotate-is-valid.json');
  const json = { field: 'abc' };
  const valid = schema(json);
  t.notOk(valid, 'Object without term is not valid payload');
  t.ok(schema.errors, 'There are errors');
  if (schema.errors) {
    t.equals(schema.errors[0]['message'], 'should have required property \'term\'', 'Correct error message');
  }
  t.end();
});

test('Field is required', (t: Test) => {
  const schema = ajv.getSchema('annotate-is-valid.json');
  const json = { term: 'abc' };
  const valid = schema(json);
  t.notOk(valid, 'Object without field is not valid payload');
  t.ok(schema.errors, 'There are errors');
  if (schema.errors) {
    t.equals(schema.errors[0]['message'], 'should have required property \'field\'', 'Correct error message');
  }
  t.end();
});
