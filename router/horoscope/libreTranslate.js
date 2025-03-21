const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.LIBRETRANSLATE_API_KEY;
const API_URL = "https://libretranslate.com/translate";

async function libreTranslate(dataRu, language) {
  async function translateObject(obj, targetLang) {
    if (Array.isArray(obj)) {
      return Promise.all(obj.map(text => translateText(text, targetLang)));
    } else if (typeof obj === "object" && obj !== null) {
      const translatedObj = {};
      for (const key in obj) {
        translatedObj[key] = await translateObject(obj[key], targetLang);
      }
      return translatedObj;
    }
    return obj; // Return as-is if not translatable
  }

  async function translateText(text, targetLang) {
    try {
      const response = await axios.post(API_URL, {
        q: text,
        source: "auto",
        target: targetLang,
        api_key: API_KEY,
      });

      return response.data.translatedText;
    } catch (error) {
      console.error(`Translation failed for "${text}": ${error}`);
      return text; // Fallback to original text
    }
  }

  const translatedResults = {};
  const translationPromises = Object.keys(dataRu).map(async (sign) => {
    translatedResults[sign] = await translateObject(dataRu[sign], language);
  });

  await Promise.all(translationPromises);
  return translatedResults;
}

module.exports = libreTranslate;