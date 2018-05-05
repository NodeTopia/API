var mongoose = require('mongoose');
//mongoose.set('debug',true)
console.log(mongoose)
var fs = require('fs');
var url = require('url');
var sys = require('util');
var path = require('path');
var Joi = require('joi');

var restify = require('restify');
var timeout = require('connect-timeout');
var morgan = require('morgan');

var Logger = require('raft-logger-redis').Logger;

var nconf = require('nconf');

nconf.file({
	file : path.resolve(process.argv[2])
});
nconf.env();

var mongoose = require('nodetopia-model');
var authenticate = require('nodetopia-lib/authenticate');
var format = require('nodetopia-lib/format');

var logger = Logger.createLogger(nconf.get('logs'));

/*
 *Setup mongodb store
 */


mongoose.start(nconf.get('mongodb'));
/*
 *Setup Kue jobs
 */

var kue = require('nodetopia-kue');
var jobs = kue.jobs;

jobs.kue.app.listen(3001);

var server = restify.createServer({
	name : nconf.get('api:name'),
	version : nconf.get('api:version'),
	acceptable : nconf.get('api:acceptable')
});

server.server.setTimeout(60000 * 10);

/**
 * CORS
 */

var corsOptions = {
	origins : nconf.get('api:cors:origins'),
	credentials : nconf.get('api:cors:credentials'),
	headers : nconf.get('api:cors:ceaders')
};

server.pre(restify.CORS(corsOptions));
server.opts(/\.*/, function(req, res, next) {
	if ('OPTIONS' == req.method) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type, x-auth-token');
		res.send(200);
	} else {
		next();
	}
});

var throttleOptions = {
	rate : nconf.get('api:throttle:rate'),
	burst : nconf.get('api:throttle:burst'),
	xff : true
};

server.pre(restify.pre.sanitizePath());

server.acceptable.push('text/event-stream');

var plugins = [restify.acceptParser(server.acceptable), restify.throttle(throttleOptions), restify.dateParser(), restify.queryParser({
	mapParams : false
}), restify.fullResponse()];

plugins.push(restify.bodyParser({
	mapParams : false
}));
plugins.push(restify.gzipResponse());
plugins.push(function(req, res, next) {
	req.mongoose = mongoose;
	req.nconf = nconf;
	req.kue = kue;
	req.authenticate = authenticate;
    req.format = format;
    req.to = to;
	next();
});
plugins.push(morgan('tiny', {
	//stream : logger.create({
	//	source : 'system',
	//	channel : 'api.1',
	//	session : nconf.logSession,
	//	bufferSize : 1
	//})
}));

server.use(plugins);

/**
 * Middleware
 */

var registerRoute = function(route) {

	var routeMethod = route.meta.method.toLowerCase();
	var routeName = route.meta.name;
	var routeVersion = route.meta.version;
	var auth = route.meta.auth;
	var staff = route.meta.staff;
	var role = route.meta.role;
	var validation = route.validation;

	route.meta.paths.forEach(function(aPath) {
		var routeMeta = {
			name : routeName,
			path : aPath,
			version : routeVersion
		};
		console.log('API: auth:' + !!auth + '	staff:' + !!staff + '	' + routeMethod + '	' + aPath);
		var routes = [routeMeta];

		if (staff || auth) {
			routes.push(authenticate.auth);

			if (staff) {
				routes.push(authenticate.staff);
			}
			if (role) {
				routes.push(authenticate.roleName(role));
			}
		}

		if (validation) {

			function validate(key) {
				return function(req, res, next) {
					Joi.validate(req[key], validation[key], function(err, value) {
						if (err) {
							next(new restify.errors.InvalidArgumentError('For ' + key + ' ' + err.message));
						} else {
							next()
						}
					});
				};
			}

			if (validation.params) {
				routes.push(validate('params'));
			}
			if (validation.body) {
				routes.push(validate('body'));
			}
			if (validation.query) {
				routes.push(validate('query'));
			}
		}

		if (Array.isArray(route.middleware)) {
			route.middleware.forEach(function(middleware) {
				routes.push(function(req, res, next){
                    middleware(req, res, next);
				});
			});
		} else {
			routes.push(function(req, res, next){
                route.middleware(req, res, next);
            });
		}

		server[routeMethod].apply(server, routes);
	});
};

var setupRoutes = function(routeName) {

	var files = fs.readdirSync(path.join(__dirname, 'routes', routeName));

	files.forEach(function(file) {
		var routes = require(path.join(__dirname, 'routes', routeName, file));
		routes.forEach(registerRoute);
	});
};

['test', 'apps', 'organization', 'addons', 'other', 'dns', 'router', 'letsencrypt', 'scaleway', 'fleet', 'metrics', 'mongodb'].forEach(setupRoutes);

/**
 * Listen
 */

var listen = function(done) {
	server.listen(nconf.get('api:port'), function() {
		if (done) {
			return done();
		}

		console.log();
		console.log('%s now listening on %s', nconf.get('api:name'), server.url);
		console.log();
	});
};
function to(promise) {
    return promise.then(data => {
        return [null, data];
    })
        .catch(err => [err]);
}
if (!module.parent) {
	listen();
}