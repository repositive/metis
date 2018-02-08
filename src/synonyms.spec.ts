import * as test from 'tape';
import { Test } from 'tape';
import { stub } from 'sinon';
import * as fs from 'fs';
import { synonyms, allSynonyms } from './synonyms';

//-------------------------------

test('Testing getSynonym service', (t: Test) => {
  t.test('Returns synonyms', async function(st: Test) {

    const symbol: string = 'ERBB2';

    const synonymsResult = ['NEU','HER-2','CD340','HER2','ERBB2'];

    st.equals(typeof synonyms, 'function', 'The module exports a function called synonyms');

    const result = await synonyms({ payload: { symbol } })
      .then(function(data: any) {
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

  t.test('Returns synonyms via alias', async function(st: Test) {

    const symbol: string = 'HER2';

    const synonymsResult = ['NEU','HER-2','CD340','HER2','ERBB2'];

    st.equals(typeof synonyms, 'function', 'The module exports a function called synonyms');

    const result = await synonyms({ payload: { symbol } })
      .then(function(data: any) {
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

  t.test('Fail to find a synonym', async function(st: Test) {

    const symbol: string = 'zzzzyzzz';

    const synonymsResult : any[] = [];

    st.equals(typeof synonyms, 'function', 'The module exports a function called synonyms');

    const result = await synonyms({ payload: { symbol } })
      .then(function(data: any) {
        //console.log('got data', data);
        return data;
      }).catch((err: any) => {
        console.log('API call failed...' + err);
        st.notOk(err, 'There is an error');
      });
    st.assert(result instanceof Object, 'Returns an object');
    st.deepEquals(result,synonymsResult, 'The final result is equal to the expected result');
    st.end();
  });

  t.end();
});
