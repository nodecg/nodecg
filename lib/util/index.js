'use strict';

var config = require('../config').config;

module.exports.authCheck = function (req, res, next) {
    if (!config.login.enabled) {
        return next();
    }

    var allowed = (req.user !== undefined) ? req.user.allowed : false;

    if (req.isAuthenticated() && allowed) {
        return next();
    }

    req.session.returnTo = req.url;
    res.redirect('/login');
};
