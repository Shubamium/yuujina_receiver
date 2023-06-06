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
    const isQTW = datasetReq.data[1].is_quote_tweet;
    const isRTW = datasetReq.data[1].is_retweet;
    const isTHR = datasetReq.data[1].is_thread;
    const shouldReply = (isRTW === false) && (isQTW === false) && (isTHR === false);
    const lastTweetId = datasetReq.data[1].id;
    const lastTweetText = datasetReq.data[1].full_text;

   
    if(!shouldReply){
      console.log('The tweet is either a retweet or quote retweet or a reply tweet, no need to reply');
      res.sendStatus(200);
      return;
    }

    const repliedTweetId = await getLastRepliedTweetId();
    const alreadyReplied = lastTweetId === repliedTweetId;
    console.log({shouldReply,lastTweetId,lastTweetText,repliedTweetId});

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
    const yuujinaPrompt = (toReply) => `
      You're yuujina, someone who is caring and always friendly and sometimes gives helpful advice and support, 
      You're gonna reply to my tweet with these conditions:
      -Please don't use any hastags in the reply tweet and be more personal!,
      -Twitter has 280 characters limit so please don't break the limit.
      -You don't need to greet me.
      The person you're replying to is me,
      I'm shuba I'm a 18 year old web developer and game developer, you're gonna act like you're my best friend. 
      You don't have to greet me.

      I shuba, tweeted:
      "${toReply}"
      You replied:
    `;

    const EI_Jesus = (toReply)=>`
      You're AI Jesus, you will speak the word of god and bring light to whatever I'm tweeting and give your holy words and advice and include the bible verse occasionaly. 
      You're gonna reply to my tweet with these conditions:
        -Please don't use any hastags in the reply tweet and be more personal!,
        -Twitter has 280 characters limit so please don't break the limit.
        -You don't need to greet me.

        The person you're replying to is me,
        I'm shuba I'm a 18 year old web developer and game developer, you're gonna act like you're my best friend. 
        You don't have to greet me.

        I shuba, tweeted:
        "${toReply}"
        You replied:
    `
    const yuujinaKeys = require('./config/KEY_YUUJIN.json');
    const jesusKeys = require('./config/KEY_JESUS.json');
    const botData = [
      {
        prompt:yuujinaPrompt,
        keys:yuujinaKeys
      },
      {
        prompt:EI_Jesus,
        keys:jesusKeys
      }
    ]
    const targetTweet = {
      id:lastTweetId,text:lastTweetText
    }
    const success = []
    // reply with each bot
    success.push(await botReply(botData[0],targetTweet,openai));
    success.push(await botReply(botData[1],targetTweet,openai));

    if(success.every((tries) => {
      if(tries){return true}else{return false};
    })){
      console.log('Bot replied succesfully');
      await updateLastRepliedTweetId(targetTweet.id);
    }else{
      console.log("There's something wrong when generating the reply tweet or trying to reply to the tweet");
    }


    // TO DO LIST----
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


async function updateLastRepliedTweetId(id){
   try{
    const apikey = process.env.RESTDB_KEY;
    const res = await axios.patch(`https://twitterarmy-2fda.restdb.io/rest/config/${process.env.RESTDB_FIELDID_CONFIG}`,{lastRepliedTweet:id},{headers:{
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
      const {lastRepliedTweet} = res.data;
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
      max_tokens:65,
    });

    const t = new TwitterApi(botData.keys);
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