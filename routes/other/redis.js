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
		paths : ['/redis'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {

		req.mongoose.Redis.find({

		}, function(err, redis) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			res.json({
				status : "success",
				result : redis
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
		paths : ['/redis/:type'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {
		var type = req.params.type;

		req.mongoose.Redis.find({
			type : type
		}, function(err, redis) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}

			res.json({
				status : "success",
				result : redis
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
		paths : ['/redis'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {
		var type = req.body.type;
		var host = req.body.host;
		var port = req.body.port;
		var auth = req.body.auth;
		var master = req.body.master;

		req.mongoose.Redis.findOne({
			type : type,
			host : host,
			port : port,
			master : master
		}, function(err, redis) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			if (redis) {
				return next(new restify.errors.NotFoundError('redis ' + type + ' already used'));
			}

			redis = new req.mongoose.Redis({
				master : master,
				auth : auth,
				host : host,
				port : port,
				type : type
			});
			redis.save(function(err) {
				if (err) {
					return next(new restify.errors.InternalError(err.message||err));
				}
				res.json({
					status : "success",
					result : redis
				});
			});

		});

	}
});

/**
 * Export
 */

module.exports = routes;
