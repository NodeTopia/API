'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/apps
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps', '/apps'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {
		req.mongoose.App.find({
			organization : req.organization._id
		}, select, function(err, apps) {

			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			res.json({
				status : "success",
				result : apps.map(req.format.app)
			});
		});

	}
});

/**
 * GET /organization/:organization/apps/:name
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name', '/apps/:name'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;

		req.mongoose.App.findOne({
			organization : req.organization._id,
			name : name
		},  function(err, app) {

			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			res.json({
				status : "success",
				result : req.format.app(app, req.organization)
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
