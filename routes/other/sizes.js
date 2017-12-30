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
		paths : ['/sizes'],
		version : '1.0.0',
		auth : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {

		req.mongoose.Size.find({

		}, function(err, sizes) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			res.json({
				status : "success",
				result : sizes.map(req.format.size)
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
		paths : ['/sizes/:name'],
		version : '1.0.0',
		auth : true,
		//role : 'admin'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;

		req.mongoose.Size.findOne({
			name : name
		}, function(err, size) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			if (!size) {
				return next(new restify.errors.NotFoundError('Size ' + name + ' not found'));
			}
			res.json({
				status : "success",
				result : req.format.size(size)
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
