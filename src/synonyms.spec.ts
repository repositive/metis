import * as test from 'tape';
import { Test } from 'tape';
import { stub } from 'sinon';
import * as fs from 'fs';
import { synonyms, allSynonyms } from './synonyms';

//-------------------------------

test('Testing getSynonym service', (t: Test) => {
  t.test('Returns synonyms', async function (st: Test) {

    const symbol: string = 'ERBB2';
    const synonymsResult = [ ['ERBB2', 'NEU', 'HER-2', 'CD340', 'HER2'] ];

    const requestResponse: any = {
      'response': {
        'docs': [{
          'symbol': 'ERBB2',
          'name': 'erb-b2 receptor tyrosine kinase 2',
          'alias_symbol': [
            'NEU',
            'HER-2',
            'CD340',
            'HER2'
          ],
          'alias_name': [
            'neuro/glioblastoma derived oncogene homolog',
            'human epidermal growth factor receptor 2'
          ]
        }]
      }
    };

    const _request: any = stub().returns(Promise.resolve(requestResponse));

    st.equals(typeof synonyms, 'function', 'The module exports a function called synonyms');

    const result = await synonyms({ payload: { symbol }, _request })
      .then(function (data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.log('API call failed...' + err);
        st.notOk(err, 'There is an error');
      });
    st.assert(result instanceof Object, 'Returns an object');
    st.deepEquals(result, synonymsResult, 'The final result is equal to the expected result');
    st.end();
  });

  //----------------------------

  t.test('Returns synonyms via alias', async function (st: Test) {

    const symbol: string = 'HER2';
    const synonymsResult = [ ['ERBB2', 'NEU', 'HER-2', 'CD340', 'HER2'] ];

    const requestResponse: any = {
      'response': {
        'docs': [{
          'symbol': 'ERBB2',
          'name': 'erb-b2 receptor tyrosine kinase 2',
          'alias_symbol': [
            'NEU',
            'HER-2',
            'CD340',
            'HER2'
          ],
          'alias_name': [
            'neuro/glioblastoma derived oncogene homolog',
            'human epidermal growth factor receptor 2'
          ]
        }]
      }
    };

    const _request: any = stub().returns(Promise.resolve(requestResponse));

    st.equals(typeof synonyms, 'function', 'The module exports a function called synonyms');

    const result = await synonyms({ payload: { symbol }, _request })
      .then(function (data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.log('API call failed...' + err);
        st.notOk(err, 'There is an error');
      });
    st.assert(result instanceof Object, 'Returns an object');
    st.deepEquals(result, synonymsResult, 'The final result is equal to the expected result');
    st.end();
  });

  t.test('Fail to find a synonym', async function (st: Test) {

    const symbol: string = 'zzzzyzzz';
    const synonymsResult: any[] = [];

    const requestResponse: any = {
      'response': {
        'responseHeader': {
          'status': 0,
          'QTime': 1
        }
      }
    };

    const _request: any = stub().returns(Promise.resolve(requestResponse));

    st.equals(typeof synonyms, 'function', 'The module exports a function called synonyms');

    const result = await synonyms({ payload: { symbol }, _request })
      .then(function (data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.log('API call failed...' + err);
        st.notOk(err, 'There is an error');
      });
    st.assert(result instanceof Object, 'Returns an object');
    st.deepEquals(result, synonymsResult, 'The final result is equal to the expected result');
    st.end();
  });

  t.test('Returns allSynonyms', async function (st: Test) {
    const synonymsResult = [['ERBB2', 'NEU', 'HER-2', 'CD340', 'HER2'],
                            ['A1CF','ACF','ASP','ACF64','ACF65','APOBEC1CF']];

    const requestResponse: any = {
      'response': {
        'docs': [{
          'symbol': 'ERBB2',
          'name': 'alpha-1-B glycoprotein',
          'alias_symbol': [
            'NEU',
            'HER-2',
            'CD340',
            'HER2'
          ],
          'alias_name': [
            'neuro/glioblastoma derived oncogene homolog',
            'human epidermal growth factor receptor 2'
          ]
        },
        {
          'symbol': 'A1CF',
          'name': 'erb-b2 receptor tyrosine kinase 2',
          'alias_symbol': [
            'ACF',
            'ASP',
            'ACF64',
            'ACF65',
            'APOBEC1CF'
          ],
          'location': '10q11.23'
        }]
      }
    };

    const _request: any = stub().returns(Promise.resolve(requestResponse));

    st.equals(typeof allSynonyms, 'function', 'The module exports a function called allSynonyms');

    const result = await allSynonyms({ _request })
      .then(function (data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.log('API call failed...' + err);
        st.notOk(err, 'There is an error');
      });
    st.assert(result instanceof Object, 'Returns an object');
    st.deepEquals(result, synonymsResult, 'The final result is equal to the expected result');
    st.end();
  });

  t.end();
});
