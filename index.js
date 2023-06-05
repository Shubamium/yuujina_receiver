const express = require('express');
const app = express();

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/webhook', async (req, res) => {
  // Use Apify to fetch data or perform scraping
    const payload = req.body;
    console.log(payload);
    console.log('haize');
    res.sendStatus(200);
});

// Define other routes as needed

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});