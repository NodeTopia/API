'use strict';

/**
 * Routes
 */

var restify = require('restify');
var async = require('async');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'POST',
		paths : ['/router/:url/tls'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {
		var url = req.params.url;

		req.mongoose.Domain.findOne({
			url : url,
		}, function(err, domain) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			if (!domain) {
				return next(new restify.errors.NotFoundError('Domain ' + url + ' not already'));
			}
			req.kue.router.add.tls({
				url : domain.url,
				certificate : domain.tls.cert + domain.tls.chain,
				key : domain.tls.privkey
			}, function(err, result) {
				if (err) {
					return next(new restify.errors[err.type||'InternalError'](err.message || err));
				}
				res.json({
					status : "success",
					result : {
						domain : domain,
						result : result
					}
				});
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
