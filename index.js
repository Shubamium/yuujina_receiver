const express = require('express');
const app = express();
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/webhook', async (req, res) => {
  // Use Apify to fetch data or perform scraping
  // and send the response back to the client
//   const data = await fetchData();
    console.log(req);
    res.status(200).send();
});

// Define other routes as needed

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});