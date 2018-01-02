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
		paths : ['/router'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {
		var url = req.body.url;
		var name = req.body.name || req.nconf.get('name');
		var organization = req.body.organization || req.nconf.get('name');
		var metricSession = req.body.metricSession || req.nconf.get('metricSession');
		var logSession = req.body.logSession || req.nconf.get('logSession');

		req.mongoose.Domain.findOne({
			url : url,
		}, function(err, domain) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			if (!domain) {
				domain = new req.mongoose.Domain({
					url : url
				});
			} else {
				return next(new restify.errors.NotFoundError('Domain ' + url + ' not already'));
			}

			req.mongoose.TLS.findOne({
				subject : url,
			}, function(err, tls) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}

				if (tls) {
					domain.tls = tls._id;
				}

				domain.save(function(err) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}

					req.kue.router.add.url({
						url : domain.url,
						organization : organization,
						name : name,
						metricSession : metricSession,
						logSession : logSession
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
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
