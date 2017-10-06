import irisSetup from '@repositive/iris';
import { inject } from '@repositive/iris';

import * as config from 'config';
import { ingestion, search } from './controller';
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
  const pgOpts = _config.get<any>('db');
  const postgres = new _Pool(pgOpts);
  const iris = await _irisSetup(irisOpts);

  iris.register({
    pattern: 'status.metis',
    async handler(msg: any) {
      return {
        name: _pack.name,
        version: _pack.version
      };
    }
  });

  const _ingestionHandler = inject({ args: { _postgres: postgres }, func: ingestion });
  iris.register({
    pattern: 'action.annotate.ingestion',
    handler: _ingestionHandler
  });

  const _searchHandler = inject({ args: { _postgres: postgres }, func: search });
  iris.register({
    pattern: 'action.annotate.search',
    handler: _searchHandler
  });
}
