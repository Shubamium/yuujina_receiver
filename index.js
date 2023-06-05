const { default: axios } = require('axios');
const express = require('express');
const app = express();

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/webhook', async (req, res) => {
  // Use Apify to fetch data or perform scraping
    const payload = req.body;
    // console.log(payload);
    // console.log('haize');
    const datasetId = payload.resource.defaultDatasetId;
    const datasetReq = await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items`);
    const lastTweetId = datasetReq.data[1].id;
    console.log(lastTweetId);
        
    // Get last replied tweet id from a simple rest api database;
    // Compare the twoo
    // If it's the same id then don't reply
    // If it isn't the same id then it's a new tweet
    // If it's a new tweet then get the full text 
    // initialize the twitter api wrapper v2 and login with access token
    
    // Get openAI chat gpt to generate a response based on the tweet
    // reply to twitter with the lastTweetId
    // Do the same for every alt account you have

    res.sendStatus(200);
});

// Define other routes as needed

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});