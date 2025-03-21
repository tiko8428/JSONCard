const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const languages = require("./languages");
const {googleTranslate} = require("./googleTranslate");
const libreTranslate = require("./libreTranslate");

function _translate(obj, language) {
  return libreTranslate(obj, language)
  // return googleTranslate(obj, language);
}

const _removeNewlines = (obj) => {
  if (typeof obj === "string") {
    return obj.replace(/\n/g, ""); // Remove all newlines
  } else if (Array.isArray(obj)) {
    return obj.map(_removeNewlines);
  } else if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, _removeNewlines(value)])
    );
  }
  return obj;
};
const removeField = (obj, fieldToRemove) => {
  if (typeof obj !== "object" || obj === null) {
    return obj; // Return as is if not an object
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeField(item, fieldToRemove));
  }

  return Object.fromEntries(
    Object.entries(obj)
      .filter(([key]) => key !== fieldToRemove) // Remove the specific field
      .map(([key, value]) => [key, removeField(value, fieldToRemove)])
  );
}

function _saveObjectToJsonFile(obj) {
  const folderPath = path.join(__dirname, 'temp'); // Converts to absolute path
  const filename = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const fullPath = folderPath + "/" + filename + ".json";
  const jsonData = JSON.stringify(obj, null, 2);

  // Ensure directory exists
  const dir = path.dirname(folderPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, jsonData, 'utf8');
}

function _clearFolder() {
  const folderPath = path.join(__dirname, 'temp');
  if (!fs.existsSync(folderPath)) {
    console.error("Folder does not exist.");
    return;
  }

  fs.readdirSync(folderPath).forEach(file => {
    const filePath = path.join(folderPath, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  });
}

async function _fetchAndConvertXML(url) {
  try {
    const response = await axios.get(url);
    return await parseStringPromise(response.data);
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

const getHoroscope = async (language) => {
  const urls = {
    daily: {
      common: "http://ignio.com/r/export/utf/xml/daily/com.xml",
      business: "http://ignio.com/r/export/utf/xml/daily/bus.xml",
      love: "http://ignio.com/r/export/utf/xml/daily/lov.xml",
      health: "http://ignio.com/r/export/utf/xml/daily/hea.xml",
      erotic: "http://ignio.com/r/export/utf/xml/daily/ero.xml",
      cook: "http://ignio.com/r/export/utf/xml/daily/cook.xml",
      anti: "http://ignio.com/r/export/utf/xml/daily/anti.xml",
    },
    weekly: "http://ignio.com/r/export/utf/xml/weekly/cur.xml",
  };

  let ruResults = {
    aries: { daily: {}, weekly: {} },
    taurus: { daily: {}, weekly: {} },
    gemini: { daily: {}, weekly: {} },
    cancer: { daily: {}, weekly: {} },
    leo: { daily: {}, weekly: {} },
    virgo: { daily: {}, weekly: {} },
    libra: { daily: {}, weekly: {} },
    scorpio: { daily: {}, weekly: {} },
    sagittarius: { daily: {}, weekly: {} },
    capricorn: { daily: {}, weekly: {} },
    aquarius: { daily: {}, weekly: {} },
    pisces: { daily: {}, weekly: {} },
  };

  const getDaily = async () => {
    const dailyUrls = { ...urls.daily }
    for (const [category, value] of Object.entries(dailyUrls)) {
      if (value) {
        let dailyData = await _fetchAndConvertXML(value);
        for (const [zodiac,] of Object.entries(ruResults)) {
          ruResults[zodiac].daily[category] = { ...dailyData.horo[zodiac][0] };
        }
      }
    }
  }

  const getWeekly = async () => {
    const weeklyUrl = urls.weekly;
    let weeklyData = await _fetchAndConvertXML(weeklyUrl);
    weeklyData = weeklyData.horo;
    delete weeklyData.date;
    for (const [zodiac,] of Object.entries(ruResults)) {
      ruResults[zodiac].weekly = { ...weeklyData[zodiac][0] };
    }
  }

  const getYearly = async () => { }

  await getDaily();
  await getWeekly();
  await getYearly();
  //******** Remove \n 
  ruResults = _removeNewlines(ruResults);
  //******** translate results to oder languages  
  let maltyLanguageResults = {};
  try {
    maltyLanguageResults = await _translate(ruResults, language);
  }
  catch {
    maltyLanguageResults = { ru: ruResults };
    console.error("error on translation")
  }
  //******** CLEAR FOLDER
  _clearFolder()
  //******** SAVE TO FILE
  _saveObjectToJsonFile(maltyLanguageResults);
  return maltyLanguageResults;
};

function getTodayJsonFile() {
  //  return file in correct language
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const filePath = path.join(__dirname, 'temp', `${today}.json`);

  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading JSON file:', error);
      return undefined;
    }
  }
  return undefined;
};

const getBasePredictionAndCash = async () => {
  const urls = {
    daily: {
      common: "http://ignio.com/r/export/utf/xml/daily/com.xml",
      business: "http://ignio.com/r/export/utf/xml/daily/bus.xml",
      love: "http://ignio.com/r/export/utf/xml/daily/lov.xml",
      health: "http://ignio.com/r/export/utf/xml/daily/hea.xml",
      erotic: "http://ignio.com/r/export/utf/xml/daily/ero.xml",
      cook: "http://ignio.com/r/export/utf/xml/daily/cook.xml",
      anti: "http://ignio.com/r/export/utf/xml/daily/anti.xml",
    },
    weekly: "http://ignio.com/r/export/utf/xml/weekly/cur.xml",
  };

  let ruResults = {
    aries: { daily: {}, weekly: {} },
    taurus: { daily: {}, weekly: {} },
    gemini: { daily: {}, weekly: {} },
    cancer: { daily: {}, weekly: {} },
    leo: { daily: {}, weekly: {} },
    virgo: { daily: {}, weekly: {} },
    libra: { daily: {}, weekly: {} },
    scorpio: { daily: {}, weekly: {} },
    sagittarius: { daily: {}, weekly: {} },
    capricorn: { daily: {}, weekly: {} },
    aquarius: { daily: {}, weekly: {} },
    pisces: { daily: {}, weekly: {} },
  };

  const getDaily = async () => {
    const dailyUrls = { ...urls.daily }
    for (const [category, value] of Object.entries(dailyUrls)) {
      if (value) {
        let dailyData = await _fetchAndConvertXML(value);
        for (const [zodiac,] of Object.entries(ruResults)) {
          ruResults[zodiac].daily[category] = { ...dailyData.horo[zodiac][0] };
        }
      }
    }
  }

  const getWeekly = async () => {
    const weeklyUrl = urls.weekly;
    let weeklyData = await _fetchAndConvertXML(weeklyUrl);
    weeklyData = weeklyData.horo;
    delete weeklyData.date;
    for (const [zodiac,] of Object.entries(ruResults)) {
      ruResults[zodiac].weekly = { ...weeklyData[zodiac][0] };
    }
  }

  const getYearly = async () => { }

  await getDaily();
  await getWeekly();
  await getYearly();
  //******** Remove \n 
  ruResults = _removeNewlines(ruResults);
  ruResults = removeField(ruResults, "tomorrow02");
  //******** CLEAR FOLDER
  _clearFolder()
  //******** SAVE TO FILE
  _saveObjectToJsonFile({ ru: ruResults });
  return { ru: ruResults };
}

const translateToLanguage = async (language) => {
  const data = getTodayJsonFile();
  if (!data) {
    console.error("NO RU DATA");
    return undefined
  };
  const translatedData = await _translate(data.ru, language);
  return translatedData;
}

const checkCash = () => {
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const filePath = path.join(__dirname, 'temp', `${today}.json`);
  return fs.existsSync(filePath);
}
const updateCash = ({language, sign, data}) => {
  let cash = getTodayJsonFile();
  if(!cash) return undefined;
  if(cash[language]){
    cash[language] = {
      ...cash[language],
      [sign]: data
    }
  }else{
    cash = {
      ...cash,
      [language]: {
        [sign]:data,
      }
    }
  }
  _saveObjectToJsonFile(cash);
  return cash;
}
const getPredictionByLanguage = (language) => {
  const existingData = getTodayJsonFile()
  if (existingData[language] && Object.keys(existingData[language]).length > 0) {
    return existingData[language];
  } else {
    return undefined;
  }
};

const helpers = {
  getTodayJsonFile,
  getHoroscope,
  checkCash,
  getPredictionByLanguage,
  translateToLanguage,
  getBasePredictionAndCash,
  updateCash,
};


module.exports = helpers;
