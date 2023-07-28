const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('../routes/routes');

function expressConfig(app) {
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({
        extended: true
    }));
    app.use(helmet());
    app.use(routes);
}

module.exports = expressConfig;
