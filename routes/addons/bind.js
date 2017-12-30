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
		method : 'POST',
		paths : ['/organization/:organization/apps/:name/addon/:type', '/apps/:name/addon/:type'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;
		var type = req.params.type;
		var zone = req.body.zone;
		var size = req.body.size;

		var force = req.body.force == false ? false : true;

		var config = req.body.options || {};

		if ( typeof size !== 'string') {
			size = ''
		}

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
					//return next(new restify.errors.NotFoundError('Addon type ' + type + ' not found'));
				}
				req.mongoose.Size.findOne({
					type : size
				}, function(err, size) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}

					config.app = app._id;

					req.mongoose.AddOn.findOne({
						app : app._id,
						organization : req.organization._id,
						type : type,
						is_active : true
					}, select, function(err, addon) {
						if (err) {
							return next(new restify.errors.InternalError(err.message || err));
						}
						if (addon) {
							return next(new restify.errors.NotFoundError('Addon type ' + type + ' already bound'));
						}
						config.name = app.name;
						config.organization = req.organization.name;
						config.zone = zone;
						config.size = size || req.organization.quota.plan.size;
						config.force = force;

						req.kue.addon[type].bind(config, function(err, addon) {
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
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
