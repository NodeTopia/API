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
		paths : ['/provider/scaleway/:id/action'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {

		var id = req.params.id;
		var wait = req.params.wait;

		req.kue.scw.action.start({
			id : id,
			wait : wait ? true : false
		}, function(err, result) {
			if (err) {
				console.log(err)
				return next(new restify.errors.InternalError(err.message || err));
			}
			res.json({
				status : "success",
				result : result
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
		method : 'PUT',
		paths : ['/provider/scaleway/:id/action'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {

		var id = req.params.id;
		var wait = req.params.wait;
		req.kue.scw.action.restart({
			id : id,
			wait : wait ? true : false
		}, function(err, result) {
			if (err) {
				console.log(err)
				return next(new restify.errors.InternalError(err.message || err));
			}
			res.json({
				status : "success",
				result : result
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
		method : 'DEL',
		paths : ['/provider/scaleway/:id/action'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {

		var id = req.params.id;
		var wait = req.query.wait;
		
		req.kue.scw.action.remove({
			id : id,
			wait : wait == 'true' ? true : false
		}, function(err, result) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			res.json({
				status : "success",
				result : result
			});
		});
	}
});
/**
 * Export
 */

module.exports = routes;
