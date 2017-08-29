// pass a dataset to function
// for each attributes field
// iterate over array
// value = original term
// return standardised value and iri, and confidence
// add this to element of array, update array.
// At end, need to update record in db.
//----------------------------------------

import * as request from 'request-promise';

//-----------------------

export default async function annotate(field: string, term: string | undefined, _request: any = request) {

  let result: any = { originalTerm: term };

  const ontologyDict = {
    'assay': 'efo,edam',
    'technology': 'efo,edam',
    'disease': 'efo,hp',
    'tissue': 'efo,hp'
  };

  const ontology = ontologyDict[field];

  const excludedTerms = ['n/a', 'na', 'none', 'not available', 'other', 'unavailable', 'unknown', 'unspecified'];

  if (!term || excludedTerms.indexOf(term.toLowerCase()) > -1) {
    return result;
  }

  const options = {
    method: 'GET',
    uri: 'http://www.ebi.ac.uk/spot/zooma/v2/api/services/annotate',
    qs: {
      propertyValue: term.toLowerCase(),
      filter: `required:[gxa],ontologies:[${ontology}]`
    },
    json: true
  };

  let json: any = await _request(options)
    .then((res: any) => {
      return res;
    })
    .catch((err: any) => {
      console.error(err);
      // API call failed...
      console.log('_request error');
    });

  json = json[0];
  //console.log(JSON.stringify(json, undefined, 2));
  // if there is no match, returns undefined
  // if there are multiple matches, returns only the first one.. check this is appropriate.

  if (json) {

    const uriSplit = json._links.olslinks[0].semanticTag.split('/');
    const ontologyShortName = uriSplit.slice(-2)[0];

    result = {
      ...result,
      originalTerm: term,
      ontologyTerm: json.annotatedProperty.propertyValue.toLowerCase(),
      ontologyIRI: json._links.olslinks[0].semanticTag,
      ontologyConfidence: json.confidence,

      //  also storing which ontology it comes from
      ontologySource: json.derivedFrom.provenance.source.uri,
      ontologyShortName // shortname from IRI

    };
  }

  //console.log(result);
  return result; // if there is no match, returns object with original term
}

//----------------------------------------

//annotate('tissue', 'heart');
