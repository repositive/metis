import * as _request from 'request-promise';
import * as fs from 'fs';
import * as Ajv from 'ajv';
import { request } from 'https';


export default async function synonyms({
   payload }: { payload: { symbol: string } }) {

  const data: any = payload;
  const symbol: string = payload.symbol;
  const url_symbol = `https://rest.genenames.org/fetch/symbol/${symbol}`;

  const options_symbol = {
    method: 'GET',
    uri: url_symbol as string,
    json: true
  };

  const result: any = await _request(options_symbol)
    .then((res: any) => {
      if (res.response.docs.length === 1 && typeof res.response.docs[0] !== 'undefined') {
          return res.response.docs[0].alias_symbol.concat(res.response.docs[0].symbol);
      }else {
        const json_alias = retrieveAliasSynonyms({ symbol_alias : symbol });
        return json_alias;
      }
    })
    .catch((err: any) => {
      //console.log('_request error: ' + err);
      throw new Error('_request error: ' + err);
    });

  console.log(result);
  return result;
}

function retrieveAliasSynonyms({ symbol_alias }: { symbol_alias: string }) {
 const url_aliassymbol = `https://rest.genenames.org/fetch/alias_symbol/${symbol_alias}`;

 const options_aliassymbol = {
   method: 'GET',
   uri: url_aliassymbol as string,
   json: true
 };

 const json_aliassymbol: any = _request(options_aliassymbol)
   .then((res: any) => {
     if (res.response.docs.length === 1 && typeof res.response.docs[0] !== 'undefined') {
        return res.response.docs[0].alias_symbol.concat(res.response.docs[0].symbol);
     }else {
       return [];
     }
   })
   .catch((err: any) => {
     //console.log('_request error: ' + err);
     throw new Error('_request error: ' + err);
   });

 return json_aliassymbol;
}
