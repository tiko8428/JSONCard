// const rp = require("request-promise-native");
const moment = require("moment");
const { sendResponse } = require("./common");
const { getZodiacByEnType } = require("./scraper");
const { getZodiacByOtherLanguage } = require("./findfateApi");
const { getTodayJsonFile,
	getHoroscope,
	checkCash,
	getPredictionByLanguage,
	translateToLanguage,
	getBasePredictionAndCash,
	updateCash,
} = require("./helper");
const { googleTranslateBySign } = require("./googleTranslate");

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

const getZodiacBySign = async (language, sign) => {
	const localData = getTodayJsonFile() || await getBasePredictionAndCash();
	if (!localData) return undefined;
	// hastat data ka
	if (localData[language]) {
		if (localData[language][sign]) return localData[language][sign];
		const ruData = localData.ru[sign];
		const translated = await googleTranslateBySign(ruData, language);
		if (!translated) return undefined;
		updateCash({ language, sign, data: translated });
		return translated;
	} else {
		const ruData = localData.ru[sign];
		const translated = await googleTranslateBySign(ruData, language);
		if (!translated) return undefined;
		updateCash({ language, sign, data: translated });
		return translated;
	}
}


const handlers = {
	getLanguages,
	getCategories,
	getZodiacBySign,
};

module.exports = handlers;
