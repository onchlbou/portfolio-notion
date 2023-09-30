import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import https from 'https';
import fs from 'fs';

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());

app.get('/fetchNotionData/:pageId', async (req, res) => {
  const { pageId } = req.params;
  try {
    const response = await fetch(`https://notion-api.splitbee.io/v1/page/${pageId}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

const httpsOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/nathanhue.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/nathanhue.com/fullchain.pem')
};

https.createServer(httpsOptions, app).listen(port, () => {
    console.log(`HTTPS Server running at https://localhost:${port}/`);
});
