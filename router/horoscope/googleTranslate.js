const { Translate } = require("@google-cloud/translate").v2;
const API_KEY = process.env.GOOGLE_API_KEY;


async function googleTranslate(dataRu, language) {
  const translate = new Translate({ key: API_KEY });

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
      let [translations] = await translate.translate(text, targetLang);
      return translations;
    } catch (error) {
      console.error(`Translation failed for "${text}": ${error}`);
      return text; // Fallback to original text
    }
  }
  const translatedResults = {};
  // Create an array of translation promises
  const translationPromises = Object.keys(dataRu).map(async (sign) => {
    translatedResults[sign] = await translateObject(dataRu[sign], language);
  });

  // Wait for all translations to complete
  await Promise.all(translationPromises);
  return translatedResults
}

async function googleTranslateBySign(data, language) {
  console.log("start Translating");
  const translate = new Translate({ key: API_KEY });
  async function translateText(text) {
    if (!text) return text; // Ignore empty strings
    const [translated] = await translate.translate(text, language);
    return translated;
  }

  async function translateObject(obj) {
    if (typeof obj === "string") {
      return await translateText(obj);
    }

    if (Array.isArray(obj)) {
      return await Promise.all(obj.map(item => translateObject(item)));
    }

    if (typeof obj === "object" && obj !== null) {
      const entries = await Promise.all(
        Object.entries(obj).map(async ([key, value]) => [key, await translateObject(value)])
      );
      return Object.fromEntries(entries);
    }

    return obj;
  }

  const t = await translateObject(data); 
  return t;
};

async function googleTranslateYearly (data, language){
  const translate = new Translate({ key: API_KEY });

  async function translateText(text) {
    if (!text) return text; // Ignore empty strings
    const [translated] = await translate.translate(text, language);
    return translated;
  }
  if (typeof data === "object" && data !== null) {
    const entries = await Promise.all(
      Object.entries(data).map(async ([key, value]) => [key, await translateText(value)])
    );
    return Object.fromEntries(entries);
  }
};

module.exports = {
  googleTranslate,
  googleTranslateBySign,
  googleTranslateYearly,
}