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
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/env','/apps/:name/env'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;

		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			req.mongoose.Env.findOne({
				app : app._id
			}, function(err, env) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}

				if (!env) {
					var env = new req.mongoose.Env({
						app : app._id,
						env : {
							CREATE_AT : new Date()
						}
					});
					env.save()
					return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
				}

				res.json({
					status : "success",
					result : req.format.env(env)
				});
			});

		});

	}
});

/**
 * Export
 */

module.exports = routes;
