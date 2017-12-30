'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'DEL',
		paths : ['/organization/:organization/apps/:name/addon/:type', '/apps/:name/addon/:type'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;
		var type = req.params.type;
		var force = req.query.force;

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
			req.mongoose.AddonType.findOne({
				type : type
			}, select, function(err, addonType) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				if (!addonType) {
					//return next(new restify.errors.NotFoundError('Addon type ' + name + ' not found'));
				}
				req.kue.addon[type].unbind({
					name : app.name,
					organization : req.organization.name,
					force : true
				}, function(err, addon) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}

					res.json({
						status : "success",
						result : addon
					}, 200);
				});

			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
