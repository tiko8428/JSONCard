const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const {
  extractWordHyphenation,
  extractIPA,
  extractOrigin,
  extractMeanings,
  extractSynonym,
  extractAntonym,
  extractExamples,
  extractIdiom,
  extractWordCombinations,
  extractTranslations,
  extractInflection,
  extractVerbInflection
} = require("./germanWiki/scraper");



const germanWikiRouter = express.Router();


const searchWord = (word) => {
  return `https://de.wiktionary.org/w/api.php?action=query&format=json&generator=prefixsearch&gpslimit=6&gpssearch=${word}`
};

const getPageListForWord = async (word) => {
  const url = searchWord(word);
  const res = await axios.get(encodeURI(url));
  const pages = res?.data?.query?.pages || [];
  return Object.keys(pages).map((k) => ({ ...pages[k] }));

}

germanWikiRouter.get('/search/:word', async(req,res) => {
  try {
    res.setHeader("Content-Type", "application/json");
    const { word } = req.params;
    if (word) {
      const pages = await getPageListForWord(word);
      res.send(JSON.stringify({ pages }));
    } else {
      res.status(404).send(JSON.stringify({ pages: [] }));
    }
  }
  catch (e) {
    res.status(500).send(JSON.stringify({ message: e.message || "unexpected error" }));
  }
})

const gotoPage = (pageId, section = 1) => {
  return `https://de.wiktionary.org/w/api.php?action=parse&pageid=${pageId}&section=${section}&format=json`
};

const loadPageData = async (pageId, section = 1) => {
  const url = gotoPage(pageId, section);
  const { data } = await axios.get(url);
  if (data.parse) {
    const { title, text, pageid } = data.parse;
    return { title, text, pageid };
  }
  return { title: "", text: "", pageid: pageId };

}

const loadInflectionPage = async (word) => {
  const pageName = `Flexion:${word}`;
  const pages = await getPageListForWord(pageName);
  for (const { title, pageid } of pages) {
    if (title.trim() === pageName.trim()) {
      return await loadPageData(pageid);

    }
  }
  return null;
};

germanWikiRouter.get('/page/:id', async (req, res) => {
  try {
    res.setHeader("Content-Type", "application/json");
    const pageId = req.params.id;
    
    if (pageId) {
      const { pageid, title, text } = await loadPageData(pageId);
      const $ = cheerio.load(text["*"]);
      let payload = {
        pageid,
        title,
        ...extractWordHyphenation($),
        ...extractIPA($),
        ...extractMeanings($),
        ...extractOrigin($),
        ...extractSynonym($),
        ...extractAntonym($),
        ...extractExamples($),
        ...extractIdiom($),
        ...extractTranslations($),
        ...extractWordCombinations($),
        ...extractInflection($)
      };
      const inflectionPage = await loadInflectionPage(title);
      if (inflectionPage && inflectionPage.text) {
        const $_inflection = cheerio.load(inflectionPage.text["*"]);
        payload.Flexion = Object.assign(payload.Flexion, {...extractVerbInflection($_inflection)})
      }

      res.send(JSON.stringify(payload));
    } else {
      res.status(404).send(JSON.stringify({}));
    }
  }
  catch (e) {
    console.log(e);
    res.status(500).send(JSON.stringify({ message: e.message || "unexpected error" }));
  }
})


module.exports = germanWikiRouter;