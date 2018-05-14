'use strict';

/**
 * Routes
 */
var async = require('async');
var restify = require('restify');
var routes = [];

/**
 * DELETE /organization/:organization/apps/:name
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'DEL',
        paths: ['/organization/:organization/apps/:name/action', '/apps/:name/action'],
        version: '1.0.0',
        auth: true,
        role: 'collaborator'
    },
    middleware: async function (req, res, next) {


        let {name} = req.params;
        let err,
            app,
            containers;

        [err, app] = await req.to(req.mongoose.App.findOne({
            organization: req.organization._id,
            name: name
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        if (!app) {
            return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
        }
        [err, containers] = await req.to(req.mongoose.Container.find({
            reference: app._id,
            $or: [{
                'state': 'RUNNING'
            }, {
                'state': 'STARTING'
            }, {
                'state': 'INITIALIZING'
            }],
            type: {
                $nin: ['addon', 'build']
            }
        }))


        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        try {
            await Promise.all(containers.map(function (container) {
                return req.kue.fleet.container.stop({
                    container: container._id
                })
            }))
            res.send(200);
        } catch (err) {
            next(new restify.errors.InternalError(err.message || err));
        }
    }
});

/**
 * Export
 */

module.exports = routes;
