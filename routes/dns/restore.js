'use strict';

/**
 * Routes
 */

var async = require('async');
var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'POST',
        paths: ['/dns-restore'],
        version: '1.0.0',
        auth: true,
        staff: true
    },
    middleware: async function (req, res, next) {


        let [err, records] = await req.to(req.mongoose.DNSRecord.find({}))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }


        async.parallel(records.map(function (record) {
            return function (next) {
                req.kue.dns.add(record.toRecord()).then(function (result) {
                    next(null, {
                        record: record,
                        raw: result
                    });
                }).catch(function (err) {
                    err.type = 'InternalError';
                    return next(err);
                })
            };
        }), function (err, result) {
            res.json({
                status: "success",
                err: err,
                result: result
            });
        });
    }
});

/**
 * Export
 */

module.exports = routes;
