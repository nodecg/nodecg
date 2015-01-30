var e = require('./setup/test-environment');

// Global before and after

before(function(done) {
    this.timeout(15000);
    e.server.on('started', done);
    e.server.start();
});

after(function() {
    try{
        e.server.stop();
    } catch(e) {}
});
