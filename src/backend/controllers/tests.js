(function (module) {

    "use strict";

    module.exports.setAccessControlOrigin = setAccessControlOrigin;
    module.exports.initTestEnvironment = initTestEnvironment;
    module.exports.initDb = initDb;
    //module.exports.setViewModelBase = setViewModelBase;
    //module.exports.setCookie = setCookie;


    //var userController = require('./users');
    var roleController = require('./usersRoles');

    var mongoose = require('mongoose');
    var config = require('../libs/config');
    //var ErrorHandled = require('../models/errorHandled.js');
    var pkg = require('../../../package.json');
    var util = require('../libs/commonFunctions');
    //var util = require('util');



    function initDb(req, cb) {

        var i18n = req.i18n;
        var newRole = {
            name: "Guest"
        };

        function clearDB() {

            // I tested few ways of doing the same thing

            // 1.- This one is the slowest one (in execution time). 
            //     But needs no maintenance 

            //mongoose.connection.db.dropDatabase(function(err, result) {
            //    createRoleGuest();
            //});

            // 2.- This one is faster than the fiorst one (in execution time). 
            //     Removes all documents in all collections in db 


            var modelsInDb = mongoose.connection.modelNames();
            var modelCounter = 0;
            var modelRemoveTrack = null;
            modelRemoveTrack = function (err, rowsAffected) {

                if (err) {
                    console.error(err);
                }

                modelCounter++;

                if (modelCounter < modelsInDb.length) {
                    mongoose.connection.model(modelsInDb[modelCounter]).remove(modelRemoveTrack);
                }
                else {
                    createRoleGuest();
                }
            };

            mongoose.connection.model(modelsInDb[modelCounter]).remove(modelRemoveTrack);
        }
        function createRoleGuest() {

            var newRole = {
                name: "Guest"
            };

            roleController.create(newRole, i18n, function (errRole, roleCreated) {
                if (errRole) return cb(errRole);

                return cb(null, roleCreated);
            });
        }


        if (mongoose.connection.readyState === 0) {

            mongoose.connect(config.get('mongoose:uri'), function (err) {
                if (err) {
                    throw err;
                }
                return clearDB();
            });
        } else {
            return clearDB();
        }

    }

    function initTestEnvironment(app) {
        setAccessControlOrigin(app);
    }

    function setAccessControlOrigin(app) {
        // This is not intended for production environments
        app.use(function (req, res, next) {

            // Website you wish to allow to connect
            res.setHeader('Access-Control-Allow-Origin', '*');
            // Request methods you wish to allow
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            // Request headers you wish to allow
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            // Set to true if you need the website to include cookies in the requests sent
            // to the API (e.g. in case you use sessions)
            res.setHeader('Access-Control-Allow-Credentials', true);
            res.setHeader('Access-Control-Allow-Headers', 'Authorization');
            // Pass to next layer of middleware
            next();
        });
    }


})(module);