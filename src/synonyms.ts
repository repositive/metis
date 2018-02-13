import * as request from 'request-promise';
import * as fs from 'fs';
import * as Ajv from 'ajv';

import * as R from 'ramda';


export async function synonyms({
   payload,
  _request = request
  }: {
    payload: { symbol: string },
    _request?: typeof request
  }) {

  const data: any = payload;
  const symbol: string = payload.symbol;
  const url_symbol = `https://rest.genenames.org/fetch/symbol/${symbol}`;

  const options_symbol = {
    method: 'GET',
    uri: url_symbol as string,
    json: true
  };

  const result: any = await _request(options_symbol)
    .then((response: any) => {
      if (!R.isNil(response.docs)) {
        return consolidateResult(response);
      } else {
        return aliasSynonyms({ symbol_alias: symbol, _request });
      }
    })
    .catch((err: any) => {
      //console.log('_request error: ' + err);
      throw new Error('_request error: ' + err);
    });

  return result;
}

export async function allSynonyms({
 _request = request
 }: {
    _request?: typeof request
  }) {
  const url_all = 'http://rest.genenames.org/fetch/status/Approved';

  const options_all = {
    method: 'GET',
    uri: url_all as string,
    json: true
  };

  const json_all: any = _request(options_all)
    .then((response: any) => {
      return consolidateResult(response);
    })
    .catch((err: any) => {
      //console.log('_request error: ' + err);
      throw new Error('_request error: ' + err);
    });
  return json_all;
}

function aliasSynonyms({
  symbol_alias,
  _request = request
}: {
    symbol_alias: string,
    _request?: typeof request
  }) {
  const url_aliassymbol = `https://rest.genenames.org/fetch/alias_symbol/${symbol_alias}`;

  const options_aliassymbol = {
    method: 'GET',
    uri: url_aliassymbol as string,
    json: true
  };

  const json_aliassymbol: any = _request(options_aliassymbol)
    .then((response: any) => {
      return consolidateResult(response);
    })
    .catch((err: any) => {
      //console.log('_request error: ' + err);
      throw new Error('_request error: ' + err);
    });

  return json_aliassymbol;
}

function consolidateResult({
  response
}:{
    response: any
  }) {
    if ( !R.isNil(response.docs) ) {
      const filterUndefined = R.pipe(R.prop('alias_symbol'), R.isNil, R.not);
      const definedAlias = R.filter(filterUndefined, response.docs);
      return R.pipe(R.map(R.pick(['symbol', 'alias_symbol'])), R.map(R.values), R.map(R.flatten))(definedAlias);

     /*
      * TO-DO:  A potential problem maybe that one alias_symbol can belong to multiple symbols.
      *         So it maybe useful to remove those alias_symbols, which belong to multiple symbols.
      *         Example: A --> B,C,D
      *                  E --> B,F,G
      *                  Remove B, because it is a synonyms for A and E(?)
      */

    } else {
      return [];
    }
  }
