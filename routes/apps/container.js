'use strict';

/**
 * Routes
 */
var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/apps/:name/containers
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/containers', '/apps/:name/containers'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;

		req.mongoose.App.findOne({
			organization : req.organization._id,
			name : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}
			req.mongoose.Build.findOne({
				app : app._id,
				is_active : true
			}, function(err, build) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				if (!build) {
					return next(new restify.errors.NotFoundError('Application ' + name + ' has never run'));
				}
				req.mongoose.Container.find({
					reference : app._id,
					$or : [{
						state : 'RUNNING'
					}, {
						state : 'STARTING'
					}, {
						state : 'INITIALIZING'
					}],
					type : {
						$nin : ['addon', 'build']
					}
				}, function(err, containers) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}
					res.json({
						status : "success",
						result : containers.map(req.format.container)
					}, 200);
				});

			});
		});

	}
});
/**
 * GET /organization/:organization/apps/:name/containers/:id
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/containers/:id', '/apps/:name/containers/:id'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;
		var id = req.params.id;

		req.mongoose.App.findOne({
			organization : req.organization._id,
			name : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}
			req.mongoose.Container.findOne({
				reference : app._id,
				_id : id,
				type : {
					$nin : ['addon', 'build']
				}
			}, function(err, container) {
				if (err) {
					if (err.name == 'CastError') {
						return next(new restify.errors.NotFoundError('Application build not found (' + id + ')'));
					}
					return next(new restify.errors.InternalError(err.message || err));
				}
				if (!container) {
					return next(new restify.errors.NotFoundError('Container ' + id + ' not found'));
				}
				res.json({
					status : "success",
					result : req.format.container(container)
				}, 200);
			});
		});

	}
});

/**
 * GET /organization/:organization/apps/:name/containers/state/:state
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/containers/state/:state', '/apps/:name/containers/state/:state'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;
		var state = req.params.state.toUpperCase();

		req.mongoose.App.findOne({
			organization : req.organization._id,
			name : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}
			req.mongoose.Container.find({
				reference : app._id,
				state : state,
				type : {
					$nin : ['addon', 'build']
				}
			}, function(err, containers) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				res.json({
					status : "success",
					result : containers.map(req.format.container)
				}, 200);
			});

		});

	}
});

/**
 * GET /organization/:organization/apps/:name/containers/type/:type
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/containers/type/:type', '/apps/:name/containers/type/:type'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;
		var type = req.params.type;

		if (type == 'build' || type == 'addon') {
			return next(new restify.errors.NotFoundError('bad conatiner type (' + type + ')'));
		}

		req.mongoose.App.findOne({
			organization : req.organization._id,
			name : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}
			req.mongoose.Container.find({
				reference : app._id,
				type : type
			}, function(err, containers) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				res.json({
					status : "success",
					result : containers.map(req.format.container)
				}, 200);
			});

		});

	}
});
/**
 * Export
 */

module.exports = routes;
