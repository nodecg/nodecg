import fs from "node:fs";

export const existsSync = (path: string) => fs.existsSync(path);
