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
		method : 'GET',
		paths : ['/dns'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {

		req.mongoose.DNSZone.find({
			organization : req.organization._id,
		}, function(err, dnsZone) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			res.json({
				status : "success",
				result : dnsZone.map(req.format.DNSZone)
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
		paths : ['/dns/:type/:name'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {

		var name = req.params.name.toLowerCase();
		var type = req.params.type.toUpperCase();
		var zone = tld.getDomain(name.replace('*.', ''));

		req.mongoose.DNSZone.findOne({
			organization : req.organization._id,
			zone : zone
		}, function(err, dnsZone) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!dnsZone) {
				return next(new restify.errors.ConflictError('dns does not exists'));
			}

			var records = [];

			for (var i = 0; i < dnsZone.records.length; i++) {
				var record = dnsZone.records[i];
				if (dnsZone.records[i].name == name && dnsZone.records[i].type == type) {
					records.push(record);
				}
			};
			res.json({
				status : "success",
				result : records.map(req.format.DNSRecord)
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
