var e = require('./setup/test-environment');

// Global before and after

before(function(done) {
    e.server.on('extensionsLoaded', done);
});

after(function() {
    try{
        e.server.shutdown();
    } catch(e) {}
});
