const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const { googleTranslateYearly, googleTranslateBySign } = require("./googleTranslate");
const { dailyUrls, SIGNS, WEEKLY } = require("./constants");

function _updateLocalData(obj, folder) {
  const folderPath = path.join(__dirname, folder); // Converts to absolute path
  const fullPath = folderPath + "/" + obj.date + ".json";
  const jsonData = JSON.stringify(obj, null, 2);
  // Ensure directory exists
  const dir = path.dirname(folderPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, jsonData, 'utf8');
}

function _getFormattedDates() {
  function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');  // Ensures 2 digits
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so we add 1
    const yyyy = date.getFullYear(); // Get the full year (e.g., 2025)
    return `${dd}.${mm}.${yyyy}`;  // Return the date in DD.MM.YYYY format
  }

  // Get current date
  const now = new Date();

  // Calculate yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1); // Subtract 1 day from current date

  // Calculate tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1); // Add 1 day to current date

  // Format and return the dates in DD.MM.YYYY format
  return {
    yesterday: formatDate(yesterday),
    today: formatDate(now),
    tomorrow: formatDate(tomorrow)
  };
}

function _clearFolder(exceptions, folder) {

  const folderPath = path.join(__dirname, folder); // Converts to absolute path
  if (!fs.existsSync(folderPath)) {
    console.error(`Folder does not exist: ${folderPath}`);
    return;
  }
  const files = fs.readdirSync(folderPath);
  files.forEach((file) => {
    const filePath = path.join(folderPath, file);
    const baseName = path.basename(file, '.json');
    if (exceptions.includes(baseName)) {
      console.log(`🛑 Skipping: ${file}`);
      return;
    }
    try {
      const stat = fs.lstatSync(filePath);
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`🗑️ Deleted folder: ${file}`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${file}`);
      }
    } catch (err) {
      console.error(`❌ Error deleting ${filePath}:`, err);
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
};

async function _requestDailyData() {
  console.log("=>>>>>>> _requestData")
  const getDaily = async () => {
    const resultData = {
      yesterday: { date: "", ru: {} },
      today: { date: "", ru: {} },
      tomorrow: { date: "", ru: {} }
    };
    Object.entries(dailyUrls).forEach(([category, value]) => {
      for (const zodiacName of Object.keys(SIGNS)) {
        resultData.yesterday.ru[zodiacName] = { [category]: "" };
        resultData.today.ru[zodiacName] = { [category]: "" };
        resultData.tomorrow.ru[zodiacName] = { [category]: "" };
      }
    });
    await Promise.all(
      Object.entries(dailyUrls).map(async ([category, value], index) => {
        let dailyData = await _fetchAndConvertXML(value);
        if (index === 0) {
          resultData.yesterday.date = dailyData.horo.date[0].$.yesterday;
          resultData.today.date = dailyData.horo.date[0].$.today;
          resultData.tomorrow.date = dailyData.horo.date[0].$.tomorrow;
        }
        for (const zodiac of Object.keys(SIGNS)) {
          resultData.yesterday.ru[zodiac][category] = dailyData.horo[zodiac][0].yesterday[0].replace(/\n/g, "");
          resultData.today.ru[zodiac][category] = dailyData.horo[zodiac][0].today[0].replace(/\n/g, "");
          resultData.tomorrow.ru[zodiac][category] = dailyData.horo[zodiac][0].tomorrow[0].replace(/\n/g, "");
        }
      })
    );
    return resultData;
  };

  try {
    const newDailyData = await getDaily();
    return newDailyData;
  } catch (error) {
    console.error(error);
    return undefined
  }
}

function _getLocalFile(fileName, folder) {
  const filePath = path.join(__dirname, folder, `${fileName}.json`);
  if (fs.existsSync(filePath)) {
    try {
      let data = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(data);
      if (Object.keys(data).length < 1) {
        console.error("=>>>> Local file is empty");
        return undefined;
      }
      return data;
    } catch (error) {
      console.error('=>>>>Error reading JSON file:', error);
      return undefined;
    }
  }
};

const _translateYearlyAndCash = async (data, language, sign) => {
  const thisYear = new Date().getFullYear() // Format: YYYY
  const mainData = _getLocalFile(`Yearly-${thisYear}`, "temp");

  const translatedData = await googleTranslateYearly(data, language);
  mainData[language] = mainData[language] || {};
  mainData[language][sign] = translatedData;

  const folderPath = path.join(__dirname, 'temp');
  const filePath = path.join(__dirname, 'temp', `Yearly-${thisYear}.json`);
  const jsonData = JSON.stringify(mainData, null, 2);

  // Ensure directory exists
  const dir = path.dirname(folderPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, jsonData, 'utf8');

  return translatedData;
}

// ******** getDailyBySign
async function getDailyBySign(language, sign) {
  const fileNames = _getFormattedDates();
  let localData = {}
  Object.entries(fileNames).forEach(([name, value]) => {
    localData[name] = _getLocalFile(value, "temp/daily");
  });
  let originalData = {};
  let localDataHasBinChanged = false;

  const checkLocalData = async (day) => {
    if (!localData[day] || localData[day].date !== fileNames[day]) {
      if (Object.entries(originalData).length < 2) {
        originalData = await _requestDailyData();
      }
      _updateLocalData(originalData[day], "temp/daily");
      localData[day] = originalData[day]
      localDataHasBinChanged = true;
    }
  }
  await checkLocalData("yesterday");
  await checkLocalData("today");
  await checkLocalData("tomorrow");

  if (localDataHasBinChanged) {
    _clearFolder([fileNames.yesterday, fileNames.today, fileNames.tomorrow],"temp/daily")
  }

  let languageData = async (day) => {
    localData[day][language] = localData[day][language] || {};
    if (localData[day][language][sign]) {
      return localData[day][language][sign]
    } else {
      const translatedSign = await googleTranslateBySign(localData[day].ru[sign], language);

      _updateLocalData({
        ...localData[day],
        [language]: {
          ...localData[day][language],
          [sign]: translatedSign
        }
      }, "temp/daily");

      return translatedSign
    }
  };

  const returnData = {
    yesterday: await languageData("yesterday"),
    today: await languageData("today"),
    tomorrow: await languageData("tomorrow"),
  }

  return returnData;

}
// ******** getDailyBySign


// ********** getWeeklyBySign

function _getWeeklyRangeString() {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // Sunday = 0 → 7

  // Move to next Monday
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() - dayOfWeek + 8);

  // Next Sunday = next Monday + 6
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);

  const months = [
    'января', 'февраля', 'марта', 'апреля',
    'мая', 'июня', 'июля', 'августа',
    'сентября', 'октября', 'ноября', 'декабря'
  ];

  const start = String(nextMonday.getDate()).padStart(2, '0');
  const end = String(nextSunday.getDate()).padStart(2, '0');
  const month = months[nextSunday.getMonth()];

  return `${start}-${end}${month}`;
}

async function _requestWeeklyData() {
  let weeklyData = await _fetchAndConvertXML(WEEKLY);
  if (!weeklyData) return undefined;
  const { date, ...rest } = weeklyData.horo;
  // .replace(/\n/g, "")
  const formattedWeeklyData = {};
  
  Object.entries(rest).forEach(([key, value],index)=>{
    formattedWeeklyData[key] = formattedWeeklyData[key] || {}
    // if(index==0)console.log(index, value)
    value.forEach(item=>{
      Object.entries(item).forEach(([key2, value2])=>{
        formattedWeeklyData[key][key2] = value2[0].replace(/\n/g, "");
      })
    })
    
  })

  return {
    date: date[0].$.weekly.replaceAll(' ', ''),
    data: formattedWeeklyData
  };
}

const getWeeklyBySign = async (language, sign) => {
  const fileName = `${_getWeeklyRangeString()}`;
  let localData = _getLocalFile(fileName, "temp/weekly") || {};
    console.log("fileName", !localData || !Object.entries(localData).length);

  if (!localData || !Object.entries(localData).length) {
    const requestedData = await _requestWeeklyData();
    if (!requestedData) return undefined;
    localData.date = requestedData.date;
    localData.ru = requestedData.data;
    _updateLocalData(localData, "temp/weekly");
    // _clearFolder([fileName],"temp/weekly");
  }

  localData[language] = localData[language] || {};
  if (localData[language][sign]) {
    return localData[language][sign]
  } else {
    const translatedSign = await googleTranslateBySign(localData.ru[sign], language);
    localData = {
      ...localData,
      [language]: {
        ...localData[language],
        [sign]: translatedSign
      }
    };
    _updateLocalData(localData, "temp/weekly");
  }

  return localData[language][sign];
}

// ********** getWeeklyBySign

//************ getYearlyBySign
const getYearlyBySign = async (language, sign) => {
  const thisYear = new Date().getFullYear() // Format: YYYY
  const yearlyData = _getLocalFile(`Yearly-${thisYear}`, "temp");

  if (!yearlyData) return undefined;
  return yearlyData[language]?.[sign] ?
    yearlyData[language][sign] :
    _translateYearlyAndCash(yearlyData.ru[sign], language, sign);
}
//************ getYearlyBySign

const helpers = {
  getDailyBySign,
  getWeeklyBySign,
  getYearlyBySign
};

module.exports = helpers;
