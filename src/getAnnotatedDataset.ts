import * as _request from 'request-promise';
import annotate from './utils/annotate';

export async function updateDataset({ request = _request, payload }: { request: any, payload: { dataset: any } }) {

  const dataset = payload.dataset;

  const keysToAnnotate = ['assay', 'technology', 'tissue', 'disease'];

  for (const key in dataset.properties.attributes) { // depends on data model
    if (keysToAnnotate.includes(key)) {
      const array = dataset.properties.attributes[key];

      for (let index = 0; index < array.length; index++) { // can't do await in forEach loop
        if (!array[index] || !array[index].ontologyTerm) {
          const term = array[index]; // or let term = array[index].originalTerm; depends on data model
          await annotate(key, term)
            .then(result => {
              array[index] = result;
            })
            .catch(err => {
              console.error(err);
              console.log('annotate error');
              // API call failed...
            });
        }
      }
    }
  }
  console.log(JSON.stringify(dataset, undefined, 2));
  return dataset;
}

//-------------------------------
//import * as testDataset from './utils/testdataset.json';

//const testDataset = require('./utils/testdataset.json');

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

updateDataset({ request: _request, payload: { dataset: testDataset } });
