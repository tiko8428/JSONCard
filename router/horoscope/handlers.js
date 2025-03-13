// const rp = require("request-promise-native");
const moment = require("moment");
const { sendResponse } = require("./common");
const { getZodiacByEnType } = require("./scraper");
const { getZodiacByOtherLanguage } = require("./findfateApi");
const parseString = require("xml2js").parseString;
const { getTodayJsonFile, getHoroscope } = require("./helper");

const languages = require("./languages");

const HOROSCOPE = {
	daily: {
		common: {},
		business: {},
		love: {},
		health: {},
		erotic: {},
		cook: {},
		anti: {},
	},
	weekly: "",
};

const options = {
	uri: "http://ignio.com/r/export/utf/xml/daily/bus.xml",
	headers: {
		"User-Agent":
			"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36",
	},
};

const getLanguages = () => {
	return languages.supportLanguages;
};

const getCategories = (lang, h) => {
	let categories = [];
	//currentLanguage
	const cl = require(`./locales/${lang}`);
	categories = [
		{
			name: cl.common,
			key: "common",
			theme: "purple",
		},
		{
			name: cl.business,
			key: "business",
			theme: "green",
		},
		{
			name: cl.love,
			key: "love",
			theme: "orange",
		},
		{
			name: cl.ero,
			key: "erotic",
			theme: "orange",
		},
		{
			name: cl.health,
			key: "health",
			theme: "purple",
		},
		{
			name: cl.anti,
			key: "anti",
			theme: "orange",
		},
	];


	return categories;
};

const getAllZodiac = async (language) => {
	const localData = getTodayJsonFile();
	if (localData) {
		if (language !== "ru") {
			// translate 
		} else {
			return localData;
		}
	} else {
		const newHoroscope = getHoroscope();

		return newHoroscope;
	}
};

const getZodiacByName = (language, zodiac) => {
	const localData = getTodayJsonFile();
	let currentZodiac;
	if (localData) {
		currentZodiac = localData[zodiac];
	} else {
		const newHoroscope = getHoroscope();
		currentZodiac = newHoroscope[zodiac];
	}
	// Check language *****************
	if (language !== "ru") {
		//  currentZodiac translate
		return {};
	} else {
		return currentZodiac;
	}

}

// async function getWeekZodiac(opts) {
// 	const options = {
// 		...opts,
// 		uri: urls.weekly,
// 	};
// 	return await rp(options);
// }


const handlers = {
	getLanguages,
	getCategories,
	getAllZodiac,
	getZodiacByName,
};

module.exports = handlers;
