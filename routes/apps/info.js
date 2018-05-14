'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];
var select = '-organization';

/**
 * GET /organization/:organization/apps
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'GET',
        paths: ['/organization/:organization/apps', '/apps'],
        version: '1.0.0',
        auth: true,
        role: 'member'
    },
    middleware: async function (req, res, next) {


        let [err, apps] = await req.to(req.mongoose.App.find({
            organization: req.organization._id
        }, select));

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        res.json({
            status: "success",
            result: apps.map(req.format.app)
        });
    }
});

/**
 * GET /organization/:organization/apps/:name
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'GET',
        paths: ['/organization/:organization/apps/:name', '/apps/:name'],
        version: '1.0.0',
        auth: true,
        role: 'member'
    },
    middleware: async function (req, res, next) {


        let {name} = req.params;
        let [err, app] = await req.to(req.mongoose.App.findOne({
            organization: req.organization._id,
            name: name
        }, select));

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        res.json({
            status: "success",
            result: req.format.app(app, req.organization)
        });
    }
});

/**
 * Export
 */

module.exports = routes;
