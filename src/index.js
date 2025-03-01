const express = require('express');
const path = require('path');
const scraper = require('./scraper');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Store price data in memory
let priceCache = [];
let lastUpdated = null;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint to get GPU prices
app.get('/api/prices', async (req, res) => {
  try {
    // If we have cached data less than 15 minutes old, use that
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    if (priceCache.length > 0 && lastUpdated && lastUpdated > fifteenMinutesAgo) {
      console.log('Returning cached price data');
      return res.json(priceCache);
    }
    
    console.log('Fetching fresh price data...');
    const prices = await scraper.getGPUPrices();
    
    // Update cache
    priceCache = prices;
    lastUpdated = new Date();
    
    res.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    
    // If we have any cached data, return that instead of an error
    if (priceCache.length > 0) {
      console.log('Returning stale cached data due to error');
      return res.json(priceCache);
    }
    
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Schedule price updates every hour
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running scheduled price update...');
    const prices = await scraper.getGPUPrices();
    priceCache = prices;
    lastUpdated = new Date();
    console.log(`Price update completed at ${lastUpdated.toLocaleString()}`);
  } catch (error) {
    console.error('Error during scheduled price update:', error);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`
=======================================
  NVIDIA RTX 5090 GPU Price Tracker
=======================================
  Server running on http://localhost:${PORT}
  Press Ctrl+C to stop
=======================================
  `);
});