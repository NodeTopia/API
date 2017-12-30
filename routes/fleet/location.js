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
		method : 'GET',
		paths : ['/fleet/apps/location'],
		version : '1.0.0',
		auth : true,
		staff : true
	},
	middleware : function(req, res, next) {
		var appNodes = {}
		req.mongoose.Container.find({
			$or : [{
				'state' : 'RUNNING'
			}]
		}, function(err, containers) {

			req.mongoose.Node.find({
				is_active : true
			}, function(err, nodes) {

				nodes.forEach(function(node) {
					appNodes[node._id] = {
						cores : node.cores,
						memory : node.memory,
						address : node.address,
						environment : node.environment,
						zone : node.zone,
						id : node.id,
						containers : []
					};
				});

				async.parallel(containers.map(function(container) {
					return function(next) {
						if (appNodes[container.node]) {
							appNodes[container.node].containers.push(req.format.container(container));
						}
						next();
					};
				}), function(err, result) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}

					res.json({
						status : "success",
						result : appNodes
					}, 200);
				});
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
