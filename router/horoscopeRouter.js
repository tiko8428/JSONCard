const express = require("express");

// const Hapi = require("hapi");
// const Inert = require("inert");
const { 
  getCategories,
  getZodiacBySign,
  getLanguages,
  getYearlyBySign
} = require("./horoscope/handlers");
// const Vision = require("vision");
// require("./cron");


const horoscopeRouter = express.Router();

horoscopeRouter.get('/languages', (req, res) => {
  // notes: "Returns languages list"
  // description: "Get The List Of Supported Languages",
  const lg = getLanguages();
  res.status(200).json(lg);
});

horoscopeRouter.get('/zodiac/signs', (req, res) => {
  // TODO: something is wrong need to return sign list in correct language.

  // 		notes: "Returns categories list",
  // 		description: "Get Categories",
  //    Query / language = "ru"
  const { language } = req.query || { language: "ru" };
  const categories = getCategories(language);
  if (categories && categories.length > 0) {
    res.status(200).json(categories);
  }
  res.status(500).json({ message: "No languages found" });
});

horoscopeRouter.get('/zodiac/categories', (req, res) => {
  const { language } = req.query || { language: "ru" };

  const categories = getCategories(language);
  if (categories && categories.length > 0) {
    res.status(200).json(categories);
  }
  res.status(500).json({ message: "No languages found" });
});

// horoscopeRouter.get('/zodiac', async (req, res) => {
//   const { language } = req.query;
//   if (!language) { res.status(404).json({ message: "you need to sand language as a query" }) };
//   const horoscope = await getAllZodiac(language);
//   if (horoscope) {
//     res.status(200).json(horoscope);
//   } else {
//     res.status(500).json({ message: "No Zodiac horoscope found" });
//   }
// });
horoscopeRouter.get("/yearly", async (req,res)=>{
  const { language, sign } = req.query;
  if (!language) { res.status(404).json({ message: "you need to sand language as a query" }) };
  if (!sign) { res.status(404).json({ message: "you need to sand sign as a query" }) };
  const horoscope = await getYearlyBySign(language, sign);
  if (horoscope) {
    res.status(200).json(horoscope);
  } else {
    res.status(500).json({ message: "No Yearly horoscope found" });
  }
})

horoscopeRouter.get('/zodiac-by-sign', async (req, res) => {
  const { language, sign } = req.query;
  if (!language) { res.status(404).json({ message: "you need to sand language as a query" }) };
  if (!sign) { res.status(404).json({ message: "you need to sand sign as a query" }) };

  const horoscope = await getZodiacBySign(language, sign);
  if (horoscope) {
    res.status(200).json(horoscope);
  } else {
    res.status(500).json({ message: "No Zodiac horoscope found" });
  }
});


module.exports = horoscopeRouter;
