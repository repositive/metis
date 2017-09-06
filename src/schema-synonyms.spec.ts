import * as test from 'tape';
import { Test } from 'tape';
import * as Ajv from 'ajv';
import * as fs from 'fs';

//--------------------------

const schemas: any[] = [JSON.parse(fs.readFileSync('./schemas/synonyms-is-valid.json', 'utf8'))];
const ajv = new Ajv({ allErrors: true, verbose: true, schemas });

test('The synonyms schema is valid', (t: Test) => {
  const schema = ajv.getSchema('synonyms-is-valid.json');
  t.ok(schema !== undefined, 'Synonyms schema loads');
  t.end();
});

test('ontologyIRI is required', (t: Test) => {
  const schema = ajv.getSchema('synonyms-is-valid.json');
  const json = { ontologyShortName: 'abc' };
  const valid = schema(json);
  t.notOk(valid, 'Object without ontologyIRI is not valid payload');
  t.ok(schema.errors, 'There are errors');
  if (schema.errors) {
    t.equals(schema.errors[0]['message'], 'should have required property \'ontologyIRI\'', 'Correct error message');
  }
  t.end();
});

test('ontologyShortName is required', (t: Test) => {
  const schema = ajv.getSchema('synonyms-is-valid.json');
  const json = { ontologyIRI: 'http://www.test.com/test/TEST_000001' };
  const valid = schema(json);
  t.notOk(valid, 'Object without ontologyShortName is not valid payload');
  t.ok(schema.errors, 'There are errors');
  if (schema.errors) {
    t.equals(schema.errors[0]['message'], 'should have required property \'ontologyShortName\'', 'Correct error message');
  }
  t.end();
});
