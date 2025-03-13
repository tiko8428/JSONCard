const rp = require("request-promise-native");
const cheerio = require("cheerio");
const moment = require("moment");
const { sendResponse } = require("./common");
const HOROSCOPE = {
	daily: {
		common: {},
	},
};

const urls = {
	common: {
		baseUrl: "https://horoscope.findyourfate.com/dailyhoroscopetoday-otherlang.php",
	},
};

const supportedLanguages = {
	en: "english",
	nl: "dutch",
	de: "german",
	fr: "french",
	es: "spanish",
	ms: "malay",
	pt: "portuguese",
};

async function makeRequest(qs) {
	const options = {
		url: urls.common.baseUrl,
		qs,
	};
	return rp(options);
}

function getText(html) {
	const $ = cheerio.load(html);
	return $("body p")[0].children[0].data;
}

async function getZodiacByOtherLanguage(request, h) {
	const { category, type } = request.params;
	const { language } = request.query;
	const mode = supportedLanguages[language] || supportedLanguages.en;
	if (!urls[category])
		return {
			meta: {
				status: "200",
			},
			data: [],
		};
	const date = moment(new Date()).format("DD.MM.YYYY");
	const dates = {
		yesterday: moment(date, "DD-MM-YYYY")
			.subtract(1, "days")
			.format("DD.MM.YYYY"),
		today: date,
		tomorrow: moment(date, "DD-MM-YYYY")
			.add(1, "days")
			.format("DD.MM.YYYY"),
	};
	if (
		HOROSCOPE.daily[category] &&
		HOROSCOPE.daily[category][date] &&
		HOROSCOPE.daily[category][date][type] &&
		HOROSCOPE.daily[category][date][type][mode]
	) {
		console.log(`found daily this date ${mode}`);
		return sendResponse(
			request,
			HOROSCOPE.daily[category][date][type][mode],
			null,
			dates
		);
	}
	const queryString = {
		mode: mode,
		sign: type,
	};
	const [yesterdayHtml, todayHtml, tomorrowHtml] = await Promise.all([
		makeRequest({
			...queryString,
			hday: dates.yesterday.split(".")[0],
			hmonth: dates.yesterday.split(".")[1],
			hyear: dates.yesterday.split(".")[2],
		}),
		makeRequest({
			...queryString,
			hday: dates.today.split(".")[0],
			hmonth: dates.today.split(".")[1],
			hyear: dates.today.split(".")[2],
		}),
		makeRequest({
			...queryString,
			hday: dates.tomorrow.split(".")[0],
			hmonth: dates.tomorrow.split(".")[1],
			hyear: dates.tomorrow.split(".")[2],
		}),
	]);
	if (HOROSCOPE.daily[category][date]) {
		if (HOROSCOPE.daily[category][date][type]) {
			HOROSCOPE.daily[category][date][type] = {
				...HOROSCOPE.daily[category][date][type],
				[mode]: {
					yesterday: [getText(yesterdayHtml)],
					today: [getText(todayHtml)],
					tomorrow: [getText(tomorrowHtml)],
				},
			};
		} else {
			HOROSCOPE.daily[category][date] = {
				[type]: {
					[mode]: {
						yesterday: [getText(yesterdayHtml)],
						today: [getText(todayHtml)],
						tomorrow: [getText(tomorrowHtml)],
					},
				},
			};
		}
	} else {
		HOROSCOPE.daily[category][date] = {
			[type]: {
				[mode]: {
					yesterday: [getText(yesterdayHtml)],
					today: [getText(todayHtml)],
					tomorrow: [getText(tomorrowHtml)],
				},
			},
		};
	}
	return sendResponse(
		request,
		HOROSCOPE.daily[category][date][type][mode],
		null,
		dates
	);
}

module.exports = {
	getZodiacByOtherLanguage,
};
