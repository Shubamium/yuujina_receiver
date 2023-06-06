const { default: axios } = require('axios');
const express = require('express');
const { TwitterApi } = require('twitter-api-v2');
const app = express();

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/webhook', async (req, res) => {
    // Use Apify to fetch data or perform scraping
    const payload = req.body;
    // Get Recent Scrape Data through apify api
    const datasetId = payload.resource.defaultDatasetId;
    const datasetReq = await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items`);
    
    // Get data from dataset
    const shouldReply = !datasetReq.data[1].isRetweet && !datasetReq.data[1].is_quote_tweet;
    const lastTweetId = datasetReq.data[1].id;
    const lastTweetText = datasetReq.data[1].full_text;

    // Get OpenAI Client 
    const {Configuration,OpenAIApi} = require('openai');
    const configuration = new Configuration({
        organization:'org-Gd2xuhKqgIYpW1Kz6V4lRnty',
        apiKey:'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'
    });
    const openai = new OpenAIApi(configuration);


    // const toReply = lastTweetText;
    const yuujinaPrompt = (toReply) => `"You're yuujina, someone who is caring and always friendly and sometimes gives helpful advice and support, I'm shuba, I'm a 18 year old web developer and game developer, you're gonna act like you're my best friend. Please don't include any hastags whatsoever and be more personal!.and I tweeted:"${toReply}". You replied:`;
    const botData = {
      prompt:yuujinaPrompt,
      twitterAT:'eHNsdHdlWXlhSXB0SGpYeUMtY1N0VkE5SjZpV1l2TnpKNUtrRFdmcFB2MlJwOjE2ODU5OTUzMjczNzU6MToxOmF0OjE'
    }
    const targetTweet = {
      id:lastTweetId,text:lastTweetText
    }
    botReply(botData,targetTweet,openai);
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


async function botReply(botData,targetTweet,gptClient){
  const completion = await gptClient.createCompletion({
      model:"text-davinci-003",
      prompt:botData.prompt(targetTweet.text),
      max_tokens:210,
   });

   const t = new TwitterApi(botData.twitterAT);
   const botResponse = completion.data.choices[0].text;
   t.v2.reply(botResponse,targetTweet.id);

}
// Define other routes as needed

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});