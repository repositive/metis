INSERT INTO synonyms(list_synonyms, last_update) VALUES ('ABC,BCD,DEF',CURRENT_TIMESTAMP);

INSERT INTO symbols(synonyms_uid, symbol) VALUES (1, 'ABC');
INSERT INTO symbols(synonyms_uid, symbol) VALUES (1, 'BCD');
INSERT INTO symbols(synonyms_uid, symbol) VALUES (1, 'DEF');