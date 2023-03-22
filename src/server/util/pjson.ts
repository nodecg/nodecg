// Native
import path from 'path';
import fs from 'fs';

// Packages
import appRootPath from 'app-root-path';

const pjsonPath = path.join(appRootPath.path, 'package.json');
const rawContents = fs.readFileSync(pjsonPath, 'utf8');
const pjson = JSON.parse(rawContents);
export default pjson;
