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
        }))
        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        if (!domain) {
            return next(new restify.errors.NotFoundError('Domain ' + url + ' not already'));
        }
        let _host = null;
        for (let h in domain.hosts) {
            if (h.host === host && h.port === port && h.name === name) {
                if (h.active) {
                    return next(new restify.errors.NotFoundError('Host ' + url + ' already active'));
                } else {
                    h.active = true
                    try {
                        await h.save();
                        _host = h
                        break
                    } catch (err) {
                        return next(new restify.errors.InternalError(err.message || err));
                    }
                }
            }
        }


        if (!_host) {
            _host = new req.mongoose.Host({
                ip: host,
                port: port,
                name: name
            });
            domain.hosts.push(_host)

            try {
                await domain.save();
            } catch (err) {
                return next(new restify.errors.InternalError(err.message || err));
            }
        } else {
            return next(new restify.errors.NotFoundError('Host ' + url + ' already active'));
        }


        [err, result] = await req.to(req.kue.router.add.host({
            urls: [domain.url],
            name: _host.name,
            host: _host.ip,
            port: _host.port
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
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
