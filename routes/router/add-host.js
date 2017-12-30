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
		paths : ['/router/:url'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {
		var url = req.params.url;
		var name = req.body.name || 'system';
		var host = req.body.host;
		var port = req.body.port || 80;

		req.mongoose.Domain.findOne({
			url : url,
		}, function(err, domain) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			if (!domain) {
				return next(new restify.errors.NotFoundError('Domain ' + url + ' not already'));
			}

			req.kue.router.add.host({
				urls : [domain.url],
				name : name,
				host : host,
				port : port
			}, function(err, result) {
				console.log(err)
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
