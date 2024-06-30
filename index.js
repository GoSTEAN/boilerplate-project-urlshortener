// require('dotenv').config({ path: 'sample.env' });
require('dotenv').config({ path: 'sample.env' });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

console.log('MONGO_URI:', process.env.MONGO_URI); // Debugging: Log the MongoDB URI to ensure it's being loaded

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
})




// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/shorturl', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
