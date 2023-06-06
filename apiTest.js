const { default: axios } = require("axios");
require('dotenv').config();
const {TwitterApi} = require('twitter-api-v2');
async function loadData(){
   const req = await axios.get('https://api.apify.com/v2/datasets/GJBCsEIf4kcx87uI5/items');
   console.log(req.data.length);
}

async function testGpt(){
   // const {Configuration,OpenAIApi} = require('openai');
   // const configuration = new Configuration({
   //    organization:'org-Gd2xuhKqgIYpW1Kz6V4lRnty',
   //    apiKey:process.env.OPENAI_KEY
   // });
   // const openai = new OpenAIApi(configuration);
   // // openai.
   // const myTweet = "Haven't been playing a lot of games recently. . . I'm busy >.<";
   // const yuujinaPrompt = `"You're yuujina, someone who is caring and always friendly and sometimes gives helpful advice and support, I'm shuba, I'm a 18 year old web developer and game developer, you're gonna act like you're my best friend. Please don't include any hastags whatsoever and be more personal and also don't prompt any follow up question!, and I tweeted:"${myTweet}". You replied:`;
   // const completion = await openai.createCompletion({
   //    model:"text-davinci-003",
   //    prompt:yuujinaPrompt,
   //    max_tokens:210,
   // });

   // const keys = require('./config/KEY_YUUJIN.json');
   // const t = new TwitterApi(keys);
   // await t.v2.reply('hello again and again','1666049200134684672');
   // const t = new TwitterApi({
      
   // const apikey = process.env.RESTDB_KEY;
   // const res = await axios.put(`https://twitterarmy-2fda.restdb.io/rest/config/${process.env.RESTDB_FIELDID_CONFIG}`,{lastRepliedTweet:'1666049200134684671'},{headers:{
   //    "Content-Type":'application/json',
   //    "x-apikey":apikey
   // }});

   console.log(await testGetRestDb());

   async function testGetRestDb(){
      try{
         const apikey = process.env.RESTDB_KEY;
         const res = await axios.get(`https://twitterarmy-2fda.restdb.io/rest/config/${process.env.RESTDB_FIELDID_CONFIG}`,{ headers:{
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

   // console.log(res.data);
   // });
   // const botResponse = completion.data.choices[0].text;
   // console.log({tweet:targetTweet.text,botResponse});
   // return true;
   // console.log(yuujinaPrompt);
   // const req = await axios.get('https://api.apify.com/v2/datasets/GJBCsEIf4kcx87uI5/items');
   // console.log(completion.data.choices[0]);
   // const req = await axios.get('');
}



testGpt();
// console.log(loadData());