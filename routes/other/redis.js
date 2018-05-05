'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];

/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'GET',
        paths: ['/redis'],
        version: '1.0.0',
        auth: true,
        staff: true,
        //role : 'admin'
    },
    middleware: async function (req, res, next) {
        let [err, redis] = await req.to(req.req.mongoose.Redis.find())

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        res.json({
            status: "success",
            result: redis
        });
    }
});
/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'GET',
        paths: ['/redis/:type'],
        version: '1.0.0',
        auth: true,
        staff: true,
        //role : 'admin'
    },
    middleware: async function (req, res, next) {
        let {type} = req.params;

        let [err, redis] = await req.to(req.req.mongoose.Redis.find({
            type: type
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        res.json({
            status: "success",
            result: redis
        });

    }
});
/**
 * POST /zone
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'POST',
        paths: ['/redis'],
        version: '1.0.0',
        auth: true,
        staff: true,
        //role : 'admin'
    },
    middleware: async function (req, res, next) {
        let {
            type,
            host,
            port,
            auth,
            master,
        } = req.body


        let [err, redis] = await req.to(req.req.mongoose.Redis.findOne({
            type: type,
            host: host,
            port: port,
            auth: auth,
            master: master
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        if (redis) {
            return next(new restify.errors.NotFoundError('redis ' + type + ' already used'));
        }
        redis = new req.mongoose.Redis({
            master: master,
            auth: auth,
            host: host,
            port: port,
            type: type
        });
        try {
            await redis.save();
            res.json({
                status: "success",
                result: redis
            });
        } catch (err) {
            next(new restify.errors.InternalError(err.message || err));
        }
    }
});
/**
 * POST /zone
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'DEL',
        paths: ['/redis'],
        version: '1.0.0',
        auth: true,
        staff: true,
        //role : 'admin'
    },
    middleware: async function (req, res, next) {
        let {
            type,
            host,
            port,
            auth,
            master,
        } = req.body


        let [err, redis] = await req.to(req.req.mongoose.Redis.findOne({
            type: type,
            host: host,
            port: port,
            auth: auth,
            master: master
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        if (!redis) {
            return next(new restify.errors.NotFoundError('redis ' + type + ' not found'));
        }
        try {
            await redis.remove();
            res.json({
                status: "success",
                result: redis
            });
        } catch (err) {
            next(new restify.errors.InternalError(err.message || err));
        }
    }
});

/**
 * Export
 */

module.exports = routes;
