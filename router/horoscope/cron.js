
const CronJob = require('cron').CronJob;
const _ = require('lodash');
const fs = require('fs');
// const path = `${__dirname}/numbers.json`;
const path = "./numbers.json";
const moment = require('moment');

global.NUMBERS = {};

if (fs.existsSync(path)) {
    global.NUMBERS = require(path);
} else {
    makeWeeklyGeneration()
}

module.exports = {
    makeWeeklyGeneration
};
const cronContext = {
    onTick: makeWeeklyGeneration,
    start: false,
    timeZone: 'Europe/Moscow'
};

function makeWeeklyGeneration(date) {
    if (!date) date = moment(new Date()).format("DD.MM.YYYY");
    const dates = {
        yesterday: moment(date, "DD-MM-YYYY").subtract(1, 'days').format("DD.MM.YYYY"),
        today: date,
        tomorrow: moment(date, "DD-MM-YYYY").add(1, 'days').format("DD.MM.YYYY"),
        tomorrow02: moment(date, "DD-MM-YYYY").add(2, 'days').format("DD.MM.YYYY")
    };
    const zodiacs = ['capricorn', 'aquarius', 'pisces', 'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius'];
    const categories = ['health', 'love', 'business'];
    let fileData;
    if (fs.existsSync(path)) {
        fileData = require(path);
        fs.unlinkSync(path);
    }
    const nums = {
        [date]: {},
        [dates.yesterday]: {},
        [dates.tomorrow]: {},
        [dates.tomorrow02]: {},
        week: {}
    };

    zodiacs.forEach(one => {
        nums[date][one] = fileData && fileData[date]
            ? fileData[date][one]
            : getZodiacCategoryNumbers(categories);
        nums[dates.yesterday][one] = fileData && fileData[dates.yesterday]
            ? fileData[dates.yesterday][one]
            : getZodiacCategoryNumbers(categories);
        nums[dates.tomorrow][one] = fileData && fileData[dates.tomorrow]
            ? fileData[dates.tomorrow][one]
            : getZodiacCategoryNumbers(categories);
        nums[dates.tomorrow02][one] = fileData && fileData[dates.tomorrow02]
            ? fileData[dates.tomorrow02][one]
            : getZodiacCategoryNumbers(categories);
        nums.week[one] = getZodiacCategoryNumbers(categories);
    });
    global.NUMBERS = {...nums};
    fs.writeFile(path, JSON.stringify(nums), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
    return nums;
}

function getZodiacCategoryNumbers(categories) {
    const resultObj = {};
    categories.forEach(one => {
        resultObj[one] = _.random(4, 10, true).toFixed(1)
    });
    return resultObj;
}

// const job = new CronJob({
//     cronTime: '00 30 08 * * 0-6',
//     ...cronContext
// });
//
// job.start();
