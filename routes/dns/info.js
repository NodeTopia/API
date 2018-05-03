'use strict';

/**
 * Routes
 */
const tld = require('tldjs');
const restify = require('restify');

var routes = [];

/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'GET',
        paths: ['/dns'],
        version: '1.0.0',
        auth: true,
        role: 'admin'
    },
    middleware: async function (req, res, next) {
        let [err, dnsZone] = await req.to(req.mongoose.DNSZone.find({
            organization: req.organization._id,
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        res.json({
            status: "success",
            result: dnsZone.map(req.format.DNSZone)
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
        paths: ['/dns/:type/:name'],
        version: '1.0.0',
        auth: true,
        role: 'admin'
    },
    middleware: async function (req, res, next) {

        let name = req.params.name.toLowerCase();
        let type = req.params.type.toUpperCase();
        let zone = tld.getDomain(name.replace('*.', ''));

        let [err, dnsZone] = await req.to(req.mongoose.DNSZone.findOne({
            organization: req.organization._id,
            zone: zone
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        if (!dnsZone) {
            return next(new restify.errors.ConflictError('dns does not exists'));
        }

        let records = dnsZone.records.filter(function (record) {
            return record.name === name && record.type === type;
        });

        res.json({
            status: "success",
            result: records.map(req.format.DNSRecord)
        });

    }
});

/**
 * Export
 */

module.exports = routes;
