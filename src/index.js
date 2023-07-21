const express = require('express');
const config = require('./config/config')[process.env.NODE_ENV];
const app = express();

// Setup express server
require('./config/express-config')(app);

app.get('/', (req, res) => {
    console.log(req.query);
    res.json({ message: 'Some message' })
});

app.listen(
    config.PORT,
    () => console.log('Server is listening on port: ' + config.PORT)
);
