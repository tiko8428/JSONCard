const dailyUrls = {
  common: "http://ignio.com/r/export/utf/xml/daily/com.xml",
  business: "http://ignio.com/r/export/utf/xml/daily/bus.xml",
  love: "http://ignio.com/r/export/utf/xml/daily/lov.xml",
  health: "http://ignio.com/r/export/utf/xml/daily/hea.xml",
  erotic: "http://ignio.com/r/export/utf/xml/daily/ero.xml",
  cook: "http://ignio.com/r/export/utf/xml/daily/cook.xml",
  anti: "http://ignio.com/r/export/utf/xml/daily/anti.xml",
};
const SIGNS = {
  aries: {},
  taurus: {},
  gemini: {},
  cancer: {},
  leo: {},
  virgo: {},
  libra: {},
  scorpio: {},
  sagittarius: {},
  capricorn: {},
  aquarius: {},
  pisces: {},
};
const WEEKLY = "http://ignio.com/r/export/utf/xml/weekly/cur.xml";

module.exports = {
  dailyUrls,
  SIGNS,
  WEEKLY,
}