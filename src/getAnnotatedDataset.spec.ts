import * as test from 'tape';
import { Test } from 'tape';
import { stub } from 'sinon';
import * as proxyquire from 'proxyquire';
import { updateDataset } from './getAnnotatedDataset';
import * as _request from 'request-promise';

//-------------------------------

const testDataset = {
  'id': '007d4b51-3bb9-467e-9569-318d19112cc5',
  'description': 'An Integrated Genomic Approach to Alzheimer Disease, Alzheimer\'s Disease and Gene Discovery on Chromosome 9 SNP and microsatellite genotypes.',
  'external_id': 'NG00014',
  'datasource_id': 'e36f2d0b-6b04-44cf-9258-9bd7e7d45739',
  'access': 'Restricted',
  'created_at': '2017-07-14 14:11:32.498+00',
  'url': 'https:\/\/www.niagads.org\/datasets\/NG00014',
  'title': 'Alzheimer\'s Disease and Gene Discovery on Chromosome 9',
  'assay': 'Targeted Genotyping',
  'updated_at': '2017-07-14 14:11:32.498+00',
  'tech': 'Not Specified',
  'properties': {
    'raw_id': 'NIAGADS-56e49e17c2427ff5405ecc45d3a5c16d',
    'attributes': {
      'pmid': ['15455263', '12677449', '14564669', '14570706', '15234467', '15987928', '16199552', '16093727', '16198584', '16222332', '15985314'],
      'assay': ['Targeted Genotyping', 'WXS'],
      'technology': ['none'],
      'disease': ['Alzheimer\'s disease ', 'viiat'],
      'samples': [6135]
    }
  }
};

//-----------------------------------

test('Testing UpdateDataset', (t: Test) => {

  async function _test() {

    const annotateResult = { originalTerm: 'WXS' };
    const _annotate = stub().returns(Promise.resolve(annotateResult));
    const _updateDataset = stub().returns(Promise.resolve());

    const _getAnnotatedDataset = proxyquire('./getAnnotatedDataset', {
      './utils/annotate': _annotate,
      updateDataset
    });

    const result = await _getAnnotatedDataset.updateDataset({ request: _request, payload: { dataset: testDataset } });

    console.log(JSON.stringify(result, undefined, 2));

    t.ok(_getAnnotatedDataset.updateDataset.called, 'It calls updateDataset');
    t.assert(result instanceof Object, 'Returns an object');
    //t.notDeepEquals(result, annotateResult, 'The final result is equal to the expected result');
  }

  _test()
    .then(() => t.end())
    .catch(console.error);

});
