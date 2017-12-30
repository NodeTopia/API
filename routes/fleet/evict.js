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
		method : 'PUT',
		paths : ['/fleet/apps/evict/:id'],
		version : '1.0.0',
		auth : true,
		staff : true
	},
	middleware : function(req, res, next) {
		var id = req.params.id;

		req.mongoose.Node.findOne({
			is_active : true,
			_id : id
		}, function(err, node) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!node) {
				return next(new restify.errors.NotFoundError('Node ' + id + ' not found'));
			}
			node.closing = true;

			node.save(function(err) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}

				req.mongoose.Container.find({
					$or : [{
						'state' : 'RUNNING'
					}, {
						'state' : 'INITIALIZING'
					}]
				}, function(err, containers) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}

					async.parallel(containers.map(function(container) {
						return function(next) {
							console.log(container)
							if (container.type == 'addon') {
								return next();
							}
							req.kue.fleet.stop({
								container : container._id
							}, function(err) {
								if (err) {
									return next(err);
								}
								req.kue.fleet.start({
									container : container.config
								}, next);
							});
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

			});

		});
	}
});

/**
 * Export
 */

module.exports = routes;
