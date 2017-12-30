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
		paths : ['/letsencrypt/dns'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {
		var url = req.body.url;
		var email = req.body.email || req.user.email;

		req.mongoose.Domain.findOne({
			url : url,
		}, function(err, domain) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			if (!domain) {
				return next(new restify.errors.NotFoundError('Domain ' + url + ' not already'));
			}
			req.kue.le.dns({
				domain : url,
				email : email
			}, function(err, certs) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				domain.tls = certs._id;

				domain.save(function(err) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}
					req.kue.router.add.tls({
						url : url,
						certificate : certs.cert + certs.chain,
						key : certs.privkey
					});
					res.json({
						status : "success",
						result : certs
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
