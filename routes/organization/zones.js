'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/zones
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/zones'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {
		res.json({
			status : "success",
			result : req.organization.quota.zones.map(req.format.zone)
		});
	}
});
/**
 * PUT /organization/:organization/zones
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'PUT',
		paths : ['/organization/:organization/zones'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {

		var name = req.body.name;

		req.mongoose.Zone.findOne({
			name : name
		}, function(err, zone) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			if (!zone) {
				return next(new restify.errors.NotFoundError('Zone ' + name + ' not found'));
			}
			
			req.organization.quota.zones.push(zone);
			
			req.organization.quota.save(function(err) {
				if (err) {
					return next(new restify.errors.InternalError(err.message||err));
				}
				res.json({
					status : "success",
					result : req.organization.quota.zones.map(req.format.zone)
				});
			});
		});
	}
});
/**
 * DEL /organization/:organization/zones/:name
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'DEL',
		paths : ['/organization/:organization/zones/:name'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;

		for (var i = 0,
		    j = req.organization.quota.zones.length; i < j; i++) {
			if (req.organization.quota.zones[i].name == name) {
				req.organization.quota.zones.splice(i, 1);
				break;
			}
		};

		req.organization.quota.save(function(err) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			res.json({
				status : "success",
				result : req.organization.quota.zones.map(req.format.zone)
			});
		});
	}
});
/**
 * Export
 */

module.exports = routes;
