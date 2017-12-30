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
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/addon', '/apps/:name/addon'],
		version : '1.0.0',
		auth : true,
		role : 'member'
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

			req.mongoose.AddOn.find({
				app : app._id,
				organization : req.organization._id,
				is_active : true
			}, function(err, addons) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}

				res.json({
					status : "success",
					result : (addons || []).map(req.format.addons)
				}, 200);
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
