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
        method: 'POST',
        paths: ['/router/:url/tls'],
        version: '1.0.0',
        auth: true,
        staff: true,
        //role : 'admin'
    },
    middleware: async function (req, res, next) {
        let {url} = req.params;

        let err, domain, result;

        [err, domain] = await req.to(req.mongoose.Domain.findOne({
            url: url,
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        if (!domain) {
            return next(new restify.errors.NotFoundError('Domain ' + url + ' not already'));
        }

        if (!domain.tls) {
            return next(new restify.errors.NotFoundError('Domain ' + url + ' TLS not already'));
        }

        [err, result] = await req.to(req.kue.router.add.tls({
            url: domain.url,
            certificate: domain.tls.cert + domain.tls.chain,
            key: domain.tls.privkey
        }))

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
