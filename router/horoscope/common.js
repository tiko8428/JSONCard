const { makeWeeklyGeneration } = require("./cron");
const axios = require("axios");
const { DateTime } = require("luxon");
module.exports = {
	sendResponse,
};

function returnNumbersArray(request, type) {
	return [
		{
			name: request.i18n.__("health"),
			number: `${type.health}/10`,
		},
		{
			name: request.i18n.__("love"),
			number: `${type.love}/10`,
		},
		{
			name: request.i18n.__("business"),
			number: `${type.business}/10`,
		},
	];
}

async function sendResponse(request, daily, week, dates) {
	const { type } = request.params;
	const { language } = request.query;
	console.log(language);
	const date = new Date();
	const weekNumber = DateTime.now().weekNumber;
	const year = date.getFullYear();
	const monthNumber =
		date.getMonth() + 1 < 10
			? "0" + (date.getMonth() + 1)
			: date.getMonth() + 1;
	const today_date =
		year +
		"" +
		monthNumber +
		"" +
		(date.getDate() < 10 ? "0" + date.getDate() : date.getDate());

	const response_weekly = await axios.get(
		`https://cdn1.tdhapp.com/get/weekly/${type}.${year}w${weekNumber}.c099aae02709038f79022ae3409e2323878fe10df6c01967579d561631f6b076.${today_date}.ios.json`
	);
	const response_monthly = await axios.get(
		`https://cdn1.tdhapp.com/get/monthly/${type}.${year}m${monthNumber}.c099aae02709038f79022ae3409e2323878fe10df6c01967579d561631f6b076.${today_date}.ios.json`
	);
	const weekly_data = response_weekly.data;
	const monthly_data = response_monthly.data;
	let data = [];
	if (language === "en") {
		data = [
			{
				horoscope: {
					name: request.i18n.__("yesterday"),
					data: daily.yesterday[0].replace(/\n/g, ""),
				},
				date: dates.yesterday,
				numbers: global.NUMBERS[dates.yesterday]
					? returnNumbersArray(
							request,
							global.NUMBERS[dates.yesterday][type]
					  )
					: returnNumbersArray(
							request,
							makeWeeklyGeneration(dates.today)[
								dates.yesterday
							][type]
					  ),
			},
			{
				horoscope: {
					name: request.i18n.__("today"),
					data: daily.today[0].replace(/\n/g, ""),
				},
				date: dates.today,
				numbers: global.NUMBERS[dates.today]
					? returnNumbersArray(
							request,
							global.NUMBERS[dates.today][type]
					  )
					: returnNumbersArray(
							request,
							makeWeeklyGeneration(dates.today)[
								dates.today
							][type]
					  ),
			},
			{
				horoscope: {
					name: request.i18n.__("tomorrow"),
					data: daily.tomorrow[0].replace(/\n/g, ""),
				},
				date: dates.tomorrow,
				numbers: global.NUMBERS[dates.tomorrow]
					? returnNumbersArray(
							request,
							global.NUMBERS[dates.tomorrow][type]
					  )
					: returnNumbersArray(
							request,
							makeWeeklyGeneration(dates.today)[
								dates.tomorrow
							][type]
					  ),
			},
			{
				horoscope: {
					name: "weekly",
					data: weekly_data ? weekly_data.data[0].reading : "",
				},
				date: weekly_data ? weekly_data.data[0].reqDate : "",
			},
			{
				horoscope: {
					name: "monthly",
					data: monthly_data ? monthly_data.data[0].reading : "",
				},
				date: monthly_data ? monthly_data.data[0].reqDate : "",
			},
		];
	} else {
		data = [
			{
				horoscope: {
					name: request.i18n.__("yesterday"),
					data: daily.yesterday[0].replace(/\n/g, ""),
				},
				date: dates.yesterday,
				numbers: global.NUMBERS[dates.yesterday]
					? returnNumbersArray(
							request,
							global.NUMBERS[dates.yesterday][type]
					  )
					: returnNumbersArray(
							request,
							makeWeeklyGeneration(dates.today)[
								dates.yesterday
							][type]
					  ),
			},
			{
				horoscope: {
					name: request.i18n.__("today"),
					data: daily.today[0].replace(/\n/g, ""),
				},
				date: dates.today,
				numbers: global.NUMBERS[dates.today]
					? returnNumbersArray(
							request,
							global.NUMBERS[dates.today][type]
					  )
					: returnNumbersArray(
							request,
							makeWeeklyGeneration(dates.today)[
								dates.today
							][type]
					  ),
			},
			{
				horoscope: {
					name: request.i18n.__("tomorrow"),
					data: daily.tomorrow[0].replace(/\n/g, ""),
				},
				date: dates.tomorrow,
				numbers: global.NUMBERS[dates.tomorrow]
					? returnNumbersArray(
							request,
							global.NUMBERS[dates.tomorrow][type]
					  )
					: returnNumbersArray(
							request,
							makeWeeklyGeneration(dates.today)[
								dates.tomorrow
							][type]
					  ),
			},
		];
	}

	if (dates.tomorrow02) {
		data.push({
			horoscope: {
				name: request.i18n.__("tomorrow02"),
				data: daily.tomorrow02[0].replace(/\n/g, ""),
			},
			date: dates.tomorrow02,
			numbers: global.NUMBERS[dates.tomorrow02]
				? returnNumbersArray(
						request,
						global.NUMBERS[dates.tomorrow02][type]
				  )
				: returnNumbersArray(
						request,
						makeWeeklyGeneration(dates.today)[
							dates.tomorrow02
						][type]
				  ),
		});
	}

	if (week) {
		data.push({
			horoscope: {
				name: request.i18n.__("week"),
				data: week[0].replace(/\n/g, ""),
			},
			date: request.i18n.__("week"),
			numbers: global.NUMBERS.week
				? returnNumbersArray(request, global.NUMBERS.week[type])
				: returnNumbersArray(
						request,
						makeWeeklyGeneration()["week"][type]
				  ),
		});
	}

	return {
		meta: {
			status: "200",
		},
		data,
	};
}
