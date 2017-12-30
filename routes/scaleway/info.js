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
		paths : ['/provider/scaleway'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {
		req.kue.scw.servers({}, function(err, servers) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
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
