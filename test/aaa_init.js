var e = require('./setup/test-environment');

before(function(done) {
    e.server.emitter.on('extensionsLoaded', done);
});

after(function() {
    try{
        e.server.shutdown();
    } catch(e) {}
});
