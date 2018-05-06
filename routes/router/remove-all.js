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
        method: 'DEL',
        paths: ['/router/:url'],
        version: '1.0.0',
        auth: true,
        staff: true,
        //role : 'admin'
    },
    middleware: async function (req, res, next) {

        let {url} = req.params;

        let {
            name = 'system',
            host,
            port = 80
        } = req.body;

        let err, domain, result;

        [err, domain] = await req.to(req.mongoose.Domain.findOne({
            url: url,
        }));

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        if (!domain) {
            return next(new restify.errors.NotFoundError('Domain ' + url + ' not ready'));
        }


        [err, result] = await req.to(req.kue.router.remove.host({
            urls: [domain.url],
            name: name,
            host: host,
            port: port
        }));

        if (err) {
            return next(new restify.errors[err.type || 'InternalError'](err.message || err));
        }

        res.json({
            status: "success",
            result: {
                domain: domain,
                result: result
            }
        });
    }
});

/**
 * Export
 */

module.exports = routes;
