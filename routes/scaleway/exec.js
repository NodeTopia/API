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
		paths : ['/provider/scaleway/exec/:id'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {

		var id = req.params.id;
		var cmd = req.body.cmd;
		req.kue.scw.exec({
			id : id,
			cmd : cmd
		}, function(err, lines) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			res.json({
				status : "success",
				result : lines
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
		paths : ['/provider/scaleway/exec'],
		version : '1.0.0',
		auth : true,
		staff : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {

		var cmd = req.body.cmd;
		req.kue.scw.execAll({
			cmd : cmd
		}, function(err, lines) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			res.json({
				status : "success",
				result : lines
			});
		});
	}
});

/**
 * Export
 */

module.exports = routes;
