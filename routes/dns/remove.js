'use strict';

/**
 * Routes
 */

var restify = require('restify');
var tld = require('tldjs');
var dns = require('nodetopia-lib/dns');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'PUT',
        paths: ['/dns/:type/:name'],
        version: '1.0.0',
        auth: true,
        role: 'admin'
    },
    middleware: async function (req, res, next) {

        var data = req.body;
        data.organization = req.organization._id;
        data.name = req.params.name;
        data.type = req.params.type;

        let [err, result] = await req.to(dns.remove(data))

        if (err) {
            return next(new restify.errors[err.type || 'InternalError'](err.message || err));
        }
        res.json({
            status: "success",
            result: {
                zone: req.format.DNSZone(result.zone),
                record: req.format.DNSRecord(result.record)
            }
        });
    }
});

/**
 * Export
 */

module.exports = routes;
