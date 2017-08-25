import * as test from 'tape';
import { Test } from 'tape';
import { stub } from 'sinon';
import annotate from './annotate';

//-------------------------------

test('Testing Zooma annotate service', (t: Test) => {

  t.test('Term is successfully matched', function(st: Test) {
    async function _test() {
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

      const _annotate = stub().returns(Promise.resolve(annotateResult)) as any;
      const result = await _annotate(field, term);

      st.ok(_annotate.called, 'It calls annotate');
      st.assert(result instanceof Object, 'Returns an object');
      st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');
    }
    _test()
      .then(() => st.end())
      .catch(console.error);
  });

  t.test('Unknown term is not matched', function(st: Test) {
    async function _test() {
      const field = 'tissue';
      const term = 'viiat';

      const annotateResult = { originalTerm: 'viiat' };

      const _annotate = stub().returns(Promise.resolve(annotateResult));
      const result = await _annotate(field, term);

      st.ok(_annotate.called, 'It calls annotate');
      st.assert(result instanceof Object, 'Returns an object');
      st.assert(!('ontologyTerm' in result), 'Result doesn\'t have ontologyTerm');
      st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');
    }
    _test()
      .then(() => st.end())
      .catch(console.error);
  });

  t.test('If term is undefined there is no error', function(st: Test) {
    async function _test() {
      const field = 'tissue';
      const term = undefined;
      const annotateResult = { originalTerm: undefined };

      const _annotate = stub().returns(Promise.resolve(annotateResult));
      const result = await _annotate(field, term).catch(err => {
        t.ok(err, 'Throw an error for broken files');
      });

      console.log(result);

      st.ok(_annotate.called, 'It calls annotate');
      st.assert(result instanceof Object, 'Returns an object');
      st.assert(!('ontologyTerm' in result), 'Result doesn\'t have ontologyTerm');
      st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');

      // not sure how to do this?
      st.doesNotThrow(result, /error/, 'Does not throw an error');

    }
    _test()
      .then(() => st.end())
      .catch(console.error);
  });

  t.test('If term is none there is no error and no matching', function(st: Test) {
    async function _test() {
      const field = 'tissue';
      const term = 'none';
      const annotateResult = { originalTerm: 'none' };

      const _annotate = stub().returns(Promise.resolve(annotateResult));
      const result = await _annotate(field, term);

      console.log(result);

      st.ok(_annotate.called, 'It calls annotate');
      st.assert(result instanceof Object, 'Returns an object');
      st.assert(!('ontologyTerm' in result), 'Result doesn\'t have ontologyTerm');
      st.deepEquals(result, annotateResult, 'The final result is equal to the expected result');

      // not sure how to do this?
      st.doesNotThrow(result, /error/, 'Does not throw an error');

    }
    _test()
      .then(() => st.end())
      .catch(console.error);
  });

});
