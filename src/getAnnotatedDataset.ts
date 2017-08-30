import annotate from './utils/annotate';

//------------------------

export async function updateDataset(dataset: any) {

  const keysToAnnotate: any[] = ['assay', 'technology', 'tissue', 'disease'];

  for (const key in dataset.properties.attributes) { // depends on data model
    if (keysToAnnotate.indexOf(key) > -1) {
      const array = dataset.properties.attributes[key];

      for (let index = 0; index < array.length; index++) { // can't do await in forEach loop
        if (!array[index] || !array[index].ontologyTerm) {
          const term = array[index]; // or let term = array[index].originalTerm; depends on data model
          await annotate(key, term)
            .then(result => {
              array[index] = result;
            })
            .catch(err => {
              console.error(err);
              console.log('annotate error - API call failed...');
            });
        }
      }
    }
  }
  //console.log(JSON.stringify(dataset, undefined, 2));
  return dataset;
}

//-------------------------------
