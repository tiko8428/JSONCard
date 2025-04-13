const express = require("express");
// const {
//   getCategories,
//   // getDailyBySign,
//   getWeeklyBySign,
//   getYearlyBySign
// } = require("./horoscope/handlers");
const {
  getDailyBySign,
  getYearlyBySign,
  getWeeklyBySign,
} = require("./horoscope/handlers");
const { SIGNS } = require("./horoscope/constants");


function queryCheckMiddleware(req, res, next) {
  const { language, sign } = req.query;
  if (!language) { res.status(404).json({ message: "you need to sand LANGUAGE as a query" }); return; };

  if (!sign) { res.status(404).json({ message: "you need to sand SIGN as a query" }); return; };

  const hasSign = Object.entries(SIGNS).some(([key, value]) => key === sign);
  if (!hasSign) { res.status(404).json({ message: "you need to sand VALID SIGN as a query" }); return; };

  next();
}


const horoscopeRouter = express.Router();


horoscopeRouter.get('/zodiac', queryCheckMiddleware, async (req, res) => {
  // ******** Return all by SIGN
  const { language, sign } = req.query;
  try {
    const YearlyHoroscope = await getYearlyBySign(language, sign);
    const WeeklyHoroscope = await getWeeklyBySign(language, sign);
    const DailyHoroscope = await getDailyBySign(language, sign);

    res.status(200).json({
      yearly: YearlyHoroscope,
      weekly: WeeklyHoroscope,
      daily: DailyHoroscope,
    });

  } catch (error) {
    res.status(500).json({ message: "No Yearly horoscope found" });
  }
});


horoscopeRouter.get("/yearly", queryCheckMiddleware, async (req, res) => {
  const { language, sign } = req.query;
  const horoscope = await getYearlyBySign(language, sign);
  if (horoscope) {
    res.status(200).json(horoscope);
  } else {
    res.status(500).json({ message: "No Yearly horoscope found" });
  }
})

horoscopeRouter.get('/weekly', queryCheckMiddleware, async (req, res) => {
  const { language, sign } = req.query;

  const horoscope = await getWeeklyBySign(language, sign);
  if (horoscope) {
    res.status(200).json(horoscope);
  } else {
    res.status(500).json({ message: "No Zodiac horoscope found" });
  }
});

horoscopeRouter.get('/daily', queryCheckMiddleware, async (req, res) => {
  const { language, sign } = req.query;

  const horoscope = await getDailyBySign(language, sign);
  if (horoscope) {
    res.status(200).json(horoscope);
  } else {
    res.status(500).json({ message: "No Zodiac horoscope found" });
  }
});

module.exports = horoscopeRouter;
