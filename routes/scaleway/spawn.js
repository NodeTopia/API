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
		paths : ['/provider/scaleway/spawn/port'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {

		var type = req.body.type;
		var options = req.body.options || {
			environment : 'development',
			multiTenant : true
		};

		req.kue.scw.spawn.port({
			type : type,
			options : options
		}, function(err, servers) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			res.json({
				status : "success",
				result : servers
			});
		});
	}
});

/**
 * Export
 */

module.exports = routes;
