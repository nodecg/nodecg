var e = require('./setup/test-environment');

// Global before and after

before(function(done) {
    e.server.on('extensionsLoaded', done);
    e.server.start();
});

after(function() {
    try{
        e.server.stop();
    } catch(e) {}
});
