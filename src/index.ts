import init from './service';

init({})
  .then(() => {
    console.log(`Service is running`);
  })
  .catch(console.error);
