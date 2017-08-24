// pass a dataset to function
// for each attributes field
// iterate over array
// value = original term
// return standardised value and iri, and confidence
// add this to element of array, update array.
// At end, need to update record in db.

import * as request from 'request-promise';

//----------------------------------------

const testDataset = {
    'id': '007d4b51-3bb9-467e-9569-318d19112cc5',
    'description': 'An Integrated Genomic Approach to Alzheimer Disease, Alzheimer\'s Disease and Gene Discovery on Chromosome 9 SNP and microsatellite genotypes.',
    'external_id': 'NG00014',
    'datasource_id': 'e36f2d0b-6b04-44cf-9258-9bd7e7d45739',
    'access': 'Restricted',
    'created_at': '2017-07-14 14:11:32.498+00',
    'url': 'https:\/\/www.niagads.org\/datasets\/NG00014',
    'title': 'Alzheimer\'s Disease and Gene Discovery on Chromosome 9',
    'assay': 'Targeted Genotyping',
    'updated_at': '2017-07-14 14:11:32.498+00',
    'tech': 'Not Specified',
    'properties': {
        'raw_id': 'NIAGADS-56e49e17c2427ff5405ecc45d3a5c16d',
        'attributes': {
            'pmid': ['15455263', '12677449', '14564669', '14570706', '15234467', '15987928', '16199552', '16093727', '16198584', '16222332', '15985314'],
            'assay': ['Targeted Genotyping', 'WXS'],
            'technology': ['none'],
            'disease': ['Alzheimer\'s disease ', 'viiat'],
            'samples': [6135]
        }
    }
};

export default async function updateDataset(dataset: any) {

    const keysToAnnotate = ['assay', 'technology', 'tissue', 'disease'];

    for (const key in dataset.properties.attributes) { // depends on data model
        if (keysToAnnotate.includes(key)) {
            const array = dataset.properties.attributes[key];

            for (let index = 0; index < array.length; index++) { // can't do await in forEach loop
                if (!array[index].ontologyTerm) {
                    const term = array[index]; // or let term = array[index].originalTerm; depends on data model
                    array[index] = await annotate(key, term);
                }
            }
        }
    }
    console.log(JSON.stringify(dataset, undefined, 2));
    return dataset;
}

async function annotate(field: string, term: string) {

    const ontologyDict = {
        'assay': 'efo,edam',
        'technology': 'efo,edam',
        'disease': 'efo,hp',
        'tissue': 'efo,hp'
    };

    const ontology = ontologyDict[field];

    const excludedTerms = ['n/a', 'na', 'none', 'not available', 'other', 'unavailable', 'unknown', 'unspecified'];

    if (excludedTerms.includes(term.toLowerCase())) {
        return;
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

    let json = await request(options);
    json = json[0];
    // if there is no match, returns undefined
    // if there are multiple matches, returns only the first one.. check this is appropriate.

    let result = { originalTerm: term };
    if (json) {

        const uriSplit = json._links.olslinks[0].semanticTag.split('/');
        //let ontologyShortName = uriSplit.slice(-1)[0].split('.')[0];
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

    return result; // if there is no match, returns object with original term
}

//----------------------------------------

/*annotate('assay', 'Targeted Genotyping')
    .then(result => {
        console.log(JSON.stringify(result, null, 2));
    })
    .catch(err => {
        console.error(err);
        // API call failed...
    });*/

updateDataset(testDataset);
