import * as _request from 'request-promise';
import * as fs from 'fs';
import * as Ajv from 'ajv';

//-----------------------
const schema: any = JSON.parse(fs.readFileSync('./schemas/synonyms-is-valid.json', 'utf8'));
const ajv = new Ajv({ allErrors: true, verbose: true });

export default async function getSynonyms({ payload, _ajv = ajv, _schema = schema }: { payload: { ontologyIRI: string, ontologyShortName: string }, _ajv: typeof ajv, _schema: typeof schema }) {

  const data: any = payload;

  const valid = ajv.validate(schema, data);
  if (!valid) {
    console.log(ajv.errors);
    throw new Error('Payload schema error');
  }

  const ontology: string = payload.ontologyShortName;
  const iri: string = payload.ontologyIRI;
  const doubleEncodedIRI = encodeURIComponent(encodeURIComponent(iri));

  const url = `http://www.ebi.ac.uk/ols/api/ontologies/${ontology}/terms/${doubleEncodedIRI}`;

  const options = {
    method: 'GET',
    uri: url as string,
    json: true
  };

  const json: any = await _request(options)
    .then((res: any) => {
      return res;
    })
    .catch((err: any) => {
      //console.log('_request error: ' + err);
      throw new Error('_request error: ' + err);
    });

  const result: any = {
    ontologyIRI: iri as string,
    ontologyTerm: json.label as string,
    synonyms: json.synonyms as any[]
  };

  return result;
}
