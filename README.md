# Metis
Metis is the service that annotates datasets with ontology terms using the Zooma application developed by the SPOT team at EBI. Metis is also able to retrieve synonyms for an ontology term / ontology ID.

Metis is named after the ancient Greek Titaness of good counsel, advice, planning, cunning, craftiness, and wisdom [[1](http://greekmythology.wikia.com/wiki/Metis), [2](https://en.wikipedia.org/wiki/Metis_(mythology))].
It takes a field and term and responds with ontology terms for 'assay'/'technology'/'tissue'/'disease' fields.

1. [http://greekmythology.wikia.com/wiki/Metis](http://greekmythology.wikia.com/wiki/Metis)
2. [https://en.wikipedia.org/wiki/Metis_(mythology)](https://en.wikipedia.org/wiki/Metis_(mythology))

### Update Datasets with Ontology Terms

Metis uses Iris to register a `action.annotate.get` pattern.

The ingestion payload must be in the [format](schemas/get-schema.json):
```ts
type Payload = {
  term: string;
  field?: string;
  force?: boolean;
}
```


The response is always an array of matched terms:

```ts
type Response = [{
  term: string; // The standard term matched
  iri: string; // The Ontology Term IRI
  confidence: number; // How likely it is that the match is correct
  source: string; // The matched ontoloty URL
  short_name: string; // The matched ontology name identifier.
}]
```

### Update Datasets by single list of Synonyms

Metis uses Iris to register a `action.synonyms.get` pattern.

The ingestion payload must be in the [format](schemas/synonyms-is-valid.json):
```ts
type Payload = {
  symbol: string;
}
```


The response is always an array of matched terms:

```ts
type Response = [{
  list_synonyms: string; // A list of all synonyms retrieved via HUGO
}]
```

### Populate Datasets with Synonyms

Metis uses Iris to register a `action.annotate.populate` pattern.

### Return list of all lists of Synonyms

Metis uses Iris to register a `action.annotate.populate` pattern.



>>>>>>> origin/master

## Setting up the database

Metis uses postgres to store a lookup table and accelerate the process of returning existing results from previous queries. To setup the database create a new  database called `metis` and execute [`setup.sql`](setup.sql).

## About Docker Compose

The current version of [Iris](https://github.com/repositive/iris-js) requires an AMQP server. The docker-compose comes preconfigured to connect to one out of the box. You'll need to run an instance yourself and attach it to the network rabbit, and to the postgres database. For this purpose please use the devops service:

**Manual approach:**
**Create the postgres network**
```bash
$ docker network create postgres
```

**Run a postgres process**
```bash
$ docker run --name=postgres --network=postgres -p 5432:5432 -d registry.repositive.io:5000/postgres-data
```


**Create the rabbit network**
```bash
$ docker network create rabbit
```

**Run a rabbitmq process**
```bash
$ docker run --name=rabbit --network=rabbit -p 5672:5672 -p 15672:15672 -d rabbitmq:3-management
```


**Use devops service to start postgres network and rabbit network:**
Open the devops service

**Create postgres network**

```bash
$ cd development-environment/pdx/infra
$ docker-compose up -d postgres
```

**Create rabbit network**

```bash
$ cd development-environment/pdx/infra
$ docker-compose up -d rabbit
```

Now postgres and rabbit are running!

Please return to the metis file system.

If you run  `$ docker-compose up` now you should be able to see this service running using the iris cli `$ iris status`

## Notes

The repository has a `precommit` hook that will trigger linter for each commit. You can check it in the scripts section of the `package.json`
