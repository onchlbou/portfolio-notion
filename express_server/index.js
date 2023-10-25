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

function replaceImageUrlWithLocal(data) {
  // Convert string data to object
  let content;
  if (typeof data === 'string') {
      content = JSON.parse(data);
  } else {
      content = data;
  }

  // Define a regex to match the Notion image URLs
  const imageUrlRegex = /https:\/\/www\.notion\.so\/image\/[^\s"]+/;
  for (let key in content) {
      const value = content[key].value;
      if (value && value.format && value.format.page_cover) {
          const imageUrl = value.format.page_cover;
          if (imageUrlRegex.test(imageUrl)) {
              const imageName = path.basename(new URL(imageUrl).pathname);
              const localImagePath = path.join('.cache', imageName);
              value.format.page_cover = localImagePath;
              //console.log(`Replaced image URL ${imageUrl} with local path ${localImagePath}`);
          }
      }
  }

  return content;
}

async function cacheImageFromUrl(url) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  const imageName = path.basename(new URL(url).pathname);
  const imagePath = path.join(cachePath, imageName);
  fs.writeFileSync(imagePath, buffer);
}

app.get('/fetchNotionData/:pageId', async (req, res) => {
  const { pageId } = req.params;
  const cachedFilePath = path.join(cachePath, `${pageId}.json`);

  if (fs.existsSync(cachedFilePath)) {
    const cachedData = fs.readFileSync(cachedFilePath, 'utf-8');
    return res.json(JSON.parse(cachedData));
  }

  try {
    let response = await fetch(`http://nathanhue.com/fetchNotionData/${pageId}`);
    
    if (response.status === 404) {
      response = await fetch(`https://notion-api.splitbee.io/v1/page/${pageId}`);
    }

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.text();
    // Cache image before writing modified data to cache
    const imageUrlRegex = /https:\/\/images\.unsplash\.com\/[^\s"]+/g;
    const imageUrls = (data.match(imageUrlRegex) || []);
    for (const imageUrl of imageUrls) {
      console.log(imageUrl)
      await cacheImageFromUrl(imageUrl);
    }

    const modifiedData = replaceImageUrlWithLocal(data);
    fs.writeFileSync(cachedFilePath, JSON.stringify(modifiedData)); 
    res.json(modifiedData);
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/refreshCache', async (req, res) => {
  
  const pageIds = req.body.pageIds || [];
  for (let pageId of pageIds) {
    try {
      //console.log(pageId)
      const response = await fetch(`https://notion-api.splitbee.io/v1/page/${pageId}`);
      const data = await response.text();
      // Cache image before writing modified data to cache
      const imageUrlRegex = /https:\/\/images\.unsplash\.com\/[^\s"]+/g;
      const imageUrls = (data.match(imageUrlRegex) || []);
      for (const imageUrl of imageUrls) {
        await cacheImageFromUrl(imageUrl);
      }

      const modifiedData = replaceImageUrlWithLocal(data);
      const cachedFilePath = path.join(cachePath, `${pageId}.json`);
      fs.writeFileSync(cachedFilePath, JSON.stringify(modifiedData));
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