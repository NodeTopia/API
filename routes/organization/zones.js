'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];

/**
 * GET /organization/:organization/zones
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'GET',
        paths: ['/organization/:organization/zones'],
        version: '1.0.0',
        auth: true,
        role: 'member'
    },
    middleware: function (req, res, next) {
        res.json({
            status: "success",
            result: req.organization.quota.zones.map(req.format.zone)
        });
    }
});
/**
 * PUT /organization/:organization/zones
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'PUT',
        paths: ['/organization/:organization/zones'],
        version: '1.0.0',
        auth: true,
        role: 'admin'
    },
    middleware: async function (req, res, next) {

        let {name} = req.body;

        let [err, zone] = await req.to(req.mongoose.Zone.findOne({
            name: name
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        if (!zone) {
            return next(new restify.errors.NotFoundError('Zone ' + name + ' not found'));
        }

        req.organization.quota.zones.push(zone);


        try {
            await req.organization.quota.save()
            res.json({
                status: "success",
                result: req.organization.quota.zones.map(req.format.zone)
            });
        } catch (err) {
            next(new restify.errors.InternalError(err.message || err));
        }
    }
});
/**
 * DEL /organization/:organization/zones/:name
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'DEL',
        paths: ['/organization/:organization/zones/:name'],
        version: '1.0.0',
        auth: true,
        role: 'admin'
    },
    middleware: async function (req, res, next) {

        let {name} = req.body;

        for (let i = 0,
                 j = req.organization.quota.zones.length; i < j; i++) {
            if (req.organization.quota.zones[i].name === name) {
                req.organization.quota.zones.splice(i, 1);
                break;
            }
        }

        try {
            await req.organization.quota.save()
            res.json({
                status: "success",
                result: req.organization.quota.zones.map(req.format.zone)
            });
        } catch (err) {
            next(new restify.errors.InternalError(err.message || err));
        }
    }
});
/**
 * Export
 */

module.exports = routes;
