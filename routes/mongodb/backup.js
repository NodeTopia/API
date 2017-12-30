'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';
var Minio = require('minio');

var minioClient = new Minio(require('nconf').get('s3'));
/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/mongodb/backup', '/apps/:name/mongodb/backup'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;
		var id = req.params.id;

		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			req.mongoose.AddOn.find({
				app : app._id,
				organization : req.organization._id,
				//is_active : true,
				$or : [{
					type : 'mongodb'
				}, {
					type : 'replica'
				}, {
					type : 'shard'
				}],
			}, function(err, addons) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				if (!addons.length) {
					return next(new restify.errors.NotFoundError('No addon found'));
				}
				req.mongoose.BackupTar.find({
					$or : addons.map(function(addon) {
						return {
							addon : addon._id
						};
					})
				}, function(err, tars) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}
					res.json({
						status : "success",
						result : tars.map(req.format.backupTar)
					}, 200);
				});
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
		paths : ['/organization/:organization/apps/:name/mongodb/backup/:id', '/apps/:name/mongodb/backup/:id'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;
		var id = req.params.id;

		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			req.mongoose.AddOn.find({
				app : app._id,
				organization : req.organization._id,
				//is_active : true,
				$or : [{
					type : 'mongodb'
				}, {
					type : 'replica'
				}, {
					type : 'shard'
				}],
			}, function(err, addons) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				if (!addons.length) {
					return next(new restify.errors.NotFoundError('No addon found'));
				}
				req.mongoose.BackupTar.find({
					$or : addons.map(function(addon) {
						return {
							addon : addon._id
						};
					}),
					_id : id
				}, function(err, tar) {
					if (err) {
						if (err.name == 'CastError') {
							return next(new restify.errors.NotFoundError('No backup found (' + id + ')'));
						}
						return next(new restify.errors.InternalError(err.message || err));
					}

					if (!tar.length) {
						return next(new restify.errors.NotFoundError('No backup found (' + id + ')'));
					}
console.log(tar)
					res.json({
						status : "success",
						result : req.format.backupTar(tar.shift())
					}, 200);
				});
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
		paths : ['/organization/:organization/apps/:name/mongodb/backup/:id/download', '/apps/:name/mongodb/backup/:id/download'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;
		var id = req.params.id;

		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			req.mongoose.AddOn.find({
				app : app._id,
				organization : req.organization._id,
				//is_active : true,
				$or : [{
					type : 'mongodb'
				}, {
					type : 'replica'
				}, {
					type : 'shard'
				}],
			}, function(err, addons) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				if (!addons.length) {
					return next(new restify.errors.NotFoundError('No addon found'));
				}
				req.mongoose.BackupTar.find({
					$or : addons.map(function(addon) {
						return {
							addon : addon._id
						};
					}),
					_id : id
				}, function(err, tar) {
					if (err) {
						if (err.name == 'CastError') {
							return next(new restify.errors.NotFoundError('No backup found (' + id + ')'));
						}
						return next(new restify.errors.InternalError(err.message || err));
					}

					if (!tar) {
						return next(new restify.errors.NotFoundError('No backup found (' + id + ')'));
					}
					minioClient.getObject('mongobkp', tar.path, function(err, dataStream) {
						if (err) {
							return console.log(err)
						}
						dataStream.pipe(res);
					});
				});
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
		paths : ['/organization/:organization/apps/:name/mongodb/backup/:id', '/apps/:name/mongodb/backup/:id'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;
		var id = req.params.id;

		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			req.mongoose.AddOn.find({
				app : app._id,
				organization : req.organization._id,
				//is_active : true,
				$or : [{
					type : 'mongodb'
				}, {
					type : 'replica'
				}, {
					type : 'shard'
				}],
			}, function(err, addons) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				if (!addons.length) {
					return next(new restify.errors.NotFoundError('No addon found'));
				}
				req.mongoose.BackupTar.find({
					$or : addons.map(function(addon) {
						return {
							addon : addon._id
						};
					}),
					_id : id
				}, function(err, tar) {
					if (err) {
						if (err.name == 'CastError') {
							return next(new restify.errors.NotFoundError('No backup found (' + id + ')'));
						}
						return next(new restify.errors.InternalError(err.message || err));
					}

					if (!tar.length) {
						return next(new restify.errors.NotFoundError('No backup found (' + id + ')'));
					}
					req.kue.addon.backup.restore({
						organization : req.organization.name,
						name : name,
						addon : addons.filter(function() {
							return addon._id == tar[0].addon;
						}).shift(),
						tar : tar[0]._id
					}, function(err, tar) {
						if (err) {
							return next(new restify.errors.InternalError(err.message || err));
						}

						res.json({
							status : "success",
							result : req.format.backupTar(tar)
						}, 200);

					});

				});
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
		paths : ['/organization/:organization/apps/:name/mongodb/backup', '/apps/:name/mongodb/backup'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;
		var id = req.params.id;
		console.log(req.organization)
		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			req.mongoose.AddOn.findOne({
				app : app._id,
				organization : req.organization._id,
				is_active : true,
				$or : [{
					type : 'mongodb'
				}, {
					type : 'replica'
				}, {
					type : 'shard'
				}],
			}, function(err, addon) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				if (!addon) {
					return next(new restify.errors.NotFoundError('No addon found'));
				}

				req.kue.addon.backup.create({
					organization : req.organization.name,
					name : name,
					addon : addon._id
				}, function(err, tar) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}

					res.json({
						status : "success",
						result : req.format.backupTar(tar)
					}, 200);

				});

				console.log(addon)
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
