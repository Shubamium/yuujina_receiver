const { default: axios } = require("axios");
const express = require("express");
const { TwitterApi } = require("twitter-api-v2");
const app = express();

require("dotenv").config();

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/webhook", async (req, res) => {
  // Use Apify to fetch data or perform scraping
  const payload = req.body;

  // Get Recent Scrape Data through apify api
  const datasetId = payload.resource.defaultDatasetId;
  let datasetReq = null;

  if (!datasetId) {
    console.log("Cannot get the dataset");
    res.sendStatus(200);
  }

  try {
    datasetReq = await axios.get(
      `https://api.apify.com/v2/datasets/${datasetId}/items`
    );
  } catch (err) {
    console.log("Cannot get the dataset:", err);
    res.sendStatus(200);
    return;
  }

  // Get data from dataset
  const isQTW = datasetReq.data[1].is_quote_tweet;
  const isRTW = datasetReq.data[1].is_retweet;
  const isTHR = datasetReq.data[1].is_thread;
  const shouldReply = isRTW === false && isQTW === false && isTHR === false;
  const lastTweetId = datasetReq.data[1].id;
  const lastTweetText = datasetReq.data[1].full_text;

  if (!shouldReply) {
    console.log(
      "The tweet is either a retweet or quote retweet or a reply tweet, no need to reply"
    );
    res.sendStatus(200);
    return;
  }

  const repliedTweetId = await getLastRepliedTweetId();
  const alreadyReplied = lastTweetId === repliedTweetId;
  console.log({ shouldReply, lastTweetId, lastTweetText, repliedTweetId });

  if (alreadyReplied) {
    console.log(
      "The bots already replied to this tweet, waiting for another tweet!"
    );
    res.sendStatus(200);
    return;
  }

  // Get OpenAI Client
  const { Configuration, OpenAIApi } = require("openai");
  const configuration = new Configuration({
    organization: "org-Gd2xuhKqgIYpW1Kz6V4lRnty",
    apiKey: process.env.OPENAI_KEY,
  });
  const openai = new OpenAIApi(configuration);

  // The prompt for each bot
  const yuujinaPrompt = (toReply) => `
      You're yuujina, someone who is caring and always friendly and sometimes gives helpful advice and support, 
      You're gonna reply to my tweet with these conditions:
      - Please don't use any hastags in the reply tweet and be more personal!,
      - Twitter has 280 characters limit so please don't break the limit.
      - You don't need to greet me.
      - Don't put your reply in quotes

      The person you're replying to is me,
      I'm shuba I'm a 18 year old web developer and game developer, you're gonna act like you're my best friend. 
      You don't have to greet me.

      I shuba, tweeted:
      ${toReply}
      You replied:
    `;

  const EI_Jesus = (toReply) => `
      You're AI Jesus, you will speak the word of god and bring light to whatever I'm tweeting and give your holy words and advice and include the bible verse occasionaly. 
      You're gonna reply to my tweet with these conditions:
        - Please don't use any hastags in the reply tweet and be more personal!,
        - Twitter has 280 characters limit so please don't break the limit.
        - You don't need to greet me.
        - Don't put your reply in quotes

        The person you're replying to is me,
        I'm shuba I'm a 18 year old web developer and game developer, you're gonna act like you're my best friend. 
        You don't have to greet me.
        
        I shuba, tweeted:
        ${toReply}
        You replied:
    `;
  const Nekonyata = (toReply) => `
      You're name is Nekonyata, you're a cute(overly cutesy) cat-girl, you will reply to my tweet by acting really cutely and with -nya suffix sometimes. You will take everything I said and somehow make it wholesome and cute. 
      You're gonna reply to my tweet with these conditions:
        - Don't use any hastags in the reply tweet and be more personal!,
        - Twitter has 280 characters limit so please don't break the limit.
        - You don't need to greet me.
        - Don't put your reply in quotes

        The person you're replying to is me,
        I'm shuba I'm a 18 year old web developer and game developer, you're gonna act like you're my best friend. 
        You don't have to greet me.
        
        I shuba, tweeted:
        "${toReply}"
        You replied:
    `;

  const aureliusPrompt = (toReply) => `
        You're Aurelius, you're that annoying/pretentious/cocky friend who's really into philosophy and existensialism. you always somehow manage to turn every conversation into an existential crisis. Always reply to my tweet by turning it into some kind of existential crisis and philosphy themed. You reference greek philosphy often, and use big and confusing words to describe existensialism and dread. reminding me that how life is. and sometimes be pretentious. but also sometimes giving me advices
        You're gonna reply to my tweet with these conditions:
        - Don't use any hastags/twitter tags in the reply tweet and be more personal as if you were talking to me!.
        - Twitter has 280 characters limit so please don't break the limit.
        - You don't need to greet me.
        - Don't put your reply in quotes.
        - Don't include #

        The person you're replying to is me,
        I'm shuba I'm a 18 year old web developer and game developer.
        You don't have to greet me.
        
        I shuba, tweeted:
          ${toReply}
        You replied without quotes:
          
    `;
  const johnlawPrompt = (toReply) => `
    You're John law, you're super into law and legal systems, you're very familiar to everything related to law, you will take everything I tweeted into something law related. and will occasionally refer to legal codes in a certain area and tell me if it's legal or not in a fun fact way. 
    You're gonna reply to my tweet with these conditions:
      - Don't use any hastags/twitter tags in the reply tweet and be more personal as if you were talking to me!.
      - Twitter has 280 characters limit so please don't break the limit.
      - You don't need to greet me.
      - Don't put your reply in quotes.
      - Don't include #

    The person you're replying to is me,
    I'm shuba I'm a 18 year old web developer and game developer.
    You don't have to greet me.
    
    I shuba, tweeted:
      ${toReply}
    You replied without quotes:
      
  `;

  // Twitter Access Keys for the bots
  const yuujinaKeys = require("./config/KEY_YUUJIN.json");
  const jesusKeys = require("./config/KEY_JESUS.json");
  const nekonyataKeys = require("./config/KEY_NEKONYATA.json");
  const aureliusKeys = require("./config/KEY_AURELIUS.json");
  const johnKeys = require("./config/KEY_JOHNLAW.json");

  // List of bots and it's config
  const botData = [
    {
      prompt: yuujinaPrompt,
      keys: yuujinaKeys,
    },
    {
      prompt: EI_Jesus,
      keys: jesusKeys,
    },
    {
      prompt: Nekonyata,
      keys: nekonyataKeys,
    },
    {
      prompt: aureliusPrompt,
      keys: aureliusKeys,
    },
    {
      prompt: johnlawPrompt,
      keys: johnKeys,
    },
  ];
  const targetTweet = {
    id: lastTweetId,
    text: lastTweetText,
  };

  const success = [];
  // reply with each bot
  success.push(await botReply(botData[0], targetTweet, openai));
  success.push(await botReply(botData[1], targetTweet, openai));
  success.push(await botReply(botData[2], targetTweet, openai));
  success.push(await botReply(botData[3], targetTweet, openai));
  success.push(await botReply(botData[4], targetTweet, openai));

  const allBotRepliedSuccess = success.every((tries) => {
    if (tries) {
      return true;
    } else {
      return false;
    }
  });
  // Console log the status of replying for each tweet
  if (allBotRepliedSuccess) {
    console.log("Bot replied succesfully");
    await updateLastRepliedTweetId(targetTweet.id);
  } else {
    console.log(
      "There's something wrong when generating the reply tweet or trying to reply to the tweet"
    );
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

async function updateLastRepliedTweetId(id) {
  try {
    const apikey = process.env.RESTDB_KEY;
    const res = await axios.patch(
      `https://twitterarmy-2fda.restdb.io/rest/config/${process.env.RESTDB_FIELDID_CONFIG}`,
      { lastRepliedTweet: id },
      {
        headers: {
          "Content-Type": "application/json",
          "x-apikey": apikey,
        },
      }
    );
  } catch (err) {
    console.log("Failed to update the last replied tweet:", err.message);
  }
}

async function getLastRepliedTweetId() {
  try {
    const apikey = process.env.RESTDB_KEY;
    const res = await axios.get(
      `https://twitterarmy-2fda.restdb.io/rest/config/${process.env.RESTDB_FIELDID_CONFIG}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-apikey": apikey,
        },
      }
    );
    const { lastRepliedTweet } = res.data;
    if (lastRepliedTweet) {
      return lastRepliedTweet;
    } else {
      return null;
    }
  } catch (err) {
    console.log("Failed to get the last replied tweet:", err);
    return null;
  }
}
async function botReply(botData, targetTweet, gptClient) {
  try {
    const completion = await gptClient.createCompletion({
      model: "text-davinci-003",
      prompt: botData.prompt(targetTweet.text),
      max_tokens: 65,
    });

    const t = new TwitterApi(botData.keys);
    const botResponse = completion.data.choices[0].text.trim();
    console.log({ ...targetTweet, botResponse });
    await t.v2.reply(clampString(botResponse, 275), targetTweet.id);
    return true;
  } catch (err) {
    console.log(err);
    console.log(botData);
    return false;
  }
}

function clampString(toClamp, maxChar) {
  if (toClamp.length <= maxChar) {
    return toClamp;
  } else {
    return toClamp.substring(0, maxChar);
  }
}

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
