
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
