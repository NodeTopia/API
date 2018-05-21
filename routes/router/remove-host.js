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
        method: 'PUT',
        paths: ['/router/:url'],
        version: '1.0.0',
        auth: true,
        staff: true,
        //role : 'admin'
    },
    middleware: async function (req, res, next) {

        let {url} = req.params

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
            return next(new restify.errors.NotFoundError('Domain ' + url + ' not already'));
        }

        let _host = null;
        for (let [i, h] in domain.hosts.entries()) {
            if (h.host === host && h.port === port && h.name === name) {
                domain.hosts.splice(i, 1);
                h.active = false;
                try {
                    await Promise.all([domain.save(), h.save()])
                } catch (err) {
                    return next(new restify.errors.InternalError(err.message || err));
                }
                _host = h;
                break;
            }
        }

        if (!_host) {
            return next(new restify.errors.NotFoundError('Host ' + url + ' already active'));
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
