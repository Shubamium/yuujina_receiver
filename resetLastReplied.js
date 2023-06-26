require("dotenv").config();
const axios = require("axios");
async function resetLastRepliedTweet() {
  const apiKey = process.env.RESTDB_KEY;
  const header = {
    headers: {
      "Content-Type": "application/json",
      "x-apikey": apiKey,
    },
  };
  const req = await axios.patch(
    `https://twitterarmy-2fda.restdb.io/rest/config/${process.env.RESTDB_FIELDID_CONFIG}`,
    { lastRepliedTweet: 0 },
    header
  );
  console.log(req.status);
}
resetLastRepliedTweet();
