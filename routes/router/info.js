'use strict';

/**
 * Routes
 */

var restify = require('restify');
var async = require('async');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /router/:url
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/router/:url'],
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

			req.kue.router.info({
				url : domain.url
			}, function(err, result) {
				if (err) {
					return next(new restify.errors[err.type||'InternalError'](err.message || err));
				}
				res.json({
					status : "success",
					result : {
						domain : req.format.domain(domain),
						result : result
					}
				});
			});
		});

	}
});
/**
 * GET /router
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/router'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {

		req.mongoose.Domain.find(function(err, domains) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			async.parallelLimit(domains.map(function(domain) {
				return function(next) {
					req.kue.router.info({
						url : domain.url
					}, function(err, result) {
						if (err) {
							return next(err)
						}
						next(null, {
							domain : req.format.domain(domain),
							result : result
						});
					});
				};
			}), 20, function(err, result) {
				res.json({
					status : "success",
					result : result
				});
			});

		});

	}
});

/**
 * Export
 */

module.exports = routes;
