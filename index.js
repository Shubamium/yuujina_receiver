const express = require('express');
const app = express();
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/api/data', async (req, res) => {
  // Use Apify to fetch data or perform scraping
  // and send the response back to the client
  const data = await fetchData();
  res.json(data);
});

app.post('',async(req,res)=>{
    
})
// Define other routes as needed

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});