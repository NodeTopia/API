'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/apps/:name
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/formation', '/apps/:name/formation'],
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
			req.mongoose.Formation.findOne({
				app : app._id
			}, function(err, formation) {
				res.json({
					status : "success",
					result : req.format.formation(formation)
				});
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
