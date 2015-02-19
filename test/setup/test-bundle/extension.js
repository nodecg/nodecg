/* istanbul ignore next */
'use strict';

var express = require('express');

module.exports = function(nodecg) {
    var app = express();
    app.get('/test-bundle/test-route', function(req, res) {
        res.sendStatus(200);
    });

    nodecg.mount(app);

    return nodecg;
};