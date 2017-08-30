import irisSetup from '@repositive/iris';
import * as config from 'config';

const pack = require('../package.json');

export default async function init({
  _config = config,
  _irisSetup = irisSetup,
  _pack = pack
}: {
  _config ? : typeof config,
  _irisSetup ? : typeof irisSetup,
  _pack ? : { version: string }
}): Promise < void > {
  const irisOpts = _config.get<any>('iris');

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
}
