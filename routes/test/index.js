'use strict';

var restify = require('restify');
var Joi = require('joi');

/**
 * Routes
 */

var routes = [];

/**
 * GET /test1/:name
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/test1/:name'],
		version : '1.0.0',
		auth : false
	},
	validation : {
		params : {
			name : Joi.string().min(10).required()
		}
	},
	middleware : function(req, res, next) {
		res.send({
			foo : 'bar'
		});
		return next();
	}
});
/**
 * POST /test1/:name
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'POST',
		paths : ['/test1/:name'],
		version : '1.0.0',
		auth : false
	},
	validation : {
		params : {
			name : Joi.string().min(10).required()
		},
		body : {
			name : Joi.string().min(10).required(),
			a : Joi.string().min(10).required()
		}
	},
	middleware : function(req, res, next) {
		res.send({
			foo : 'bar'
		});
		return next();
	}
});

/**
 * GET /
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/test/role/:organization'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {
		res.send({
			foo : 'bar'
		});
		return next();
	}
});

/**
 * Export
 */

module.exports = routes;
