require('dotenv').config({ path: 'sample.env' });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const { URL } = require('url');

const app = express();

console.log('MONGO_URI:', process.env.MONGO_URI); // Debugging: Log the MongoDB URI to ensure it's being loaded

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});

// Basic Configuration
const port = process.env.PORT || 3000;

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true, unique: true },
  short_url: { type: String, required: true, unique: true }
});

const URLModel = mongoose.model('URL', urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false })); // for application/x-www-form-urlencoded
app.use(bodyParser.json()); // for application/json

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Generate a unique short URL
const generateUniqueShortUrl = async () => {
  let short_url;
  let existingURL;
  do {
    short_url = Math.floor(Math.random() * 100000).toString();
    existingURL = await URLModel.findOne({ short_url: short_url });
  } while (existingURL);
  return short_url;
};

// API endpoint to shorten URL
app.post('/api/shorturl', async function (req, res) {
  let url = req.body.url;

  try {
    let urlObj = new URL(url);
    console.log('Parsed URL Object:', urlObj);

    // Additional hostname validation
    if (!urlObj.hostname || urlObj.hostname.startsWith('.') || urlObj.hostname.includes(' ')) {
      return res.json({ error: 'invalid url' });
    }

    dns.lookup(urlObj.hostname, async (err, address, family) => {
      if (err || !address) {
        console.error('DNS Lookup Error:', err);
        return res.json({ error: 'invalid url' });
      } else {
        console.log('DNS Lookup Address:', address);
        let original_url = urlObj.href;

        try {
          let existingURL = await URLModel.findOne({ original_url: original_url });
          if (existingURL) {
            return res.json({ original_url: existingURL.original_url, short_url: existingURL.short_url });
          } else {
            let short_url = await generateUniqueShortUrl();

            let resObj = {
              original_url: original_url,
              short_url: short_url
            };

            let newURL = new URLModel(resObj);
            await newURL.save();
            return res.json(resObj);
          }
        } catch (dbErr) {
          console.error('Error interacting with database:', dbErr);
          return res.json({ error: 'failed to interact with database' });
        }
      }
    });
  } catch (err) {
    console.error('URL Parsing Error:', err);
    return res.json({ error: 'invalid url' });
  }
});

// API endpoint to redirect to the original URL
app.get('/api/shorturl/:short_url', async function (req, res) {
  let short_url = req.params.short_url;

  try {
    let urlData = await URLModel.findOne({ short_url: short_url });
    if (urlData) {
      return res.redirect(urlData.original_url);
    } else {
      return res.json({ error: 'No short URL found for the given input' });
    }
  } catch (err) {
    console.error('Error finding short URL:', err);
    return res.json({ error: 'Error finding short URL' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
