var server = require(process.cwd() + '/lib/server');

server.start();

module.exports = {
    server: server
};
