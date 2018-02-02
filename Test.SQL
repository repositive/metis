SELECT * FROM synonyms;

SELECT * FROM symbols;

SELECT list_synonyms
FROM synonyms
INNER JOIN symbols
ON synonyms.id = symbols.synonyms_uid
WHERE symbols.symbol = 'ABC'