const mongoose = require('mongoose');
const User = mongoose.model('users');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var config = require('../public/config');


exports.isAuthenticated = function(req, res, next) {
    // console.log("req.headers", req.headers)
    if (req.headers &&
        req.headers.authorization &&
        req.headers.authorization.split(' ')[0] === 'Bearer') {

        var jwtToken =  req.headers.authorization.split(' ')[1];
        // console.log("jwtToken", jwtToken)
        // console.log("config.jwtSecret", config.jwt_secret)
        jwt.verify(jwtToken, config.jwt_secret, function(err, payload) {
            // console.log("err", err)
            // console.log("payload", payload)
            if (err) {
                res.status(401).json({message: 'Unauthorized user!'});
            } else {
                // console.log('decoder: ' + payload.email);
                // find
                User.findOne({
                    'email': payload.email
                }, function(err, user) {
                    if (user) {
                        req.user = user;
                        next();
                    } else {
                        res.status(401).json({ message: 'Unauthorized user!' });
                    }
                })
            }
        });
    } else {
        res.status(401).json({ message: 'Unauthorized user!' });
    }
};

exports.isAdminAuthenticated = function(req, res, next) {
    // console.log("req.headers", req.headers)
    if (req.headers &&
        req.headers.authorization &&
        req.headers.authorization.split(' ')[0] === 'Bearer') {

        var jwtToken =  req.headers.authorization.split(' ')[1];
        // console.log("jwtToken", jwtToken)
        // console.log("config.jwtSecret", config.jwt_secret)
        jwt.verify(jwtToken, config.jwt_secret, function(err, payload) {
            // console.log("err", err)
            // console.log("payload", payload)
            if (err) {
                res.status(401).json({message: 'Unauthorized user!'});
            } else {
                // console.log('decoder: ' + payload.email);
                // if is admin
                if (payload.email === "admin") {
                   // req.user = user;
                    next();
                } else {
                    res.status(401).json({ message: 'Unauthorized user!' });
                }
            }
        });
    } else {
        res.status(401).json({ message: 'Unauthorized user!' });
    }
};