const { default: axios } = require('axios');
const express = require('express');
const { TwitterApi } = require('twitter-api-v2');
const app = express();

require('dotenv').config();

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/webhook', async (req, res) => {
    // Use Apify to fetch data or perform scraping
    const payload = req.body;
   
    // Get Recent Scrape Data through apify api
    const datasetId = payload.resource.defaultDatasetId;
    let datasetReq = null;

    if(!datasetId){
        console.log('Cannot get the dataset');
        res.sendStatus(200);
    }

    try{
      datasetReq =  await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items`);
    }catch(err){
      console.log('Cannot get the dataset:',err);
      res.sendStatus(200);
      return;
    }

    // Get data from dataset
    const shouldReply = !datasetReq.data[1].isRetweet && !datasetReq.data[1].is_quote_tweet;
    const lastTweetId = datasetReq.data[1].id;
    const lastTweetText = datasetReq.data[1].full_text;

    console.log({shouldReply,lastTweetId,lastTweetText});
    if(!shouldReply){
      console.log('The tweet is either a retweet or quote retweet, no need to reply');
      res.sendStatus(200);
      return;
    }

    const repliedTweetId = await getLastRepliedTweetId();
    const alreadyReplied = lastTweetId === repliedTweetId;
    if(alreadyReplied){
      console.log('The bots already replied to this tweet, waiting for another tweet!');
      res.sendStatus(200);
      return;
    }

    // Get OpenAI Client 
    const {Configuration,OpenAIApi} = require('openai');
    const configuration = new Configuration({
        organization:'org-Gd2xuhKqgIYpW1Kz6V4lRnty',
        apiKey:process.env.OPENAI_KEY
    });
    const openai = new OpenAIApi(configuration);


    // const toReply = lastTweetText;
    const yuujinaPrompt = (toReply) => `"You're yuujina, someone who is caring and always friendly and sometimes gives helpful advice and support, I'm shuba, I'm a 18 year old web developer and game developer, you're gonna act like you're my best friend. Please don't include any hastags whatsoever and be more personal!.and I tweeted:"${toReply}". You replied:`;
    const botData = {
      prompt:yuujinaPrompt,
      twitterAT:process.env.YUUJIN_AT
    }
    const targetTweet = {
      id:lastTweetId,text:lastTweetText
    }
    const success = await botReply(botData,targetTweet,openai);

    // Get last replied tweet id from a simple rest api database;
    // Compare the twoo
    // If it's the same id then don't reply
    // If it isn't the same id then it's a new tweet
    // If it's a new tweet then get the full text   
    // initialize the twitter api wrapper v2 and login with access token
    if(success){
      console.log('Bot replied succesfully');
      await updateLastRepliedTweetId(targetTweet.id);
    }else{
      console.log("There's something wrong when generating the reply tweet or trying to reply to the tweet");
    }
    // Get openAI chat gpt to generate a response based on the tweet
    // reply to twitter with the lastTweetId
    // Do the same for every alt account you have

    res.sendStatus(200);
});


async function updateLastRepliedTweetId(id){
   try{
    const apikey = process.env.RESTDB_KEY;
    const res = await axios.patch(`https://twitterarmy-2fda.restdb.io/rest/config/${process.env.RESTDB_FIELDID_CONFIG}`,{lastTweetId:id},{headers:{
        "Content-Type":'application/json',
        "x-apikey":apikey
    }});
   }catch(err){
    console.log('Failed to update the last replied tweet:',err.message);
   }
}

async function getLastRepliedTweetId(){
   try{
      const apikey = process.env.RESTDB_KEY;
      const res = await axios.get(`https://twitterarmy-2fda.restdb.io/rest/config/${process.env.RESTDB_FIELDID_CONFIG}`,{headers:{
          "Content-Type":'application/json',
          "x-apikey":apikey
      }});
      const {lastRepliedTweet} = res.data.lastRepliedTweet;
      if(lastRepliedTweet){
        return lastRepliedTweet;
      }else{
        return null;
      }

   }catch(err){
      console.log('Failed to get the last replied tweet:',err);
      return null;
   }

}
async function botReply(botData,targetTweet,gptClient){

  try{
    const completion = await gptClient.createCompletion({
      model:"text-davinci-003",
      prompt:botData.prompt(targetTweet.text),
      max_tokens:210,
    });

    const t = new TwitterApi(botData.twitterAT);
    const botResponse = completion.data.choices[0].text;
    console.log({...targetTweet,botResponse});
    await t.v2.reply(botResponse,targetTweet.id);
    return true;
  }catch(err){
    console.log(err);
    console.log(botData);
    return false;
  }

}
// Define other routes as needed

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});