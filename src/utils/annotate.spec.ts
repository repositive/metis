import * as test from 'tape';
import { Test } from 'tape';
import { stub } from 'sinon';
import * as proxyquire from 'proxyquire';

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

    const requestResponse = {
      'uri': null,
      'annotatedProperty': {
        'uri': null,
        'propertyType': null,
        'propertyValue': 'random exon sequencing'
      },
      '_links': {
        'olslinks': [{
          'href': 'http://www.ebi.ac.uk/ols/api/terms?iri=http%3A%2F%2Fwww.ebi.ac.uk%2Fefo%2FEFO_0003746',
          'semanticTag': 'http://www.ebi.ac.uk/efo/EFO_0003746'
        }]
      },
      'semanticTags': [
        'http://www.ebi.ac.uk/efo/EFO_0003746'
      ],
      'replacedBy': [],
      'replaces': [],
      'derivedFrom': {
        'uri': 'http://rdf.ebi.ac.uk/resource/zooma/annotation_summary/OLS',
        'annotatedProperty': {
          'uri': null,
          'propertyType': null,
          'propertyValue': 'random exon sequencing'
        },
        '_links': {
          'olslinks': [{
            'href': 'http://www.ebi.ac.uk/efo/EFO_0003746',
            'semanticTag': 'http://www.ebi.ac.uk/efo/EFO_0003746'
          }]
        },
        'semanticTags': [
          'http://www.ebi.ac.uk/efo/EFO_0003746'
        ],
        'replacedBy': [],
        'replaces': [],
        'provenance': {
          'source': {
            'type': 'ONTOLOGY',
            'name': 'http://www.ebi.ac.uk/efo/efo.owl',
            'uri': 'http://www.ebi.ac.uk/efo/efo.owl'
          },
          'evidence': 'COMPUTED_FROM_ONTOLOGY',
          'accuracy': null,
          'generator': 'http://www.ebi.ac.uk/efo/efo.owl',
          'generatedDate': null,
          'annotator': null,
          'annotationDate': null
        },
        'annotatedBiologicalEntities': []
      },
      'confidence': 'GOOD',
      'provenance': {
        'source': {
          'type': 'DATABASE',
          'name': 'zooma',
          'uri': 'http://www.ebi.ac.uk/spot/zooma'
        },
        'evidence': 'COMPUTED_FROM_TEXT_MATCH',
        'accuracy': null,
        'generator': 'ZOOMA',
        'generatedDate': 1503678044975,
        'annotator': 'ZOOMA',
        'annotationDate': 1503678044975
      },
      'annotatedBiologicalEntities': []
    };

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));

    const _annotate = proxyquire
      //.noCallThru()
      .load('./annotate', {
        'request-promise': mockedReq
      });

    st.equals(typeof _annotate.default, 'function', 'The module exports a function called annotate');

    const result = await _annotate.default(field, term)
      .then(function(data: any) {
        //console.log('got data', data);
        return data;
      }).catch(err => {
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

    const annotateResult = { originalTerm: 'viiat' };
    const requestResponse = undefined;

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));
    const _annotate = proxyquire('./annotate', {
      'request-promise': mockedReq
    });

    st.equals(typeof _annotate.default, 'function', 'The module exports a function called annotate');

    const result = await _annotate.default(field, term).then(function(data: any) {
      //console.log('got data', data);
      return data;
    }).catch(err => {
      console.error(err);
      console.log('annotate error');
      // API call failed...
    });

    st.ok(mockedReq.called, 'It calls request');
    st.equal(mockedReq.callCount, 1, 'It calls request once');
    st.assert(result instanceof Object, 'Returns an object');
    st.assert(!('ontologyTerm' in result), 'Result doesn\'t have ontologyTerm');
    st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');
    st.end();
  });

  t.test('If term is \'undefined\' there is no error', async function(st: Test) {

    const field = 'tissue';
    const term = undefined;
    const annotateResult = { originalTerm: undefined };
    const requestResponse = {};

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));
    const _annotate = proxyquire('./annotate', {
      'request-promise': mockedReq
    });

    st.equals(typeof _annotate.default, 'function', 'The module exports a function called annotate');

    const result = await _annotate.default(field, term).then(function(data: any) {
      //console.log('got data', data);
      return data;
    }).catch(err => {
      console.error(err);
      console.log('annotate error');
      // API call failed...
    });

    st.ok(mockedReq.notCalled, 'It doesn\'t call request function');
    st.assert(result instanceof Object, 'Returns an object');
    st.assert(!('ontologyTerm' in result), 'Result doesn\'t have ontologyTerm');
    st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');

    // not sure how to do this?
    st.doesNotThrow(result, /error/, 'Does not throw an error');
    st.end();
  });

  t.test('If term is \'none\' there is no error and no matching', async function(st: Test) {

    const field = 'tissue';
    const term = 'none';
    const annotateResult = { originalTerm: 'none' };
    const requestResponse = {};

    const mockedReq = stub().returns(Promise.resolve([requestResponse]));
    const _annotate = proxyquire('./annotate', {
      'request-promise': mockedReq
    });

    st.equals(typeof _annotate.default, 'function', 'The module exports a function called annotate');

    const result = await _annotate.default(field, term).then(function(data: any) {
      //console.log('got data', data);
      return data;
    }).catch(err => {
      console.error(err);
      console.log('annotate error');
      // API call failed...
    });

    st.ok(mockedReq.notCalled, 'It doens\'t call request');
    st.assert(result instanceof Object, 'Returns an object');
    st.assert(!('ontologyTerm' in result), 'Result doesn\'t have ontologyTerm');
    st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');

    // not sure how to do this?
    st.doesNotThrow(result, /error/, 'Does not throw an error');
    st.end();
  });

  t.end();
});
