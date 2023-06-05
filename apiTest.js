const { default: axios } = require("axios");


async function loadData(){
   const req = await axios.get('https://api.apify.com/v2/datasets/GJBCsEIf4kcx87uI5/items');
   console.log(req.data.length);
}

console.log(loadData());