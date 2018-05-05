'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];

/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'GET',
        paths: ['/sizes'],
        version: '1.0.0',
        auth: true
    },
    middleware: async function (req, res, next) {
        let [err, sizes] = await req.to(req.req.mongoose.Size.find())

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        res.json({
            status: "success",
            result: sizes.map(req.format.size)
        });

    }
});
/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'GET',
        paths: ['/sizes/:name'],
        version: '1.0.0',
        auth: true
    },
    middleware: async function (req, res, next) {
        let {name} = req.params;

        let [err, size] = await req.to(req.req.mongoose.Size.findOne({
            name: name
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        if (!size) {
            return next(new restify.errors.NotFoundError('Size ' + name + ' not found'));
        }
        res.json({
            status: "success",
            result: req.format.size(size)
        });
    }
});

/**
 * Export
 */

module.exports = routes;
