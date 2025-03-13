const express = require("express");

// const Hapi = require("hapi");
// const Inert = require("inert");
const { getCategories, getAllZodiac,getZodiacByName, getLanguages } = require("./horoscope/handlers");
// const  getLanguages  = require("./horoscope/languages");

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
  const { language } = req.query || {language:"ru"};

  const categories = getCategories(language);
  if (categories && categories.length > 0) {
    res.status(200).json(categories);
  }
  res.status(500).json({ message: "No languages found" });
});

horoscopeRouter.get('/zodiac/categories', (req, res) => {
    const { language } = req.query || {language:"ru"};

  const categories = getCategories(language);
  if (categories && categories.length > 0) {
    res.status(200).json(categories);
  }
  res.status(500).json({ message: "No languages found" });
});

horoscopeRouter.get('/zodiac', async (req, res) => {
  const { language, category, type } = req.query || {language:"ru", category: "", type: ""};
  const horoscope = await getAllZodiac(language, category, type);
  if(horoscope){
    res.status(200).json(horoscope);
  }else{
    res.status(500).json({ message: "No Zodiac horoscope found" });
  }
});



module.exports = horoscopeRouter;
