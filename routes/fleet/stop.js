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
		paths : ['/fleet/stop/all'],
		version : '1.0.0',
		auth : true,
		staff : true
	},
	middleware : function(req, res, next) {
		req.mongoose.Container.find({
			$or : [{
				'state' : 'RUNNING'
			}]
		}, function(err, containers) {
			async.parallel(containers.map(function(container) {
				return function(next) {
					console.log(container._id)
					req.kue.fleet.stop({
						container : container._id
					}, next);
				};
			}), function(err, result) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}

				res.json({
					status : "success",
					result : result
				}, 200);
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
		method : 'POST',
		paths : ['/fleet/stop/:id'],
		version : '1.0.0',
		auth : true,
		staff : true
	},
	middleware : function(req, res, next) {
		var id = req.params.id;

		req.mongoose.Container.find({
			_id : id
		}, function(err, containers) {
			async.parallel(containers.map(function(container) {
				return function(next) {
					console.log(container._id)
					req.kue.fleet.stop({
						container : container._id
					}, next);
				};
			}), function(err, result) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}

				res.json({
					status : "success",
					result : result
				}, 200);
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
