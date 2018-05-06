'use strict';

/**
 * Routes
 */

var restify = require('restify');
var async = require('async');
var routes = [];

/**
 * GET /router/:url
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'GET',
        paths: ['/router/:url'],
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
        }));
        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        if (!domain) {
            return next(new restify.errors.NotFoundError('Domain ' + url + ' not already'));
        }

        [err, result] = await req.to(req.kue.router.info({
            url: domain.url
        }));
        if (err) {
            return next(new restify.errors[err.type || 'InternalError'](err.message || err));
        }
        res.json({
            status: "success",
            result: {
                domain: req.format.domain(domain),
                result: result
            }
        });
    }
});
/**
 * GET /router
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'GET',
        paths: ['/router'],
        version: '1.0.0',
        auth: true,
        staff: true,
        //role : 'admin'
    },
    middleware: async function (req, res, next) {

        let [err, domains] = await req.to(req.mongoose.Domain.find());

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        async.parallelLimit(domains.map(function (domain) {
            return function (next) {
                req.kue.router.info({
                    url: domain.url
                }).then(function (result) {
                    next(null, {
                        domain: req.format.domain(domain),
                        result: result
                    });
                }).catch(function (err) {
                    return next(err)
                });
            };
        }), 20, function (err, result) {
            res.json({
                status: "success",
                result: result
            });
        });
    }
});

/**
 * Export
 */

module.exports = routes;
