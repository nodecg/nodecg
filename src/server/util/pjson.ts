import * as path from 'node:path';
import * as fs from 'node:fs';
import { nodecgRootPath } from '../../shared/utils/rootPath';

const pjsonPath = path.join(nodecgRootPath, 'package.json');
const rawContents = fs.readFileSync(pjsonPath, 'utf8');
const pjson = JSON.parse(rawContents);
export default pjson;
