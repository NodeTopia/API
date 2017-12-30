'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization
 * Version: 1.0.0
 */
function createOrg(mongoose, user, cb) {
	mongoose.Roles.findOne({
		name : 'admin'
	}, function(err, role) {
		mongoose.Plans.findOne({

		}, function(err, plan) {
			mongoose.Zone.findOne({

			}, function(err, zone) {

				var quota = new mongoose.Quota({
					zones : [zone],
					plan : plan
				});
				var organization = new mongoose.Organization({
					name : user.username,
					quota : quota,
					membership : [{
						user : user,
						role : role
					}]
				});

				quota.save(function() {
					organization.save(function(err) {
						if (err)
							return cb(err);

						cb(null, organization);
					});
				});
			});
		});
	});
}

function createUser(mongoose, body, cb) {
	var newuser = body.username;
	var newpass = body.password;
	var email = body.email;
	var first_name = body.first_name;
	var last_name = body.last_name;

	var userInfo = new mongoose.UserInfo({
		first_name : first_name,
		last_name : last_name
	});

	userInfo.save(function() {
		var user = new mongoose.User({
			username : newuser,
			password : newpass,
			email : email,
			info : userInfo
		});

		user.save(function(err) {
			if (err)
				return cb(err);

			cb(null, user);
		});
	});
}

routes.push({
	meta : {
		method : 'POST',
		paths : ['/register'],
		version : '1.0.0'
	},
	middleware : function(req, res, next) {
		var newuser = req.body.username;
		var newpass = req.body.password;
		var email = req.body.email;
		var first_name = req.body.first_name;
		var last_name = req.body.last_name;

		// validate passwords
		if (newpass && newpass.length < 8) {
			return next(new restify.errors.BadRequestError("failure - invalid password. must be at least 8 character"));
		} else if (newuser.match(/^[a-z0-9]+$/i) === null) {
			return next(new restify.errors.BadRequestError("failure - invalid username. must be alphanumeric"));
		} else {
			req.mongoose.User.findOne({
				username : newuser
			}, function(err, user) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}

				if (user) {
					return next(new restify.errors.BadRequestError("failure - account exists"));
				}
				createUser(req.mongoose, req.body, function(err, user) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}
					createOrg(req.mongoose, user, function(err) {
						if (err) {
							return next(new restify.errors.InternalError(err.message || err));
						}
						res.json({
							status : "sucsess"
						});
					});
				});
			});
		}
	}
});

/**
 * Export
 */

module.exports = routes;
