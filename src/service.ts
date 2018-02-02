import irisSetup from '@repositive/iris';
import { inject } from '@repositive/iris';

import * as config from 'config';

import { get } from './controllerAnnotate';
import { getSynonyms } from './controllerSynonyms';

import { Pool } from 'pg';

const pack = require('../package.json');

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
}
