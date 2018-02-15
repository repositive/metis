import * as test from 'tape';
import { Test } from 'tape';
import { stub } from 'sinon';

import * as fs from 'fs';
import * as Ajv from 'ajv';

import { get, selectFromDb, getAnnotation } from './controllerAnnotate';

//-------------------------------

test('Testing Annotation controller', (t: Test) => {
  t.test('Test get function when term is in database', async function (st: Test) {

    const _postgres: any = {};
    const payload = { field: 'abc', term: 'test' };
    const _ajv: any = new Ajv();
    const validateStub = stub(_ajv, 'validate').returns(true);
    const _schema = stub();
    const mockResult = [{
      'ontology_uid': 26,
      'confidence': 0.6,
      'ontology_uri': 'http://www.test.ac.uk/TEST_0005016',
      'ontology_term': 'test',
      'source_uri': 'https://www.test.ac.uk/test',
      'short_name': 'test'
    }];
    const _selectFromDb = stub().returns(Promise.resolve(mockResult));
    const _getAnnotation = stub().returns(Promise.resolve());

    const result = await get({ payload, _postgres, _ajv, _getAnnotation, _schema, _selectFromDb })
      .catch((err) => {
        st.notOk(err, 'Function should not error');
      });

    st.assert((_ajv.validate as any).called, 'It calls validate once');
    st.assert((_selectFromDb as any).calledOnce, 'It calls _selectFromDb');
    st.equals(_selectFromDb.getCall(0).args[0]._term, 'test', 'SelectFromDb is called with the correct term');
    st.deepEquals(result, mockResult, 'It returns the expected result');
    st.end();

  });

  t.test('If the schema is not valid, throws an error', async function (st: Test) {

    const _postgres: any = {};
    const payload = { field: 'abc', term: 'test' };
    const _ajv: any = new Ajv();
    const validateStub = stub(_ajv, 'validate').returns(false);
    const _schema: any = JSON.parse(fs.readFileSync('./schemas/get-schema.json', 'utf8'));
    const mockResult = {
      'ontology_uid': 26,
      'confidence': 0.6,
      'ontology_uri': 'http://www.test.ac.uk/TEST_0005016',
      'ontology_term': 'test',
      'source_uri': 'https://www.test.ac.uk/test',
      'short_name': 'test'
    };
    const _selectFromDb = stub().returns(Promise.resolve(mockResult));
    const _getAnnotation = stub().returns(Promise.resolve());

    const result = await get({ payload, _postgres, _ajv, _getAnnotation, _schema, _selectFromDb })
      .catch((err) => {
        st.ok(err, 'Function should throw error');
      });

    st.assert((_ajv.validate as any).calledOnce, 'It calls validate once');
    st.deepEquals((_ajv.validate as any).getCall(0).args, [_schema, payload], 'It calls validate with correct args');
    st.assert(_selectFromDb.notCalled, 'SelectFromDb is not called');
    st.end();

  });

  t.test('Test get function when term is not in database', async function (st: Test) {

    const _postgres: any = {};
    const payload = { field: 'abc', term: 'test' };
    const _ajv: any = new Ajv();
    const validateStub = stub(_ajv, 'validate').returns(true);
    const _schema = stub();
    const mockResult = [{
      'ontology_uid': 26,
      'confidence': 0.6,
      'ontology_uri': 'http://www.test.ac.uk/TEST_0005016',
      'ontology_term': 'test',
      'source_uri': 'https://www.test.ac.uk/test',
      'short_name': 'test'
    }];
    const _selectFromDb = stub()
      .onFirstCall().returns(Promise.resolve([undefined]))
      .onSecondCall().returns(Promise.resolve(mockResult));
    const _getAnnotation = stub().returns(Promise.resolve());

    const result = await get({ payload, _postgres, _ajv, _getAnnotation, _schema, _selectFromDb })
      .catch((err) => {
        st.notOk(err, 'Function should not error');
      });

    st.assert(_selectFromDb.calledTwice, 'It calls selectFromDb twice');
    st.equals(_selectFromDb.getCall(0).args[0]._term, 'test', 'selectFromDb is called with the correct term');
    st.deepEquals(_getAnnotation.getCall(0).args[0].payload, payload, 'getAnnotation is called with the correct payload');
    st.equals(_selectFromDb.getCall(1).args[0]._term, 'test', 'selectFromDb is called again with the correct term');
    st.equals(result, mockResult, 'It returns the expected result');
    st.end();
  });

  t.test('Test selectFromDb', async function (st: Test) {

    const mockResult = {
      otherKey: 'other',
      rows: [{
        'ontology_uid': 26,
        'confidence': 0.6,
        'ontology_uri': 'http://www.test.ac.uk/TEST_0005016',
        'ontology_term': 'test',
        'source_uri': 'https://www.test.ac.uk/test',
        'short_name': 'test'
      }]
    };

    const expectedResult = [{
      'ontology_uid': 26,
      'confidence': 0.6,
      'ontology_uri': 'http://www.test.ac.uk/TEST_0005016',
      'ontology_term': 'test',
      'source_uri': 'https://www.test.ac.uk/test',
      'short_name': 'test'
    }];

    const _postgres: any = { query: stub().returns(Promise.resolve(mockResult)) };
    const _term = 'test';
    const result = await selectFromDb({ _postgres, _term })
      .catch((err) => {
        st.notOk(err, 'Function should not error');
      });

    st.assert((_postgres.query as any).calledOnce, 'Query postgres once');
    st.deepEquals(result, expectedResult, 'It returns the expected result');
    st.end();
  });

  t.test('Test getAnnotation', async function (st: Test) {

    const mockResultArray = [{
      term: 'test',
      iri: 'http://www.test.ac.uk/TEST_0005016',
      confidence: 0.75,
      source: 'https://www.test.ac.uk/test',
      short_name: 'test'
    }];

    const mockResultObj = mockResultArray[0];
    const mockOntology_uid = 5;

    const query = stub()
      .onFirstCall().returns(Promise.resolve({ rows: [{ id: mockOntology_uid }] }))
      .onSecondCall().returns(Promise.resolve(mockResultObj));

    const _postgres: any = { query };
    const payload = { field: 'abc', term: 'test' };
    const _annotate = stub().returns(Promise.resolve(mockResultArray));

    const result = await getAnnotation({ payload, _postgres, _annotate })
      .catch((err) => {
        st.notOk(err, 'Function should not error');
      });

    st.equals((_annotate as any).getCall(0).args[0].payload, payload, 'Calls annotate with correct payload');
    st.equals((_postgres.query as any).callCount, 2, 'Postgres query called correct number of times');

    st.deepEquals((_postgres.query as any).getCall(0).args[0].values, [mockResultObj.iri, mockResultObj.term, mockResultObj.source, mockResultObj.short_name], 'First query made inserts ontology term');
    st.deepEquals((_postgres.query as any).getCall(1).args[0].values, [payload.term, mockOntology_uid, mockResultObj.confidence], 'Second query is to insert the original term');
    st.end();
  });

  t.end();
});
