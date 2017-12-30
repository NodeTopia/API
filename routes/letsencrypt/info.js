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
		paths : ['/letsencrypt/tls/:domain'],
		version : '1.0.0',
		auth : true,
		staff : true
	},
	middleware : function(req, res, next) {
		var domain = req.params.domain;

		req.mongoose.TLS.findOne({
			subject : domain
		}, function(err, tls) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}

			if (!tls) {
				return next(new restify.errors.NotFoundError('tls ' + domain + ' not found'));
			}
			res.json({
				status : "success",
				result : tls
			});

		});

	}
});
/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/letsencrypt/tls'],
		version : '1.0.0',
		auth : true,
		staff : true
	},
	middleware : function(req, res, next) {

		req.mongoose.TLS.find({
			
		}, function(err, tlss) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}

			res.json({
				status : "success",
				result : tlss
			});

		});

	}
});

/**
 * Export
 */

module.exports = routes;
