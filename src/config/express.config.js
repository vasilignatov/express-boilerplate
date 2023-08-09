const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const routes = require('../routes/routes');
const errorHandler = require('../middlewares/error');
const passport = require('passport');
const jwtStrategy = require('../config/passport.config');
const compression = require('compression');

function expressConfig(app) {

    // set HTTP headers properly
    app.use(helmet());

    // Middleware to enable CORS
    app.use(cors());

    // Middleware to parse requests with JSON payloads
    app.use(express.json());

    // Sanitize request data
    app.use(xss());
    app.use(mongoSanitize());

    // Middleware to parse URL-encoded da
    app.use(express.urlencoded({
        extended: true
    }));

    // Middleware to compress response 
    app.use(compression());

    // Setup passport (use JWT)
    app.use(passport.initialize());
    passport.use('jwt', jwtStrategy);

    // Add modular router
    app.use(routes);
    
    // Global Error Handler
    app.use(errorHandler);
}

module.exports = expressConfig;
