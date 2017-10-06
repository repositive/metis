import * as test from 'tape';
import { Test } from 'tape';
import { stub } from 'sinon';
import * as proxyquire from 'proxyquire';
import * as fs from 'fs';

//-------------------------------

test('Testing Zooma annotate service', (t: Test) => {
  t.test('The term is successfully matched', async function (st: Test) {

    const field = 'assay';
    const term = 'WXS';

    const annotateResult = [{
      term: 'random exon sequencing',
      iri: 'http://www.ebi.ac.uk/efo/EFO_0003746',
      confidence: 0.6,
      source: 'http://www.ebi.ac.uk/efo/efo.owl',
      short_name: 'efo'
    }];

    const requestResponse: any = JSON.parse(fs.readFileSync('./assets/testResponse.json', 'utf8'));

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));

    const _annotate = proxyquire('./annotate', {
      'request-promise': mockedReq
    });

    st.equals(typeof _annotate.default, 'function', 'The module exports a function called annotate');

    const result = await _annotate.default({ payload: { field, term } })
      .then(function (data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.error(err);
        console.log('annotate error');
        // API call failed...
        st.notOk(err, 'There is an error');
      });

    st.assert(mockedReq.called, 'It calls request');
    st.equal(mockedReq.callCount, 1, 'It calls request once');
    st.assert(result instanceof Object, 'Returns an object');
    st.assert(('term' in result[0]), 'Result has ontologyTerm');
    st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');
    st.end();

  });

  t.test('The shortname is the accession prefix', async function (st: Test) {

    const field = 'disease';
    const term = 'abc';

    const annotateResult = [{
      term: 'abc disease',
      iri: 'http://www.test.net/abc/ABCDE_166',
      confidence: 0.8,
      source: 'https://www.test',
      short_name: 'abcde'
    }];

    const requestResponse: any = {
      'annotatedProperty': { 'propertyValue': 'abc disease' },
      '_links': { 'olslinks': [{ 'semanticTag': 'http://www.test.net/abc/ABCDE_166' }] },
      'derivedFrom': { 'provenance': { 'source': { 'uri': 'https://www.test' } } },
      'confidence': 0.8
    };

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));
    const _annotate = proxyquire('./annotate', { 'request-promise': mockedReq });

    const result = await _annotate.default({ payload: { field, term } })
      .then(function (data: any) {
        return data;
      }).catch((err: any) => {
        console.error(err);
      });

    st.assert(typeof result[0].short_name === 'string', 'Ontology shortname is a string');
    st.deepEquals(result[0].short_name, annotateResult[0].short_name, 'The shortname is equal to the accession prefix');
    st.end();
  });

  t.test('The shortname is correct when the accession prefix is unusual', async function (st: Test) {

    const field = 'disease';
    const term = 'abc';

    const annotateResult = [{
      term: 'abc disease',
      iri: 'http://www.test.net/abc/topic_166',
      confidence: 0.8,
      source: 'https://www.test',
      short_name: 'edam'
    }];

    const requestResponse: any = {
      'annotatedProperty': { 'propertyValue': 'abc disease' },
      '_links': { 'olslinks': [{ 'semanticTag': 'http://www.test.net/abc/topic_166' }] },
      'derivedFrom': { 'provenance': { 'source': { 'uri': 'https://www.test' } } },
      'confidence': 0.8
    };

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));
    const _annotate = proxyquire('./annotate', { 'request-promise': mockedReq });

    const result = await _annotate.default({ payload: { field, term } })
      .then(function (data: any) {
        return data;
      }).catch((err: any) => {
        console.error(err);
      });

    st.assert(typeof result[0].short_name === 'string', 'Ontology shortname is a string');
    st.deepEquals(result[0].short_name, annotateResult[0].short_name, 'The shortname is correct');
    st.end();
  });

  t.test('The shortname is correct when the accession prefix is Orphanet', async function (st: Test) {

    const field = 'disease';
    const term = 'abc';

    const annotateResult = [{
      term: 'abc disease',
      iri: 'http://www.test.net/abc/Orphanet_166',
      confidence: 0.8,
      source: 'https://www.test',
      short_name: 'ordo'
    }];

    const requestResponse: any = {
      'annotatedProperty': { 'propertyValue': 'abc disease' },
      '_links': { 'olslinks': [{ 'semanticTag': 'http://www.test.net/abc/Orphanet_166' }] },
      'derivedFrom': { 'provenance': { 'source': { 'uri': 'https://www.test' } } },
      'confidence': 0.8
    };

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));
    const _annotate = proxyquire('./annotate', { 'request-promise': mockedReq });

    const result = await _annotate.default({ payload: { field, term } })
      .then(function (data: any) {
        return data;
      }).catch((err: any) => {
        console.error(err);
      });

    st.assert(typeof result[0].short_name === 'string', 'Ontology shortname is a string');
    st.deepEquals(result[0].short_name, annotateResult[0].short_name, 'The shortname is correct');
    st.end();
  });

  t.test('An unknown term is not matched', async function (st: Test) {

    const field = 'tissue';
    const term = 'viiat';

    const annotateResult: any[] = [];
    const requestResponse = undefined;

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));
    const _annotate = proxyquire('./annotate', {
      'request-promise': mockedReq
    });

    st.equals(typeof _annotate.default, 'function', 'The module exports a function called annotate');

    const result = await _annotate.default({ payload: { field, term } })
      .then(function (data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.error(err);
        console.log('annotate error - API call failed...');
        st.notOk(err, 'There is an error');
      });

    st.ok(mockedReq.called, 'It calls request');
    st.equal(mockedReq.callCount, 1, 'It calls request once');
    st.assert(Array.isArray(result) && result.length === 0, 'Returns an empty array');
    st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');
    st.end();
  });

  t.test('If term is \'undefined\' there is an error', async function (st: Test) {

    const field = 'tissue';
    const term = undefined;
    const annotateResult: any[] = [];
    const requestResponse = {};

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));
    const _annotate = proxyquire('./annotate', {
      'request-promise': mockedReq
    });

    st.equals(typeof _annotate.default, 'function', 'The module exports a function called annotate');

    const result = await _annotate.default({ payload: { field, term } })
      .then(function (data: any) {
        return data;
      }).catch((err: any) => {
        st.ok(err, 'There is an error');
      });

    st.ok(mockedReq.notCalled, 'It doesn\'t call request function');
    st.deepEquals(result, annotateResult, 'Returns an empty array');
    st.end();
  });

  t.test('If term is \'none\' there is no error and no matching', async function (st: Test) {

    const field = 'tissue';
    const term = 'none';
    const annotateResult: any[] = [];
    const requestResponse = {};

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));
    const _annotate = proxyquire('./annotate', {
      'request-promise': mockedReq
    });

    st.equals(typeof _annotate.default, 'function', 'The module exports a function called annotate');

    const result = await _annotate.default({ payload: { field, term } })
      .then(function (data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.error(err);
        console.log('annotate error');
        // API call failed...
        st.notOk(err, 'There is an error');
      });

    st.ok(mockedReq.notCalled, 'It doesn\'t call request function');
    st.assert(Array.isArray(result) && result.length === 0, 'Returns an empty array');
    st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');
    st.end();
  });

  t.test('Request errors throw a new error', async function (st: Test) {

    const field = 'tissue';
    const term = 'abc';

    const mockedReq = stub().returns(Promise.reject(new Error('fail')));

    const _annotate = proxyquire('./annotate', {
      'request-promise': mockedReq
    });

    const result = await _annotate.default({ payload: { field, term } })
      .then(function (data: any) {
        return data;
      }).catch((err: any) => {
        st.assert(err, 'There is an error from the request');
      });
    st.end();
  });

  t.end();
});
