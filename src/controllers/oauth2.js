(function (module) {
    
    "use strict";
    
    var mongoose = require('mongoose');
    var oauth2orize = require('oauth2orize');
    var passport = require('passport');
    var crypto = require('crypto');
    var config = require('../libs/config');
    var UserModel = require('../models/users').UserModel;
    var AccessTokenModel = require('../models/accessToken').AccessTokenModel;
    var RefreshTokenModel = require('../models/refreshToken').RefreshTokenModel;
    
    
    
    // create OAuth 2.0 server
    var server = oauth2orize.createServer();
    
    // Generic error handler
    var errFn = function (cb, err) {
        if (err) { return cb(err); }
    };
    
    
    
    // Destroys any old tokens and generates a new access and refresh token
    var generateTokens = function (modelData, done) {
        var errorHandler = errFn.bind(undefined, done), // curries in `done` callback so we don't need to pass it
            refreshToken,
            refreshTokenValue,
            token,
            tokenValue;
        
        RefreshTokenModel.remove(modelData, errorHandler);
        AccessTokenModel.remove(modelData, errorHandler);
        
        tokenValue = crypto.randomBytes(32).toString('base64');
        refreshTokenValue = crypto.randomBytes(32).toString('base64');
        
        modelData.token = tokenValue;
        token = new AccessTokenModel(modelData);
        
        modelData.token = refreshTokenValue;
        refreshToken = new RefreshTokenModel(modelData);
        
        refreshToken.save(errorHandler);
        token.save(function (err) {
            if (err) { return done(err); }
            done(null, tokenValue, refreshTokenValue, { 'expires_in': config.get('security:tokenLife') });
        });
    };
    
    // Exchange username & password for access token.
    server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, done) {
            UserModel.findOne({ username: username }, function (err, user) {
                if (err) { return done(err); }
                if (!user || !user.checkPassword(password)) {
                    return done(null, false);
                }
                
                var modelData = { userId: user.userId, clientId: client.clientId };
                
                generateTokens(modelData, done);
            });
        }));
    
    // Exchange refreshToken for access token.
    server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
            RefreshTokenModel.findOne({ token: refreshToken, clientId: client.clientId }, function (err, token) {
                if (err) { return done(err); }
                if (!token) { return done(null, false); }
                
                UserModel.findById(token.userId, function (err, user) {
                    if (err) { return done(err); }
                    if (!user) { return done(null, false); }
                    
                    var modelData = { userId: user.userId, clientId: client.clientId };
                    
                    generateTokens(modelData, done);
                });
            });
        }));
    
    
    
    
    module.exports.isAuthenticated = passport.authenticate('bearer', { session: false });

    module.exports.setRoutes = function (app) {
        app.post('/oauth/token', [
            passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
            server.token(),
            server.errorHandler()
        ]);
    };

})(module);