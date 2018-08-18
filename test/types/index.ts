import {NodeCG} from '../../types'

declare const serverNodeCG: NodeCG<'server'>;
declare const browserNodeCG: NodeCG<'browser'>;

new serverNodeCG.Logger('foo')
new browserNodeCG.Logger('bar')
