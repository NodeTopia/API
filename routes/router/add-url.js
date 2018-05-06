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
        paths: ['/router'],
        version: '1.0.0',
        auth: true,
        staff: true,
        //role : 'admin'
    },
    middleware: async function (req, res, next) {
        let {
            url,
            name = req.nconf.get('name'),
            organization = req.nconf.get('name'),
            metricSession = req.nconf.get('metricSession'),
            logSession = req.nconf.get('logSession')
        } = req.body;

        let err, domain, tls, result;

        [err, domain] = await req.to(req.mongoose.Domain.findOne({
            url: url,
        }));

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        if (!domain) {
            domain = new req.mongoose.Domain({
                url: url
            });
        } else {
            return next(new restify.errors.NotFoundError('Domain ' + url + ' not already'));
        }

        [err, tls] = await req.to(req.mongoose.TLS.findOne({
            subject: url,
        }));

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        if (tls) {
            domain.tls = tls._id;
        }

        try {
            await domain.save()
        } catch (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        [err, result] = await req.to(req.kue.router.add.url({
            url: domain.url,
            organization: organization,
            name: name,
            metricSession: metricSession,
            logSession: logSession
        }));

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
