const express = require('express');
const path = require('path');

require('dotenv').config({ path: path.resolve('./.env') })
const PORT = process.env.PORT;

const app = express();



app.listen(
    PORT,
    () => console.log('Server is listening on port: ' + PORT)
);
