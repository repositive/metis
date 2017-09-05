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

  const jsonResponse: any = await _request(options)
    .then((result: any) => {
      return result;
    })
    .catch((err: any) => {
      //console.log('_request error: ' + err);
      throw new Error('_request error: ' + err);
    });

  if (jsonResponse) {
    //console.log(JSON.stringify(jsonResponse, undefined, 2));
    const parsed = jsonResponse;

    const result: any = {
      ontologyIRI: iri as string,
      ontologyTerm: parsed.label as string,
      synonyms: parsed.synonyms as any[]
    };

    //console.log(result);
    return result;
  } else { return; }
}

//--------------

//getSynonyms({ payload: { ontologyIRI: 'http://www.ebi.ac.uk/efo/EFO_0003843', ontologyShortName: 'efo' } });
