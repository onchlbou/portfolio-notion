import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3001;
const isDevelopment = process.env.NODE_ENV === 'development';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cachePath = path.join(__dirname, 'cache');

if (!fs.existsSync(cachePath)) {
  fs.mkdirSync(cachePath);
}
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/fetchNotionData/:pageId', async (req, res) => {
  const { pageId } = req.params;
  const cachedFilePath = path.join(cachePath, `${pageId}.json`);

  if (fs.existsSync(cachedFilePath)) {
    const cachedData = fs.readFileSync(cachedFilePath, 'utf-8');
    return res.json(JSON.parse(cachedData));
  }

  // If cache doesn't exist, fetch dynamically
  try {
    let response = await fetch(`http://nathanhue.com/fetchNotionData/${pageId}`);
    
    if (response.status === 404) {
      response = await fetch(`https://notion-api.splitbee.io/v1/page/${pageId}`);
    }

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    
    fs.writeFileSync(cachedFilePath, JSON.stringify(data)); // Cache the fetched data
    res.json(data);
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/refreshCache', async (req, res) => {
  const pageIds = req.body.pageIds || []; // Extract pageIds from request body
  
  console.log(pageIds);

  for (let pageId of pageIds) {
    try {
      const response = await fetch(`https://notion-api.splitbee.io/v1/page/${pageId}`);
      const data = await response.json();
      const cachedFilePath = path.join(cachePath, `${pageId}.json`);
      fs.writeFileSync(cachedFilePath, JSON.stringify(data));
    } catch (error) {
      console.error(`Error refreshing cache for pageId ${pageId}:`, error);
    }
  }

  res.send('Cache refreshed');
});

if (isDevelopment) {
  http.createServer(app).listen(port, () => {
      console.log(`HTTP Server running at http://localhost:${port}/`);
  });
} else {
  const httpsOptions = {
      key: fs.readFileSync('/etc/letsencrypt/live/nathanhue.com/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/nathanhue.com/fullchain.pem')
  };
  
  https.createServer(httpsOptions, app).listen(port, () => {
      console.log(`HTTPS Server running at https://localhost:${port}/`);
  });
}