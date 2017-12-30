'use strict';

/**
 * Routes
 */

var restify = require('restify');
var tld = require('tldjs');
var dns = require('nodetopia-lib/dns');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'POST',
		paths : ['/dns/:zone'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {

		var zone = tld.getDomain(req.params.zone.replace('*.', ''));
		dns.getZone(zone, req.organization._id, function(err, dnsZone) {

			if (err) {
				return next(new restify.errors[err.type||'InternalError'](err.message || err));
			}
			dnsZone.save(function(err) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				res.json({
					status : "success",
					result :  req.format.DNSZone(dnsZone)
				});
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
		paths : ['/dns/:zone'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {

		var zone = tld.getDomain(req.params.zone.replace('*.', ''));

		dns.getZone(zone, req.organization._id, function(err, dnsZone) {

			if (err) {
				return next(new restify.errors[err.type||'InternalError'](err.message || err));
			}
			if (dnsZone.isNew) {
				return next(new restify.errors.NotFoundError('zone does not exists'));
			}
			res.json({
				status : "success",
				result : req.format.DNSZone(dnsZone)
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
