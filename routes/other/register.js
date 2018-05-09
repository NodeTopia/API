'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];

/**
 * GET /organization/:organization
 * Version: 1.0.0
 */
function createOrg(mongoose, user) {
    return new Promise(async function (resolve, reject) {

        let role, plan, zone;

        try {
            [role, plan, zone] = await Promise.all([
                mongoose.Roles.findOne({
                    name: 'admin'
                }),
                mongoose.Plans.findOne(),
                mongoose.Zone.findOne()
            ])
        } catch (err) {
            return reject(err)
        }
        let quota = new mongoose.Quota({
            zones: [zone],
            plan: plan
        });
        let organization = new mongoose.Organization({
            name: user.username,
            quota: quota,
            membership: [{
                user: user,
                role: role
            }]
        });
        try {
            await Promise.all([
                quota.save(),
                organization.save(),
            ]);
            resolve(organization)
        } catch (err) {
            return reject(err)
        }
    });
}

function createUser(mongoose, body) {

    return new Promise(async function (resolve, reject) {
        let {
            username,
            password,
            email,
            first_name,
            last_name,
        } = body;

        let userInfo = new mongoose.UserInfo({
            first_name: first_name,
            last_name: last_name
        });

        let user = new mongoose.User({
            username: username.toLowerCase(),
            password: password,
            email: email.toLowerCase(),
            info: userInfo
        });

        try {


            await Promise.all([
                userInfo.save(),
                user.save()
            ]);
            return resolve(user)
        } catch (err) {
            return reject(err)
        }

    })

}

routes.push({
    meta: {
        method: 'POST',
        paths: ['/register'],
        version: '1.0.0'
    },
    middleware: async function (req, res, next) {
        let {
            username,
            password,
            email
        } = req.body;


        // validate passwords
        if (password && password.length < 8) {
            return next(new restify.errors.BadRequestError("failure - invalid password. must be at least 8 character"));
        } else if (username.match(/^[a-z0-9]+$/i) === null) {
            return next(new restify.errors.BadRequestError("failure - invalid username. must be alphanumeric"));
        } else {

            let [err, user] = await req.to(req.mongoose.User.findOne({
                $or: [
                    {username: username.toLowerCase()},
                    {email: email.toLowerCase()}
                ]
            }))
            if (err) {
                return next(new restify.errors.InternalError(err.message || err));
            }

            if (user) {
                return next(new restify.errors.BadRequestError("failure - account exists"));
            }

            [err, user] = await req.to(createUser(req.mongoose, req.body))

            if (err) {
                return next(new restify.errors.InternalError(err.message || err));
            }

            try {
                await createOrg(req.mongoose, user)
                res.json({
                    status: "sucsess"
                });
            } catch (err) {
                next(new restify.errors.InternalError(err.message || err));
            }

        }
    }
});

/**
 * Export
 */

module.exports = routes;
