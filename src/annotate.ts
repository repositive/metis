import * as _request from 'request-promise';
import * as Ajv from 'ajv';
import * as fs from 'fs';

//-----------------------

const schema: any = JSON.parse(fs.readFileSync('./schemas/annotate-is-valid.json', 'utf8'));
const ajv = new Ajv({ allErrors: true, verbose: true });

export default async function annotate({payload, _ajv = ajv, _schema = schema}: { payload: { field: string, term: string }, _ajv: typeof ajv, _schema: typeof schema}) {

  const data: any = payload;
  const {field, term} = payload;

  const valid = ajv.validate(schema, data);
  if (!valid) {
    console.log(ajv.errors);
    throw new Error('Payload schema error');
  }

  const ontologyDict = {
    'assay': 'efo,edam',
    'technology': 'efo,edam',
    'disease': 'efo,hp',
    'tissue': 'efo,hp'
  };

  const ontology = ontologyDict[field];

  const excludedTerms = ['n/a', 'na', 'none', 'not available', 'not specified', 'other', 'unavailable', 'unknown', 'unspecified'];

  if (!term || excludedTerms.indexOf(term.toLowerCase()) > -1) {
    return; // if term is excluded return undefined
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
      //console.error('_request error: ' + err);
      throw new Error('_request error: ' + err);
    });

  json = json[0];
  //console.log(JSON.stringify(json, undefined, 2));
  // if there is no match, returns undefined
  // if there are multiple matches, returns only the first one.. check this is appropriate.

  if (json) {

    const uriSplit = json._links.olslinks[0].semanticTag.split('/');

    // make ontologyShortName equal to ontology accession prefix
    let ontologyShortName = uriSplit.slice(-1)[0].split('_')[0].toLowerCase();
    if (['format', 'operation', 'topic'].indexOf(ontologyShortName) > -1) ontologyShortName = 'edam';
    if (ontologyShortName === 'orphanet') ontologyShortName = 'ordo';

    const result = {
      originalTerm: term,
      ontologyTerm: json.annotatedProperty.propertyValue.toLowerCase(),
      ontologyIRI: json._links.olslinks[0].semanticTag,
      ontologyConfidence: json.confidence,

      //  also storing which ontology it comes from
      ontologySource: json.derivedFrom.provenance.source.uri,
      ontologyShortName // shortname from IRI

    };
    //console.log(result);
    return result;
  }

  return; // if there is no match, returns undefined
}
