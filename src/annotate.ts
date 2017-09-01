import * as _request from 'request-promise';

//-----------------------

export default async function annotate(opts: { payload: { field: string, term: string } }) {

  const field = opts.payload.field;
  const term = opts.payload.term;

  const ontologyDict = {
    'assay': 'efo,edam',
    'technology': 'efo,edam',
    'disease': 'efo,hp',
    'tissue': 'efo,hp'
  };

  const ontology = ontologyDict[field];

  const excludedTerms = ['n/a', 'na', 'none', 'not available', 'not specified', 'other', 'unavailable', 'unknown', 'unspecified'];

  if (!term || excludedTerms.indexOf(term.toLowerCase()) > -1) {
    return; // if term is excluded return nothing
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
      console.error('_request error: ' + err);
    });

  json = json[0];
  //console.log(JSON.stringify(json, undefined, 2));
  // if there is no match, returns undefined
  // if there are multiple matches, returns only the first one.. check this is appropriate.

  if (json) {

    const uriSplit = json._links.olslinks[0].semanticTag.split('/');
    const ontologyShortName = uriSplit.slice(-2)[0];

    const result = {
      originalTerm: term,
      ontologyTerm: json.annotatedProperty.propertyValue.toLowerCase(),
      ontologyIRI: json._links.olslinks[0].semanticTag,
      ontologyConfidence: json.confidence,

      //  also storing which ontology it comes from
      ontologySource: json.derivedFrom.provenance.source.uri,
      ontologyShortName // shortname from IRI

    };

    return result;
  }

  //console.log(result);
  return; // if there is no match, returns nothing
}
