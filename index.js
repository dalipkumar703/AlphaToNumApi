'use strict';

const Bcrypt = require('bcrypt');
const Hapi = require('hapi');
const Basic = require('hapi-auth-basic');
const Boom = require('boom');
const server = new Hapi.Server();
server.connection({ port: 3000 });

const users = {
    john: {
        username: 'john',
        password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',   // 'secret'
        name: 'John Doe',
        id: '2133d32a'
    }
};

const validate = function (request, username, password, callback) {
    const user = users[username];
    if (!user) {
        return callback(null, false);
    }

    Bcrypt.compare(password, user.password, (err, isValid) => {
        callback(err, isValid, { id: user.id, name: user.name });
    });
};

const dbOpts = {
    url: 'mongodb://dalip:dannyLUCK@ds163181.mlab.com:63181/daliptodoapp',
    settings: {
        poolSize: 10
    },
    decorate: true
};
server.register({
    register: require('hapi-mongodb'),
    options: dbOpts,

}, function (err) {
    if (err) {
        console.error(err);
        throw err;
    }

    server.route( {
        method: 'GET',
        path: '/alpha/{id}',
        config: {
            auth: 'simple',
            handler: function (request, reply) {
              const db = request.mongo.db;
              const ObjectID = request.mongo.ObjectID;


              db.collection('counting').findOne({ alpha: request.params.id}, function (err, result) {

              if (err) {
                return reply(Boom.internal('Internal MongoDB error', err));
              }
              console.log("result",result);
              reply(result);
              });
            }
        }

    });

    server.start(function() {
        console.log(`Server started at ${server.info.uri}`);
    });
});
server.register(Basic, (err) => {

    if (err) {
        throw err;
    }

    server.auth.strategy('simple', 'basic', { validateFunc: validate });
    server.auth.default('simple');
    server.route({
        method: 'GET',
        path: '/',
        config: {
            auth: 'simple',
            handler: function (request, reply) {
                reply('hello, ' + request.auth.credentials.name);
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/{alphanum}',
        config: {
            auth: 'simple',
            handler: function (request, reply) {
                reply('hello, ' + request.params.alphanum);
            }
        }
    });
    server.start((err) => {

        if (err) {
            throw err;
        }

        console.log('server running at: ' + server.info.uri);
    });
});
