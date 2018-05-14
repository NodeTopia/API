'use strict';

/**
 * Routes
 */
var async = require('async');
var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/apps/:name/builds
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'PUT',
        paths: ['/organization/:organization/apps/:name/scale', '/apps/:name/scale'],
        version: '1.0.0',
        auth: true,
        role: 'admin'
    },
    middleware: function (req, res, next) {

        var name = req.params.name;

        var typeKeys = Object.keys(req.body);

        var modified = false;
        var sizeModified = false;
        var processes = 0;

        req.mongoose.App.findOne({
            'organization': req.organization._id,
            'name': name
        }, select, function (err, app) {
            if (err) {
                return next(new restify.errors.InternalError(err.message || err));
            }
            if (!app) {
                return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
            }

            req.mongoose.Formation.findOne({
                app: app._id
            }, function (err, formation) {
                if (err) {
                    return next(new restify.errors.InternalError(err.message || err));
                }

                async.parallel(formation.commands.map(function (unit) {
                    return function (next) {
                        if (typeKeys.indexOf(unit.type) !== -1) {
                            var request = req.body[unit.type];
                            console.log(request)
                            if (typeof request == 'number') {

                                if (unit.quantity !== request) {
                                    modified = true;
                                }
                                unit.quantity = request;

                                processes += unit.quantity;
                                next();
                            } else {

                                if (request.quantity) {
                                    if (unit.quantity !== request.quantity) {
                                        modified = true;
                                    }
                                    unit.quantity = request.quantity;

                                    processes += unit.quantity;
                                }

                                if (request.size) {
                                    if (unit.size.type !== request.size) {
                                        modified = true;
                                        sizeModified = true;
                                    } else {
                                        return next();
                                    }

                                    return req.mongoose.Size.findOne({
                                        type: request.size
                                    }, function (err, size) {

                                        if (!size) {
                                            sizeModified = false;
                                            return next();
                                        }
                                        unit.size = size;
                                        next();
                                    });
                                }
                                next();

                            }

                        } else {
                            next()
                        }
                    };
                }), function (err) {
                    console.log(err)
                    if (processes > req.organization.quota.plan.processes) {
                        return next(new restify.errors.PreconditionFailedError('Can not create more then ' + req.organization.quota.plan.processes + ' processes'));
                    }

                    if ((modified || sizeModified)) {

                        formation.save(async function (err) {
                            if (err) {
                                return next(new restify.errors.InternalError(err.message || err));
                            }

                            function onScale(err, data) {
                                if (err) {
                                    return next(new restify.errors.InternalError(err.message || err));
                                }
                                res.json({
                                    status: "success",
                                    result: {
                                        modified: modified,
                                        scaled: !sizeModified,
                                        deployed: sizeModified,
                                        formation: req.format.formation(formation)
                                    }
                                }, 200);

                            }

                            if (sizeModified) {
                                let [err, data] = await req.to(req.kue.fleet.app.deploy({
                                    organization: req.organization.name,
                                    name: app.name
                                }));
                                onScale(err, data);
                            } else {
                                let [err, data] = await req.to(req.kue.fleet.app.scale({
                                    organization: req.organization.name,
                                    name: app.name
                                }));
                                onScale(err, data);
                            }

                        });
                    } else {
                        res.json({
                            status: "success",
                            result: {
                                modified: modified,
                                scaled: !sizeModified,
                                deployed: sizeModified,
                                formation: req.format.formation(formation)
                            }
                        }, 200);
                    }
                });
            });
        });

    }
});

/**
 * Export
 */

module.exports = routes;
