import * as test from 'tape';
import { Test } from 'tape';
import { stub } from 'sinon';
import * as proxyquire from 'proxyquire';

//-----------------------------------

test('Testing UpdateDataset wrapper', async(t: Test) => {

  const testDatasetOriginal = {
    'id': 'test',
    'properties': {
      'attributes': {
        'assay': ['test1', 'test2'],
        'technology': ['test3'],
        'disease': ['test4', 'test5']
      }
    }
  };

  // because the function modifies the dataset inplace
  const testDatasetFinal = {
    'id': 'test',
    'properties': {
      'attributes': {
        'assay': ['test1', 'test2'],
        'technology': ['test3'],
        'disease': ['test4', 'test5']
      }
    }
  };

  const annotateResult = {
    'originalTerm': 'test ',
    'ontologyTerm': 'Test',
    'ontologyIRI': 'http://testurl.com',
    'ontologyConfidence': 'HIGH',
    'ontologySource': 'http://test',
    'ontologyShortName': 'test'
  };

  const mockedAnnotate = stub().returns(Promise.resolve(annotateResult));
  const _getAnnotatedDataset = proxyquire('./getAnnotatedDataset', {
    './utils/annotate': { default: mockedAnnotate }
  });

  t.equals(typeof _getAnnotatedDataset.updateDataset, 'function', 'The module exports a function called updateDataset');

  await _getAnnotatedDataset.updateDataset(testDatasetFinal).then(function(data: any) {
    //console.log('got data', data);
    return data;
  }).catch((err: any) => {
    console.error(err);
    console.log('annotate error - API call failed...');
  });

  t.ok(mockedAnnotate.called, 'It calls updateDataset');
  t.equal(mockedAnnotate.callCount, 5, 'Call count = 5');
  t.assert(testDatasetFinal instanceof Object, 'Returns an object');
  t.notDeepEqual(testDatasetFinal, testDatasetOriginal, 'The final result is not equal to the initial dataset');
  t.end();
});
