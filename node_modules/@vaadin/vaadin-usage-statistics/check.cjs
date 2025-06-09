var fs = require('fs');

const disabledForMachine = process.env.npm_package_config_disabled;
let disabledForProject = false;

if (fs.existsSync("../../../package.json")) {
  const projectPackageJson = JSON.parse(fs.readFileSync("../../../package.json"));
  if (projectPackageJson.vaadin && projectPackageJson.vaadin.disableUsageStatistics) {
    disabledForProject = true;
  }
}

if (disabledForMachine || disabledForProject) {
  if (disabledForMachine) {
    console.log(`
    You have disabled Vaadin development time usage statistics collection. To re-enable, run:
    npm explore @vaadin/vaadin-usage-statistics -- npm run enable
    For more details, see https://github.com/vaadin/vaadin-usage-statistics
  `);
  }
  try {
    fs.copyFileSync('vaadin-usage-statistics-optout.js', 'vaadin-usage-statistics.js');
  } catch (err) {
    console.log('Error while copying file!');
    throw err;
  }
} else {
  console.log(`
    Vaadin collects development time usage statistics to improve this product. To opt-out, either run:
    npm explore @vaadin/vaadin-usage-statistics -- npm run disable
    to store disable statistics for the machine, or add
    "vaadin": { "disableUsageStatistics": true }
    to the project package.json and re-run npm install to disable statistics for the project.

    For more details, see https://github.com/vaadin/vaadin-usage-statistics
  `);
  const stats = fs.readFileSync('vaadin-usage-statistics.js').toString();
  if (stats.startsWith(`export * from './vaadin-usage-statistics-collect.js';`) === false) {
    try {
      fs.copyFileSync('vaadin-usage-statistics-collect.js', 'vaadin-usage-statistics.js');
    } catch (err) {
      console.log('Error while copying file!');
      throw err;
    }
  }
}
