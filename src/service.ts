import irisSetup from '@repositive/iris';
import { inject } from '@repositive/iris';

import * as config from 'config';

import { get } from './Annotation/controllerAnnotate';
import { getSynonyms, populateSynonyms, getAllSynonyms, toFileSynonyms } from './Synonyms/controllerSynonyms';


import { Pool } from 'pg';

const pack = require('../package.json');

/**
 * @desc This function initializes Metis, so that it can respond to iris requests.
 * @param {JSON} config - Pass configuration file.
 * @param {Object} irisSetup - Pass iris setup.
 * @param {JSON} pack - Pass package.json.
 * @param {Object} Pool - Pass postgres element to work with database.
 */
export default async function init({
  _config = config,
  _irisSetup = irisSetup,
  _pack = pack,
  _Pool = Pool
}: {
    _config?: typeof config,
    _irisSetup?: typeof irisSetup,
    _pack?: { version: string },
    _Pool?: typeof Pool
  }): Promise<void> {
  const irisOpts = _config.get<any>('iris');
  const iris = await _irisSetup(irisOpts);

  const pgOpts = _config.get<any>('db');
  const postgres = new _Pool(pgOpts);
  postgres.on('error', (err: Error) => {
    console.error(err.stack);
    process.exit(1);
  });

  iris.register({
    pattern: 'status.metis',
    async handler(msg: any) {
      return {
        name: _pack.name,
        version: _pack.version
      };
    }
  });

  const _getHandler = inject({ args: { _postgres: postgres }, func: get });
  iris.register({
    pattern: 'action.annotate.get',
    handler: _getHandler
  });


  const _getSynonymsHandler = inject({ args: { _postgres: postgres }, func: getSynonyms });
  iris.register({
    pattern: 'action.synonyms.get',
    handler: _getSynonymsHandler
  });

  const _populateSynonymsHandler = inject({ args: { _postgres: postgres }, func: populateSynonyms });
  iris.register({
    pattern: 'action.synonyms.populate',
    handler: _populateSynonymsHandler
  });

  const _allSynonymsHandler = inject({ args: { _postgres: postgres }, func: getAllSynonyms });
  iris.register({
    pattern: 'action.synonyms.all',
    handler: _allSynonymsHandler
  });

  const _toFileSynonymsHandler = inject({ args: { _postgres: postgres }, func: toFileSynonyms });
  iris.register({
    pattern: 'action.synonyms.toFile',
    handler: _allSynonymsHandler
  });
}
