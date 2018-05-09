'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];

/**
 * GET /organization/:organization
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'GET',
        paths: ['/organization/:organization'],
        version: '1.0.0',
        auth: true,
        role: 'member'
    },
    middleware: function (req, res, next) {
        res.json({
            status: "success",
            result: req.format.organization(req.organization)
        });
    }
});
/**
 * GET /organization/:organization
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'GET',
        paths: ['/organization'],
        version: '1.0.0',
        auth: true,
        //role : 'member'
    },
    middleware: async function (req, res, next) {


        let [err, organizations] = await req.to(req.mongoose.Organization.find({
            'membership.user': req.user._id
        }, 'name apps membership.user membership.role quota'))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        res.json({
            status: "success",
            result: organizations.map(req.format.organization)
        });
    }
});

/**
 * Export
 */

module.exports = routes;
