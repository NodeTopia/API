'use strict';

/**
 * Routes
 */

var async = require('async');
var tld = require('tldjs');
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
		paths : ['/dns-restore'],
		version : '1.0.0',
		auth : true,
		staff : true
	},
	middleware : function(req, res, next) {

		req.mongoose.DNSRecord.find({

		}, function(err, records) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			async.parallel(records.map(function(record) {
				return function(next) {
					req.kue.dns.add(record.toRecord(), function(err, result) {
						if (err) {
							err.type = 'InternalError';
							return next(err);
						}
						next(null, {
							record : record,
							raw : result
						});
					});
				};
			}), function(err, result) {
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
