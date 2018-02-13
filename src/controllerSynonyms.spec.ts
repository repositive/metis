import * as test from 'tape';
import { Test } from 'tape';
import { stub } from 'sinon';
import { Pool } from 'pg';

import * as fs from 'fs';
import * as Ajv from 'ajv';

import { getSynonyms, populateSynonyms, getAllSynonyms } from './controllerSynonyms';

//-------------------------------

test('Testing controller', (t: Test) => {
  t.test('Test get function when symbol and synonyms list are in database', async function (st: Test) {

    const _postgres: any = { query: stub().returns(Promise.resolve()) };
    const payload = { symbol: 'ERBB2' };
    const _ajv: any = new Ajv();
    const validateStub = stub(_ajv, 'validate').returns(true);
    const _schema = stub();
    const mockResult = [{
      'list_synonyms':'[\"ERBB2\",\"NEU\",\"HER-2\",\"CD340\",\"HER2\"]'
    }];
    const _selectSynonymsFromDb = stub().returns(Promise.resolve(mockResult));

    const mockResultSynonyms = ['ERBB2','NEU','HER-2','CD340','HER2'];
    const _synonyms = stub().returns(Promise.resolve(mockResultSynonyms));

    const result = await getSynonyms({ payload, _postgres, _selectSynonymsFromDb, _synonyms, _ajv, _schema })
      .catch((err) => {
        st.notOk(err, 'Function should not error');
      });

    st.assert((_ajv.validate as any).called, 'It calls validate once');
    st.assert((_selectSynonymsFromDb as any).calledOnce, 'It calls _selectSynonymsFromDb');
    st.false((_synonyms as any).calledOnce, 'It does not call _synonyms');
    st.equals(_selectSynonymsFromDb.getCall(0).args[0]._symbol, 'ERBB2', '_selectSynonymsFromDb is called with the correct symbol');
    st.deepEquals(result, mockResult, 'It returns the expected result');
    st.end();

  });

  t.test('Test getSynonyms function when term is not in database and not available by HUGO', async function (st: Test) {

    const _postgres: any = {};
    const payload = { symbol: '1234' };
    const _ajv: any = new Ajv();
    const validateStub = stub(_ajv, 'validate').returns(true);
    const _schema = stub();
    const mockResult: any[] = [];
    const _selectSynonymsFromDb = stub().returns(Promise.resolve(mockResult));

    const mockResultSynonyms: any[] = [];
    const _synonyms = stub().returns(Promise.resolve(mockResultSynonyms));

    const result = await getSynonyms({ payload, _postgres, _selectSynonymsFromDb, _synonyms, _ajv, _schema })
      .catch((err) => {
        st.notOk(err, 'Function should not error');
      });

    st.assert(_selectSynonymsFromDb.calledTwice, 'It calls selectFromDb twice');
    st.equals(_selectSynonymsFromDb.getCall(0).args[0]._symbol, '1234', 'selectFromDb is called with the correct term');
    st.assert((_synonyms as any).calledOnce, 'It calls synonyms');
    st.equals(_synonyms.getCall(0).args[0].payload.symbol, '1234', 'synonyms is called again with the correct term');
    st.equals(_selectSynonymsFromDb.getCall(1).args[0]._symbol, '1234', 'selectFromDb is called again with the correct term');
    st.same(result, mockResult, 'It returns the expected result');
    st.end();
  });

  t.test('Test getAllSynonyms', async function (st: Test) {
    const _postgres: any = {};
    const mockResult = [{
      'last_update':'123',
      'list_synonyms':'[\"ERBB2\",\"NEU\",\"HER-2\",\"CD340\",\"HER2\"]'
    },
    {
      'last_update':'456',
      'list_synonyms':'[\"ERBB2\",\"NEU\",\"HER-2\"]'
    }];

    const expectedResult = [
      [ '["ERBB2","NEU","HER-2","CD340","HER2"]' ], [ '["ERBB2","NEU","HER-2"]' ]
    ];

    const _selectAllSynonymsFromDb = stub().returns(Promise.resolve(mockResult));

    const result = await getAllSynonyms({ _postgres, _selectAllSynonymsFromDb})
      .catch((err) => {
        st.notOk(err, 'Function should not error');
      });

    st.assert((_selectAllSynonymsFromDb).calledOnce, 'Trigger postgres call once');
    st.deepEquals(result, expectedResult, 'It returns the expected result');
    st.end();
  });

  t.test('Test populateSynonyms', async function (st: Test) {

    const _postgres: any = { query: stub().returns(Promise.resolve()) };

    const mockResult = [ [ 'A1BG-AS1', 'FLJ23569' ],
        [ 'A1CF', 'ACF', 'ASP', 'ACF64', 'ACF65', 'APOBEC1CF' ],
        [ 'A2M', 'FWP007', 'S863-7', 'CPAMD5' ],
        [ 'ABAT', 'GABAT' ],
        [ 'ABCA1', 'TGD' ] ];

    const _allSynonyms: any = stub().returns(Promise.resolve(mockResult));

    await populateSynonyms({ _postgres, _allSynonyms })
    .catch(function(e) {
      st.ok(e, 'TypeError: Cannot read property \'0\' of undefined');
    });

    st.ok((_postgres.query as any).called, 'true');

    st.end();
  });

  t.end();
});
