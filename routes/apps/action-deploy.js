'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];

/**
 * GET /organization/:organization/apps/:name
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'POST',
		paths : ['/organization/:organization/apps/:name/action', '/apps/:name/action'],
		version : '1.0.0',
		auth : true,
		role : 'collaborator'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;

		req.mongoose.App.findOne({
			organization : req.organization._id,
			name : name
		}, function(err, app) {

			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			req.kue.fleet.app.deploy({
				organization : req.organization.name,
				name : app.name
			}, function(err, data) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				res.json({
					status : "success",
					errors : data.error,
					stopped : (data.results.stopped || []).map(req.format.container),
					started : (data.results.started || []).map(req.format.container)
				});
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
