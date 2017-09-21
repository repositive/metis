import * as _request from 'request-promise';
import * as Ajv from 'ajv';
import * as fs from 'fs';

//-----------------------

const schema: any = JSON.parse(fs.readFileSync('./schemas/annotate-is-valid.json', 'utf8'));
const ajv = new Ajv({ allErrors: true, verbose: true });

function confidenceScoreF(string: string) {
  const obj = {
    'LOW': 0,
    'MEDIUM': 0,
    'GOOD': 0,
    'HIGH': 0
  };
  obj[string] = 1;
  return obj;
}

export default async function annotate({ payload, _ajv = ajv, _schema = schema }: { payload: { field: string, term: string }, _ajv: typeof ajv, _schema: typeof schema }) {

  const data: any = payload;
  const { field, term } = payload;

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

  const json: any = await _request(options)
    .then((res: any) => {
      return res;
    })
    .catch((err: any) => {
      throw new Error('_request error: ' + err);
    });

  // if there is no match, returns [undefined]
  // if there are multiple matches, returns all.

  if (json.length > 0 && json[0] !== undefined) {
    return json.map((x: any) => {
      const uriSplit = x._links.olslinks[0].semanticTag.split('/');

      // make ontologyShortName equal to ontology accession prefix
      let short_name = uriSplit.slice(-1)[0].split('_')[0].toLowerCase();
      if (['format', 'operation', 'topic'].indexOf(short_name) > -1) short_name = 'edam';
      if (short_name === 'orphanet') short_name = 'ordo';

      // const confidenceScoreF = R.cond([
      //   [R.equals('HIGH'), R.always(1)],
      //   [R.equals('GOOD'), R.always(0.75)],
      //   [R.equals('MEDIUM'), R.always(0.5)],
      //   [R.equals('LOW'), R.always(0.25)]
      // ]);

      return {
        term: x.annotatedProperty.propertyValue.toLowerCase(),
        iri: x._links.olslinks[0].semanticTag,
        confidence: confidenceScoreF(x.confidence),

        //  also storing which ontology it comes from
        source: x.derivedFrom.provenance.source.uri,
        short_name // shortname from IRI
      };

    });

  } else {
    return; // if there is no match, returns undefined
  }

}

