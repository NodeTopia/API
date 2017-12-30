'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/apps/:name/env
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'PUT',
		paths : ['/organization/:organization/apps/:name/env','/apps/:name/env'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;

		var postedEnv = req.body;

		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			req.mongoose.Env.findOne({
				app : app._id
			}, function(err, env) {
				if (err) {
					return next(new restify.errors.InternalError(err.message||err));
				}

				if (!env) {
					return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
				}

				Object.keys(postedEnv).forEach(function(key) {
					if (postedEnv[key] === null) {
						delete env.env[key];
					} else {
						env.env[key] = postedEnv[key];
					}
				});
				env.markModified('env');
				env.save(function(err) {
					if (err) {
						return next(new restify.errors.InternalError(err.message||err));
					}

					req.kue.fleet.app.deploy({
						organization : req.organization.name,
						name : app.name
					}, function(err) {
						if (err) {
							return next(new restify.errors.InternalError(err.message||err));
						}
						res.json({
							status : "success",
							result : req.format.env(env)
						}, 200);
					});

				});

			});

		});

	}
});

/**
 * Export
 */

module.exports = routes;
