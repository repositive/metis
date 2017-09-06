import * as _request from 'request-promise';

//-----------------------

export default async function getSynonyms(opts: { payload: { ontologyIRI: string, ontologyShortName: string } }) {

  const ontology: string = opts.payload.ontologyShortName;
  const iri: string = opts.payload.ontologyIRI;
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
