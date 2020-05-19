// Native
import path from 'path';

// Packages
import appRootPath from 'app-root-path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pjson = require(path.join(appRootPath.path, 'package.json'));
export default pjson;
