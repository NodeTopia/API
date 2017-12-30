'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/apps/:name/domains
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/domains', '/apps/:name/domains'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;

		req.mongoose.App.findOne({
			organization : req.organization._id,
			name : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			res.json({
				status : "success",
				result : app.domains.map(req.format.domain)
			}, 200);

		});

	}
});

/**
 * GET /organization/:organization/apps/:name/domains/:url
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/domains/:url', '/apps/:name/domains/:url'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;
		var url = req.params.url.toLocaleLowerCase();

		req.mongoose.App.findOne({
			organization : req.organization._id,
			name : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			res.json({
				status : "success",
				result : req.format.domain(app.domains.filter(function(domain) {
					return domain.url == url
				}).shift())
			}, 200);

		});

	}
});

/**
 * Export
 */

module.exports = routes;
