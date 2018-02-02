-- Drop existing tables
    DROP TABLE "original_terms";
    DROP TABLE "ontology_terms";
    DROP TABLE "symbols";
    DROP TABLE "synonyms";
    

-- create metis tables  
  CREATE TABLE "ontology_terms" (
    "id" serial,
    "ontology_uri" text,
    "ontology_term" text,
    "source_uri" text,
    "short_name" text,
    PRIMARY KEY ("id"),
    UNIQUE ("ontology_term")
);


CREATE TABLE "original_terms" (
    "id" serial,
    "original" text,
    "ontology_uid" integer,
    "confidence" float,
    PRIMARY KEY ("id"),
    UNIQUE ("original"),
    FOREIGN KEY ("ontology_uid") REFERENCES "public"."ontology_terms"("id")
);

CREATE TABLE "synonyms" (
    "id" serial,
    "list_synonyms" text,
    "last_update" timestamp,
    UNIQUE ("list_synonyms"),
    PRIMARY KEY ("id")
);

CREATE TABLE "symbols" (
    "id" serial,
    "synonyms_uid" integer,
    "symbol" text,
    PRIMARY KEY ("id"),
    UNIQUE ("symbol"),
    FOREIGN KEY ("synonyms_uid") REFERENCES "public"."synonyms"("id")
);

select * from ontology_terms;