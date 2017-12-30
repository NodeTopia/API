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
		paths : ['/zones'],
		version : '1.0.0',
		auth : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {

		req.mongoose.Zone.find({

		}, function(err, zones) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			res.json({
				status : "success",
				result : zones.map(req.format.zone)
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
		paths : ['/zones/:name'],
		version : '1.0.0',
		auth : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;

		req.mongoose.Zone.findOne({
			name : name
		}, function(err, zone) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			if (!zone) {
				return next(new restify.errors.NotFoundError('Zone ' + name + ' not found'));
			}
			res.json({
				status : "success",
				result : req.format.zone(zone)
			});
		});

	}
});
/**
 * POST /zone
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'POST',
		paths : ['/zones'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {
		var name = req.body.name;

		req.mongoose.Zone.findOne({
			name : name
		}, function(err, zone) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			if (zone) {
				return next(new restify.errors.NotFoundError('Zone ' + name + ' already used'));
			}

			zone = new req.mongoose.Zone({
				name : name
			});
			zone.save(function(err) {
				if (err) {
					return next(new restify.errors.InternalError(err.message||err));
				}
				res.json({
					status : "success",
					result : req.format.zone(zone)
				});
			});

		});

	}
});

/**
 * Export
 */

module.exports = routes;
