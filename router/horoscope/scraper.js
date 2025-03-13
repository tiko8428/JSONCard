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
		baseUrl: "http://ignio.com/e/daily",
	},
};

const zodiac = {
	getZodiacByEnType: async (request, h) => {
		try {
			const { category, type } = request.params;
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
				tomorrow02: moment(date, "DD-MM-YYYY")
					.add(2, "days")
					.format("DD.MM.YYYY"),
			};

			if (
				HOROSCOPE.daily[category] &&
				HOROSCOPE.daily[category][date] &&
				HOROSCOPE.daily[category][date][type]
			) {
				console.log("found daily this date {en}");
				return sendResponse(
					request,
					HOROSCOPE.daily[category][date][type],
					null,
					dates
				);
			}
			const [yesterdayHtml, todayHtml, tomorrowHtml, tomorrow02Html] =
				await Promise.all([
					rp({
						uri: `${urls[category].baseUrl}/yes/${type}.html`,
					}),
					rp({
						uri: `${urls[category].baseUrl}/tod/${type}.html`,
					}),
					rp({
						uri: `${urls[category].baseUrl}/tom/${type}.html`,
					}),
					rp({
						uri: `${urls[category].baseUrl}/tom02/${type}.html`,
					}),
				]);

			HOROSCOPE.daily[category][date] = {
				[type]: {
					yesterday: [await getText(yesterdayHtml)],
					today: [await getText(todayHtml)],
					tomorrow: [await getText(tomorrowHtml)],
					tomorrow02: [await getText(tomorrow02Html)],
				},
			};
			return sendResponse(
				request,
				HOROSCOPE.daily[category][date][type],
				null,
				dates
			);
		} catch (err) {
			console.error(err);
			throw new Error(err);
		}
	},
};

module.exports = zodiac;

async function getText(html) {
	const $ = cheerio.load(html);
	return new Promise((resolve) => {
		$("body div").not((i, el) => {
			if (el.attribs.style) {
				return resolve(el.children[2].data.trim());
			}
		});
	});
}
