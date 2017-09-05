import * as test from 'tape';
import { Test } from 'tape';
import { stub } from 'sinon';
import * as proxyquire from 'proxyquire';
import * as fs from 'fs';

//-------------------------------

test.only('Testing getSynonym service', (t: Test) => {
  t.test('Returns synonyms', async function(st: Test) {

    const ontology: string = 'efo';
    const iri: string = 'http://www.ebi.ac.uk/efo/EFO_0003843';

    const annotateResult = {
      ontologyIRI: 'http://www.ebi.ac.uk/efo/EFO_0003843',
      ontologyTerm: 'pain',
      synonyms: [
        'Burning Pain',
        'Pain, Radiating',
        'Pains, Radiating'
      ]
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

  t.end();
});
