import * as test from 'tape';
import { Test } from 'tape';
import * as Ajv from 'ajv';
import * as fs from 'fs';

//--------------------------

const schemas: any[] = [
  JSON.parse(fs.readFileSync('./schemas/get-schema.json', 'utf8'))
];

const ajv = new Ajv({ allErrors: true, verbose: true, schemas });

test('The schemas are valid', (t: Test) => {
  schemas.forEach((item) => {
    const schema = ajv.getSchema(item.id);
    t.ok(schema !== undefined, `Schema ${item.id} loads`);
  });
  t.end();
});

test('Term is required for get function', (t: Test) => {
  const schema = ajv.getSchema('get-schema.json');
  const json = { field: 'abc' };
  const valid = schema(json);
  t.notOk(valid, 'Object without term is not valid payload');
  t.ok(schema.errors, `There are errors in ingestion-schema.json`);
  if (schema.errors) {
    t.equals(schema.errors[0]['message'], 'should have required property \'term\'', 'Correct error message');
  }
  t.end();
});

