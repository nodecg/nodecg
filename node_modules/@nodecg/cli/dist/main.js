#!/usr/bin/env node

// src/bin/nodecg.ts
import chalk7 from "chalk";
import spawn5 from "nano-spawn";

// src/index.ts
import { Command as Command7 } from "commander";

// package.json
var package_default = {
  name: "@nodecg/cli",
  version: "0.0.0",
  type: "module",
  main: "dist/main.js",
  files: [
    "dist"
  ],
  scripts: {
    build: "run-s build:*",
    "build:tsc": "tsc -b",
    "build:esbuild": "del-cli dist && esbuild src/bin/nodecg.ts --bundle --format=esm --sourcemap --platform=node --target=node18 --outfile=dist/main.js --packages=external",
    dev: "run-p dev:*",
    "dev:tsc": "tsc -b --watch --preserveWatchOutput",
    "dev:esbuild": "del-cli dist && npm run build:esbuild -- --watch"
  },
  dependencies: {
    "@inquirer/prompts": "^7.2.1",
    ajv: "^8.17.1",
    chalk: "^5.4.1",
    commander: "^13.0.0",
    "hosted-git-info": "^8.0.2",
    "json-schema-to-typescript": "^15.0.3",
    "nano-spawn": "^0.2.0",
    "npm-package-arg": "^12.0.1",
    semver: "^7.6.3",
    tar: "^7.4.3"
  },
  devDependencies: {
    "@types/hosted-git-info": "^3.0.5",
    "@types/node": "20",
    "@types/npm-package-arg": "^6.1.4",
    "@types/semver": "^7.5.8",
    "del-cli": "^6.0.0",
    esbuild: "^0.24.2",
    "type-fest": "^4.33.0",
    typescript: "~5.7.3",
    "npm-run-all2": "^7.0.2"
  },
  publishConfig: {
    access: "public"
  }
};

// src/commands/defaultconfig.ts
import fs2 from "node:fs";
import path2 from "node:path";
import { Ajv } from "ajv";
import chalk from "chalk";
import "commander";

// src/lib/util.ts
import fs from "node:fs";
import path from "node:path";
function pathContainsNodeCG(pathToCheck) {
  const pjsonPath = path.join(pathToCheck, "package.json");
  try {
    const pjson = JSON.parse(fs.readFileSync(pjsonPath, "utf-8"));
    return pjson.name.toLowerCase() === "nodecg";
  } catch {
    return false;
  }
}
function getNodeCGPath() {
  let curr = process.cwd();
  do {
    if (pathContainsNodeCG(curr)) {
      return curr;
    }
    const nextCurr = path.resolve(curr, "..");
    if (nextCurr === curr) {
      throw new Error(
        "NodeCG installation could not be found in this directory or any parent directory."
      );
    }
    curr = nextCurr;
  } while (fs.lstatSync(curr).isDirectory());
  throw new Error(
    "NodeCG installation could not be found in this directory or any parent directory."
  );
}
function isBundleFolder(pathToCheck) {
  const pjsonPath = path.join(pathToCheck, "package.json");
  if (fs.existsSync(pjsonPath)) {
    const pjson = JSON.parse(fs.readFileSync(pjsonPath, "utf8"));
    return typeof pjson.nodecg === "object";
  }
  return false;
}
function getCurrentNodeCGVersion() {
  const nodecgPath = getNodeCGPath();
  return JSON.parse(fs.readFileSync(`${nodecgPath}/package.json`, "utf8")).version;
}

// src/commands/defaultconfig.ts
var ajv = new Ajv({ useDefaults: true, strict: true });
function defaultconfigCommand(program) {
  program.command("defaultconfig [bundle]").description("Generate default config from configschema.json").action(action);
}
function action(bundleName) {
  const cwd = process.cwd();
  const nodecgPath = getNodeCGPath();
  if (!bundleName) {
    if (isBundleFolder(cwd)) {
      bundleName = bundleName ?? path2.basename(cwd);
    } else {
      console.error(
        `${chalk.red("Error:")} No bundle found in the current directory!`
      );
      return;
    }
  }
  const bundlePath = path2.join(nodecgPath, "bundles/", bundleName);
  const schemaPath = path2.join(
    nodecgPath,
    "bundles/",
    bundleName,
    "/configschema.json"
  );
  const cfgPath = path2.join(nodecgPath, "cfg/");
  if (!fs2.existsSync(bundlePath)) {
    console.error(`${chalk.red("Error:")} Bundle ${bundleName} does not exist`);
    return;
  }
  if (!fs2.existsSync(schemaPath)) {
    console.error(
      `${chalk.red("Error:")} Bundle ${bundleName} does not have a configschema.json`
    );
    return;
  }
  if (!fs2.existsSync(cfgPath)) {
    fs2.mkdirSync(cfgPath);
  }
  const schema = JSON.parse(
    fs2.readFileSync(schemaPath, "utf8")
  );
  const configPath = path2.join(nodecgPath, "cfg/", `${bundleName}.json`);
  if (fs2.existsSync(configPath)) {
    console.error(
      `${chalk.red("Error:")} Bundle ${bundleName} already has a config file`
    );
  } else {
    try {
      const validate = ajv.compile(schema);
      const data = {};
      validate(data);
      fs2.writeFileSync(configPath, JSON.stringify(data, null, 2));
      console.log(
        `${chalk.green("Success:")} Created ${chalk.bold(bundleName)}'s default config from schema
`
      );
    } catch (error) {
      console.error(chalk.red("Error:"), error);
    }
  }
}

// src/commands/install.ts
import fs4 from "node:fs";
import os2 from "node:os";
import path4 from "node:path";
import chalk3 from "chalk";
import "commander";
import "hosted-git-info";
import spawn3 from "nano-spawn";
import npa from "npm-package-arg";
import semver from "semver";

// src/lib/fetch-tags.ts
import spawn from "nano-spawn";
async function fetchTags(repoUrl) {
  const { stdout } = await spawn("git", [
    "ls-remote",
    "--refs",
    "--tags",
    repoUrl
  ]);
  return stdout.trim().split("\n").map((rawTag) => rawTag.split("refs/tags/").at(-1)).filter((t) => typeof t === "string");
}

// src/lib/install-bundle-deps.ts
import fs3 from "node:fs";
import os from "node:os";
import path3 from "node:path";
import chalk2 from "chalk";
import spawn2 from "nano-spawn";
async function installBundleDeps(bundlePath, installDev = false) {
  if (!isBundleFolder(bundlePath)) {
    console.error(
      `${chalk2.red("Error:")} There doesn't seem to be a valid NodeCG bundle in this folder:
	${chalk2.magenta(bundlePath)}`
    );
    process.exit(1);
  }
  const cachedCwd = process.cwd();
  if (fs3.existsSync(path3.join(bundlePath, "package.json"))) {
    try {
      process.chdir(bundlePath);
      if (fs3.existsSync(path3.join(bundlePath, "yarn.lock"))) {
        process.stdout.write(
          `Installling npm dependencies with yarn (dev: ${installDev})... `
        );
        await spawn2("yarn", installDev ? [] : ["--production"], {
          cwd: bundlePath
        });
      } else {
        process.stdout.write(
          `Installing npm dependencies (dev: ${installDev})... `
        );
        await spawn2(
          "npm",
          installDev ? ["install"] : ["install", "--production"],
          { cwd: bundlePath }
        );
      }
      process.stdout.write(chalk2.green("done!") + os.EOL);
    } catch (e) {
      process.stdout.write(chalk2.red("failed!") + os.EOL);
      console.error(e.stack);
      return;
    }
    process.chdir(cachedCwd);
  }
}

// src/commands/install.ts
function installCommand(program) {
  program.command("install [repo]").description(
    "Install a bundle by cloning a git repo. Can be a GitHub owner/repo pair or a git url.\n		    If run in a bundle directory with no arguments, installs that bundle's dependencies."
  ).option("-d, --dev", "install development npm dependencies").action(action2);
}
async function action2(repo, options) {
  const dev = options.dev || false;
  if (!repo) {
    await installBundleDeps(process.cwd(), dev);
    return;
  }
  let range = "";
  if (repo.indexOf("#") > 0) {
    const repoParts = repo.split("#");
    range = repoParts[1] ?? "";
    repo = repoParts[0] ?? "";
  }
  const nodecgPath = getNodeCGPath();
  const parsed = npa(repo);
  if (!parsed.hosted) {
    console.error(
      "Please enter a valid git repository URL or GitHub username/repo pair."
    );
    return;
  }
  const hostedInfo = parsed.hosted;
  const repoUrl = hostedInfo.https();
  if (!repoUrl) {
    console.error(
      "Please enter a valid git repository URL or GitHub username/repo pair."
    );
    return;
  }
  const bundlesPath = path4.join(nodecgPath, "bundles");
  if (!fs4.existsSync(bundlesPath)) {
    fs4.mkdirSync(bundlesPath);
  }
  const temp = repoUrl.split("/").pop() ?? "";
  const bundleName = temp.slice(0, temp.length - 4);
  const bundlePath = path4.join(nodecgPath, "bundles/", bundleName);
  process.stdout.write(`Fetching ${bundleName} release list... `);
  let tags;
  let target;
  try {
    tags = await fetchTags(repoUrl);
    target = semver.maxSatisfying(
      tags.map((tag) => semver.coerce(tag)).filter((coercedTag) => Boolean(coercedTag)),
      range
    );
    process.stdout.write(chalk3.green("done!") + os2.EOL);
  } catch (e) {
    process.stdout.write(chalk3.red("failed!") + os2.EOL);
    console.error(e.stack);
    return;
  }
  process.stdout.write(`Installing ${bundleName}... `);
  try {
    await spawn3("git", ["clone", repoUrl, bundlePath]);
    process.stdout.write(chalk3.green("done!") + os2.EOL);
  } catch (e) {
    process.stdout.write(chalk3.red("failed!") + os2.EOL);
    console.error(e.stack);
    return;
  }
  if (target) {
    process.stdout.write(`Checking out version ${target.version}... `);
    try {
      await spawn3("git", ["checkout", target.version], { cwd: bundlePath });
      process.stdout.write(chalk3.green("done!") + os2.EOL);
    } catch (_) {
      try {
        await spawn3("git", ["checkout", `v${target.version}`], {
          cwd: bundlePath
        });
        process.stdout.write(chalk3.green("done!") + os2.EOL);
      } catch (e) {
        process.stdout.write(chalk3.red("failed!") + os2.EOL);
        console.error(e.stack);
        return;
      }
    }
  }
  await installBundleDeps(bundlePath, dev);
}

// src/commands/schema-types.ts
import fs5 from "node:fs";
import path5 from "node:path";
import chalk4 from "chalk";
import "commander";
import { compileFromFile } from "json-schema-to-typescript";
function schemaTypesCommand(program) {
  program.command("schema-types [dir]").option(
    "-o, --out-dir [path]",
    "Where to put the generated d.ts files",
    "src/types/schemas"
  ).option(
    "--no-config-schema",
    "Don't generate a typedef from configschema.json"
  ).description(
    "Generate d.ts TypeScript typedef files from Replicant schemas and configschema.json (if present)"
  ).action(action3);
}
function action3(inDir, cmd) {
  const processCwd = process.cwd();
  const schemasDir = path5.resolve(processCwd, inDir || "schemas");
  if (!fs5.existsSync(schemasDir)) {
    console.error(`${chalk4.red("Error:")} Input directory does not exist`);
    return;
  }
  const outDir = path5.resolve(processCwd, cmd.outDir);
  if (!fs5.existsSync(outDir)) {
    fs5.mkdirSync(outDir, { recursive: true });
  }
  const configSchemaPath = path5.join(processCwd, "configschema.json");
  const schemas = fs5.readdirSync(schemasDir).filter((f) => f.endsWith(".json"));
  const style = {
    singleQuote: true,
    useTabs: true
  };
  const compilePromises = [];
  const compile = (input, output, cwd = processCwd) => {
    const promise = compileFromFile(input, {
      cwd,
      declareExternallyReferenced: true,
      enableConstEnums: true,
      style
    }).then(
      (ts) => fs5.promises.writeFile(output, "/* prettier-ignore */\n" + ts)
    ).then(() => {
      console.log(output);
    }).catch((err) => {
      console.error(err);
    });
    compilePromises.push(promise);
  };
  if (fs5.existsSync(configSchemaPath) && cmd.configSchema) {
    compile(configSchemaPath, path5.resolve(outDir, "configschema.d.ts"));
  }
  for (const schema of schemas) {
    compile(
      path5.resolve(schemasDir, schema),
      path5.resolve(outDir, schema.replace(/\.json$/i, ".d.ts")),
      schemasDir
    );
  }
  return Promise.all(compilePromises).then(() => {
    process.emit("schema-types-done");
  });
}

// src/commands/setup.ts
import fs6 from "node:fs";
import os3 from "node:os";
import stream from "node:stream/promises";
import { confirm } from "@inquirer/prompts";
import chalk5 from "chalk";
import "commander";
import spawn4 from "nano-spawn";
import semver2 from "semver";
import * as tar from "tar";

// src/lib/list-npm-versions.ts
async function listNpmVersions(packageName) {
  const res = await fetch(`https://registry.npmjs.org/${packageName}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch versions for ${packageName}`);
  }
  const data = await res.json();
  return Object.keys(data.versions);
}

// src/commands/setup.ts
function setupCommand(program) {
  program.command("setup [version]").option("-u, --update", "Update the local NodeCG installation").option("-k, --skip-dependencies", "Skip installing npm dependencies").description("Install a new NodeCG instance").action(decideActionVersion);
}
async function decideActionVersion(version, options) {
  let isUpdate = false;
  if (pathContainsNodeCG(process.cwd())) {
    if (!options.update) {
      console.error("NodeCG is already installed in this directory.");
      console.error(
        `Use ${chalk5.cyan("nodecg setup [version] -u")} if you want update your existing install.`
      );
      return;
    }
    isUpdate = true;
  }
  if (version) {
    process.stdout.write(
      `Finding latest release that satisfies semver range ${chalk5.magenta(version)}... `
    );
  } else if (isUpdate) {
    process.stdout.write("Checking against local install for updates... ");
  } else {
    process.stdout.write("Finding latest release... ");
  }
  let tags;
  try {
    tags = await listNpmVersions("nodecg");
  } catch (error) {
    process.stdout.write(chalk5.red("failed!") + os3.EOL);
    console.error(error instanceof Error ? error.message : error);
    return;
  }
  let target;
  if (version) {
    const maxSatisfying = semver2.maxSatisfying(tags, version);
    if (!maxSatisfying) {
      process.stdout.write(chalk5.red("failed!") + os3.EOL);
      console.error(
        `No releases match the supplied semver range (${chalk5.magenta(version)})`
      );
      return;
    }
    target = maxSatisfying;
  } else {
    target = semver2.maxSatisfying(tags, "") ?? "";
  }
  process.stdout.write(chalk5.green("done!") + os3.EOL);
  let current;
  let downgrade = false;
  if (isUpdate) {
    current = getCurrentNodeCGVersion();
    if (semver2.eq(target, current)) {
      console.log(
        `The target version (${chalk5.magenta(target)}) is equal to the current version (${chalk5.magenta(current)}). No action will be taken.`
      );
      return;
    }
    if (semver2.lt(target, current)) {
      console.log(
        `${chalk5.red("WARNING:")} The target version (${chalk5.magenta(target)}) is older than the current version (${chalk5.magenta(current)})`
      );
      const answer = await confirm({
        message: "Are you sure you wish to continue?"
      });
      if (!answer) {
        console.log("Setup cancelled.");
        return;
      }
      downgrade = true;
    }
  }
  if (semver2.lt(target, "v2.0.0")) {
    console.error("CLI does not support NodeCG versions older than v2.0.0.");
    return;
  }
  await installNodecg(current, target, isUpdate);
  if (!options.skipDependencies) {
    await installDependencies();
  }
  if (isUpdate) {
    const verb = downgrade ? "downgraded" : "upgraded";
    console.log(`NodeCG ${verb} to ${chalk5.magenta(target)}`);
  } else {
    console.log(`NodeCG (${target}) installed to ${process.cwd()}`);
  }
}
async function installNodecg(current, target, isUpdate) {
  if (isUpdate) {
    const deletingDirectories = [".git", "build", "scripts", "schemas"];
    await Promise.all(
      deletingDirectories.map(
        (dir) => fs6.promises.rm(dir, { recursive: true, force: true })
      )
    );
  }
  process.stdout.write(`Downloading ${target} from npm... `);
  const targetVersion = semver2.coerce(target)?.version;
  if (!targetVersion) {
    throw new Error(`Failed to determine target NodeCG version`);
  }
  const releaseResponse = await fetch(
    `http://registry.npmjs.org/nodecg/${targetVersion}`
  );
  if (!releaseResponse.ok) {
    throw new Error(
      `Failed to fetch NodeCG release information from npm, status code ${releaseResponse.status}`
    );
  }
  const release = await releaseResponse.json();
  process.stdout.write(chalk5.green("done!") + os3.EOL);
  if (current) {
    const verb = semver2.lt(target, current) ? "Downgrading" : "Upgrading";
    process.stdout.write(
      `${verb} from ${chalk5.magenta(current)} to ${chalk5.magenta(target)}... `
    );
  }
  const tarballResponse = await fetch(release.dist.tarball);
  if (!tarballResponse.ok || !tarballResponse.body) {
    throw new Error(
      `Failed to fetch release tarball from ${release.dist.tarball}, status code ${tarballResponse.status}`
    );
  }
  await stream.pipeline(tarballResponse.body, tar.x({ strip: 1 }));
}
async function installDependencies() {
  try {
    process.stdout.write("Installing production npm dependencies... ");
    await spawn4("npm", ["install", "--production"]);
    process.stdout.write(chalk5.green("done!") + os3.EOL);
  } catch (e) {
    process.stdout.write(chalk5.red("failed!") + os3.EOL);
    console.error(e.stack);
    return;
  }
}

// src/commands/start.ts
import fs7 from "node:fs";
import path6 from "node:path";
import { pathToFileURL } from "node:url";
import "commander";
function startCommand(program) {
  program.command("start").option("-d, --disable-source-maps", "Disable source map support").description("Start NodeCG").action(async () => {
    const projectDir = recursivelyFindProject(process.cwd());
    if (pathContainsNodeCG(projectDir)) {
      await import(pathToFileURL(path6.join(projectDir, "index.js")).href);
      return;
    }
    const nodecgDependencyPath = path6.join(projectDir, "node_modules/nodecg");
    if (pathContainsNodeCG(nodecgDependencyPath)) {
      await import(pathToFileURL(path6.join(nodecgDependencyPath, "index.js")).href);
    }
  });
}
function recursivelyFindProject(startDir) {
  if (!path6.isAbsolute(startDir)) {
    throw new Error("startDir must be an absolute path");
  }
  const packageJsonDir = path6.join(startDir, "package.json");
  if (fs7.existsSync(packageJsonDir)) {
    return startDir;
  }
  const parentDir = path6.dirname(startDir);
  if (parentDir === startDir) {
    throw new Error("Could not find a project directory");
  }
  return recursivelyFindProject(parentDir);
}

// src/commands/uninstall.ts
import fs8 from "node:fs";
import os4 from "node:os";
import path7 from "node:path";
import { confirm as confirm2 } from "@inquirer/prompts";
import chalk6 from "chalk";
import "commander";
function uninstallCommand(program) {
  program.command("uninstall <bundle>").description("Uninstalls a bundle.").option("-f, --force", "ignore warnings").action(action4);
}
function action4(bundleName, options) {
  const nodecgPath = getNodeCGPath();
  const bundlePath = path7.join(nodecgPath, "bundles/", bundleName);
  if (!fs8.existsSync(bundlePath)) {
    console.error(
      `Cannot uninstall ${chalk6.magenta(bundleName)}: bundle is not installed.`
    );
    return;
  }
  if (options.force) {
    deleteBundle(bundleName, bundlePath);
  } else {
    void confirm2({
      message: `Are you sure you wish to uninstall ${chalk6.magenta(bundleName)}?`
    }).then((answer) => {
      if (answer) {
        deleteBundle(bundleName, bundlePath);
      }
    });
  }
}
function deleteBundle(name, path8) {
  if (!fs8.existsSync(path8)) {
    console.log("Nothing to uninstall.");
    return;
  }
  process.stdout.write(`Uninstalling ${chalk6.magenta(name)}... `);
  try {
    fs8.rmSync(path8, { recursive: true, force: true });
  } catch (e) {
    process.stdout.write(chalk6.red("failed!") + os4.EOL);
    console.error(e.stack);
    return;
  }
  process.stdout.write(chalk6.green("done!") + os4.EOL);
}

// src/commands/index.ts
function setupCommands(program) {
  defaultconfigCommand(program);
  installCommand(program);
  schemaTypesCommand(program);
  setupCommand(program);
  startCommand(program);
  uninstallCommand(program);
}

// src/index.ts
function setupCLI() {
  process.title = "nodecg";
  const program = new Command7("nodecg");
  program.version(package_default.version).usage("<command> [options]");
  setupCommands(program);
  program.on("*", () => {
    console.log("Unknown command:", program.args.join(" "));
    program.help();
  });
  if (!process.argv.slice(2).length) {
    program.help();
  }
  program.parse(process.argv);
}

// src/bin/nodecg.ts
try {
  await spawn5("git", ["--version"]);
} catch (error) {
  console.error(
    `The CLI requires that ${chalk7.cyan("git")} be available in your PATH.`
  );
  process.exit(1);
}
setupCLI();
//# sourceMappingURL=main.js.map
