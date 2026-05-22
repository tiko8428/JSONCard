const express = require("express");
const fs = require("fs");
const path = require("path");

const lingoRouter = express.Router();
const structurePath = path.join(__dirname, "Lingo_Structure");

const BASE_URL = "https://thegeneralapps.com";

const SUPPORTED_LANGUAGES = new Set([
  "en",
  "ru",
  "uk",
  "es",
  "fr",
  "ar",
  "tr",
  "it",
  "ro",
  "sv",
  "pt",
  "fa",
  "ko",
  "ja",
  "nl",
  "zh",
  "hr",
  "hy",
]);

const DEFAULT_LANGUAGE = "de";

const pickLanguage = (ln) => {
  if (!ln || typeof ln !== "string") {
    return { language: DEFAULT_LANGUAGE, fallbackToGerman: true };
  }

  const normalizedRaw = ln.toLowerCase();
  const normalized = normalizedRaw === "ua" ? "uk" : normalizedRaw;
  if (!SUPPORTED_LANGUAGES.has(normalized)) {
    return {
      language: DEFAULT_LANGUAGE,
      fallbackToGerman: true,
      unsupportedLanguage: ln,
      supported: Array.from(SUPPORTED_LANGUAGES).sort(),
    };
  }

  return { language: normalized, fallbackToGerman: false };
};

const readStructure = () => {
  const fileContent = fs.readFileSync(structurePath, "utf-8");
  return JSON.parse(fileContent);
};

const slugifyChapterId = (chapterId) =>
  String(chapterId || "")
    .trim()
    .toLowerCase();

const buildChapterUrl = (chapterId, language) => {
  const slug = slugifyChapterId(chapterId) || "coming-soon";
  const url = new URL(`/lingo/${slug}`, BASE_URL);
  if (language) {
    url.searchParams.set("ln", language);
  }
  return url.toString();
};

const withChapterUrls = (structure, language) => ({
  ...structure,
  levels: (structure.levels || []).map((level) => ({
    ...level,
    chapters: (level.chapters || []).map((chapter) => ({
      ...chapter,
      url: buildChapterUrl(chapter.id, language),
    })),
  })),
});

lingoRouter.get("/structure", (req, res) => {
  const { ln } = req.query;
  const { language, fallbackToGerman, unsupportedLanguage, supported } = pickLanguage(ln);

  try {
    const structure = withChapterUrls(readStructure(), language);
    res.json({
      ...structure,
      language,
      ...(fallbackToGerman
        ? {
            fallbackToGerman: true,
            ...(unsupportedLanguage
              ? {
                  message: `Unsupported language code '${unsupportedLanguage}'. Returned German structure by default.`,
                  supportedLanguages: supported,
                }
              : {}),
          }
        : {}),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Unable to load structure" });
  }
});

lingoRouter.get("/chapters/:chapterId", (req, res) => {
  const { ln } = req.query;
  const { language, fallbackToGerman, unsupportedLanguage, supported } = pickLanguage(ln);

  try {
    const { chapterId } = req.params;
    const structure = withChapterUrls(readStructure(), language);
    for (const level of structure.levels || []) {
      const chapter = (level.chapters || []).find(({ id }) => id === chapterId);
      if (chapter) {
        return res.json({
          language,
          level: { id: level.id, title: level.title },
          chapter,
          ...(fallbackToGerman
            ? {
                fallbackToGerman: true,
                ...(unsupportedLanguage
                  ? {
                      message: `Unsupported language code '${unsupportedLanguage}'. Returned German chapter by default.`,
                      supportedLanguages: supported,
                    }
                  : {}),
              }
            : {}),
        });
      }
    }
    res.status(404).json({ message: "Chapter not found" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Unable to load chapter" });
  }
});

module.exports = lingoRouter;
