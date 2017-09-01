import * as test from 'tape';
import { Test } from 'tape';
import { stub } from 'sinon';
import * as proxyquire from 'proxyquire';
import * as fs from 'fs';

//-------------------------------

test('Testing Zooma annotate service', (t: Test) => {
  t.test('The term is successfully matched', async function(st: Test) {

    const field = 'assay';
    const term = 'WXS';

    const annotateResult = {
      originalTerm: 'WXS',
      ontologyTerm: 'random exon sequencing',
      ontologyIRI: 'http://www.ebi.ac.uk/efo/EFO_0003746',
      ontologyConfidence: 'GOOD',
      ontologySource: 'http://www.ebi.ac.uk/efo/efo.owl',
      ontologyShortName: 'efo'
    };

    const requestResponse: any = JSON.parse(fs.readFileSync('./assets/testResponse.json', 'utf8'));

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));

    const _annotate = proxyquire('./annotate', {
      'request-promise': mockedReq
    });

    st.equals(typeof _annotate.default, 'function', 'The module exports a function called annotate');

    const result = await _annotate.default({ payload: { field, term } })
      .then(function(data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.error(err);
        console.log('annotate error');
        // API call failed...
      });

    st.assert(mockedReq.called, 'It calls request');
    st.equal(mockedReq.callCount, 1, 'It calls request once');
    st.assert(result instanceof Object, 'Returns an object');
    st.assert(('ontologyTerm' in result), 'Result has ontologyTerm');
    st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');
    st.end();

  });

  t.test('An unknown term is not matched', async function(st: Test) {

    const field = 'tissue';
    const term = 'viiat';

    const annotateResult = undefined;
    const requestResponse = undefined;

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));
    const _annotate = proxyquire('./annotate', {
      'request-promise': mockedReq
    });

    st.equals(typeof _annotate.default, 'function', 'The module exports a function called annotate');

    const result = await _annotate.default({ payload: { field, term } })
      .then(function(data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.error(err);
        console.log('annotate error - API call failed...');
      });

    st.ok(mockedReq.called, 'It calls request');
    st.equal(mockedReq.callCount, 1, 'It calls request once');
    st.assert(typeof result === 'undefined', 'Returns undefined');
    st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');
    st.end();
  });

  t.test('If term is \'undefined\' there is no error', async function(st: Test) {

    const field = 'tissue';
    const term = undefined;
    const annotateResult = undefined;
    const requestResponse = {};

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));
    const _annotate = proxyquire('./annotate', {
      'request-promise': mockedReq
    });

    st.equals(typeof _annotate.default, 'function', 'The module exports a function called annotate');

    const result = await _annotate.default({ payload: { field, term } })
      .then(function(data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.error(err);
        console.log('annotate error');
        // API call failed...
      });

    st.ok(mockedReq.notCalled, 'It doesn\'t call request function');
    st.assert(typeof result === 'undefined', 'Returns undefined');
    st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');
    st.end();
  });

  t.test('If term is \'none\' there is no error and no matching', async function(st: Test) {

    const field = 'tissue';
    const term = 'none';
    const annotateResult = undefined;
    const requestResponse = {};

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));
    const _annotate = proxyquire('./annotate', {
      'request-promise': mockedReq
    });

    st.equals(typeof _annotate.default, 'function', 'The module exports a function called annotate');

    const result = await _annotate.default({ payload: { field, term } })
      .then(function(data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.error(err);
        console.log('annotate error');
        // API call failed...
      });

    st.ok(mockedReq.notCalled, 'It doesn\'t call request function');
    st.assert(typeof result === 'undefined', 'Returns undefined');
    st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');
    st.end();
  });

  t.end();
});
