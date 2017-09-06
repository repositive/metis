import * as test from 'tape';
import { Test } from 'tape';
import { stub } from 'sinon';
import * as proxyquire from 'proxyquire';
import * as fs from 'fs';

//-------------------------------

test('Testing getSynonym service', (t: Test) => {
  t.test('Returns synonyms', async function(st: Test) {

    const ontology: string = 'efo';
    const iri: string = 'http://www.ebi.ac.uk/efo/EFO_0003843';

    const annotateResult = {
      ontologyIRI: 'http://www.ebi.ac.uk/efo/EFO_0003843',
      ontologyTerm: 'pain',
      synonyms: ['Burning Pain', 'Pain, Radiating', 'Pains, Radiating']
    };

    const requestResponse: any = JSON.parse(fs.readFileSync('./assets/testSynonymResponse.json', 'utf8'));

    const mockedReq = stub().returns(Promise.resolve(requestResponse));

    const _getSynonym = proxyquire('./getSynonyms', {
      'request-promise': mockedReq
    });

    st.equals(typeof _getSynonym.default, 'function', 'The module exports a function called getSynonyms');

    const result = await _getSynonym.default({ payload: { ontologyIRI: iri, ontologyShortName: ontology } })
      .then(function(data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.log('API call failed...' + err);
        st.notOk(err, 'There is an error');
      });

    st.assert(mockedReq.called, 'It calls request');
    st.equal(mockedReq.callCount, 1, 'It calls request once');
    st.assert(result instanceof Object, 'Returns an object');
    st.assert(('synonyms' in result), 'Result has synonyms');
    st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');
    st.end();
  });

  //----------------------------

  t.test('Bad synonyms request throws error', async function(st: Test) {

    const ontology: string = 'zzzz';
    const iri: string = 'http://www.badiri/test/';

    const mockedReq = stub().returns(Promise.reject(new Error('fail')));

    const _getSynonym = proxyquire('./getSynonyms', {
      'request-promise': mockedReq
    });

    const result = await _getSynonym.default({ payload: { ontologyIRI: iri, ontologyShortName: ontology } })
      .then(function(data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.log('API call failed... ' + err);
        st.assert(err, 'There is an error from request');
      });

    st.equal(mockedReq.callCount, 1, 'It calls request once');
    st.end();
  });

  //-----------------------------
  t.test('Bad synonyms payload throws error', async function(st: Test) {

    const iri: string = 'http://www.badiri/test/';

    const requestResponse: any = {};
    const mockedReq = stub().returns(Promise.resolve(requestResponse));

    const _getSynonym = proxyquire('./getSynonyms', {
      'request-promise': mockedReq
    });

    const result = await _getSynonym.default({ payload: { ontologyIRI: iri } })
      .then(function(data: any) {
        return data;
      }).catch((err: any) => {
        st.ok(err, 'There is a payload schema error');
      });

    st.notOk(mockedReq.called, 'It doesn\'t call request');
    st.end();
  });

  t.end();
});
