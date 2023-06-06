const { default: axios } = require("axios");



async function loadData(){
   const req = await axios.get('https://api.apify.com/v2/datasets/GJBCsEIf4kcx87uI5/items');
   console.log(req.data.length);
}

async function testGpt(){
   const {Configuration,OpenAIApi} = require('openai');
   const configuration = new Configuration({
      organization:'org-Gd2xuhKqgIYpW1Kz6V4lRnty',
      apiKey:'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'
   });
   const openai = new OpenAIApi(configuration);
   // openai.
   const myTweet = "Haven't been playing a lot of games recently. . . I'm busy >.<";
   const yuujinaPrompt = `"You're yuujina, someone who is caring and always friendly and sometimes gives helpful advice and support, I'm shuba, I'm a 18 year old web developer and game developer, you're gonna act like you're my best friend. Please don't include any hastags whatsoever and be more personal!.and I tweeted:"${myTweet}". You replied:`;
   const completion = await openai.createCompletion({
      model:"text-davinci-003",
      prompt:yuujinaPrompt,
      max_tokens:10,
      max_tokens:210,
   });


   const req = await axios.get('https://api.apify.com/v2/datasets/GJBCsEIf4kcx87uI5/items');
   console.log(completion.data.choices[0]);
   // const req = await axios.get('');
}



testGpt();
// console.log(loadData());