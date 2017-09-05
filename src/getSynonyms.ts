import * as _request from 'request-promise';

//-----------------------

export default async function getSynonyms(opts: { payload: { ontologyIRI: string, ontologyShortName: string } }) {

  const ontology = opts.payload.ontologyShortName;
  const iri = opts.payload.ontologyIRI;
  const doubleEncodedIRI = encodeURIComponent(encodeURIComponent(iri));

  const url = `http://www.ebi.ac.uk/ols/api/ontologies/${ontology}/terms/${doubleEncodedIRI}`;

  const options = {
    method: 'GET',
    uri: url,
    json: true
  };

  const jsonResult: any = await _request(options)
    .then((res: any) => {
      return res;
    })
    .catch((err: any) => {
      //console.log('_request error: ' + err);
      throw new Error('_request error: ' + err);
    });

  // if there is no match, returns undefined
  // if there are multiple matches, returns only the first one.. check this is appropriate.

  if (jsonResult) {

    const parsed = jsonResult;

    const result = {
      ontologyIRI: iri,
      ontologyTerm: parsed.label,
      synonyms: parsed.synonyms
    };

    console.log(result);
    return result;
  }

  //console.log(result);
  return; // if there is no match, returns nothing
}

//--------------

getSynonyms({ payload: { ontologyIRI: 'http://www.ebi.ac.uk/efo/EFO_0003843', ontologyShortName: 'efo' } });
