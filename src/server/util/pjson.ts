// Native
import path from 'path';
import fs from 'fs';

// Ours
import rootPath from '../../shared/utils/rootPath';

const pjsonPath = path.join(rootPath.path, 'package.json');
const rawContents = fs.readFileSync(pjsonPath, 'utf8');
const pjson = JSON.parse(rawContents);
export default pjson;
