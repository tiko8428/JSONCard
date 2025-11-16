import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const english = {
  "page.title": "Irregular verbs – top 5",
  "label.lesson": "Lesson",
  "label.practice": "Practice",
  "label.grammar tip": "Grammar tip",
  "button.start": "Start lesson",
  "button.next": "Next",
  "button.check": "Check",
  "button.finish": "Finish",
  "feedback.default": "",
  "feedback.selectAnswer": "Please choose an answer before checking.",
  "feedback.correctMultipleChoice": "✅ Great job!",
  "feedback.correctDragDrop": "✅ Well done!",
  "feedback.incorrect": "❌ Not quite!",
  "feedback.correctAnswerLabel": "Correct answer:",
  "intro.title": "Irregular verbs – top 5",
  "intro.subtitle": "Your quick refresher",
  "intro.description": "This lesson helps you master the key forms of sein, haben, werden, gehen, and sehen.",
  "intro.level": "Beginner · A1",
  "intro.duration": "10-minute workout",
  "forms.title": "Present-tense overview",
  "forms.subtitle": "Say each row out loud",
  "forms.description": "Highlight stem changes and repeat them daily:",
  "forms.item1.left": "sein → ich bin, du bist, er/sie/es ist",
  "forms.item1.right": "States",
  "forms.item2.left": "haben → ich habe, du hast, er/sie/es hat",
  "forms.item2.right": "Possession",
  "forms.item3.left": "werden → ich werde, du wirst, er/sie/es wird",
  "forms.item3.right": "Plans",
  "forms.item4.left": "gehen → ich gehe, du gehst, er/sie/es geht",
  "forms.item4.right": "Movement",
  "forms.item5.left": "sehen → ich sehe, du siehst, er/sie/es sieht",
  "forms.item5.right": "Perception",
  "contexts.title": "When do you need them?",
  "contexts.subtitle": "Common everyday lines",
  "contexts.item1.left": "Ich bin wieder gesund.",
  "contexts.item1.right": "Status",
  "contexts.item2.left": "Du hast später Zeit.",
  "contexts.item2.right": "Availability",
  "contexts.item3.left": "Wir werden bald Eltern.",
  "contexts.item3.right": "Change",
  "contexts.item4.left": "Geht ihr heute zu Fuß?",
  "contexts.item4.right": "Question",
  "contexts.item5.left": "Er sieht die Sonne aufgehen.",
  "contexts.item5.right": "Perception",
  "examples.title": "Mini study plan",
  "examples.subtitle": "Review smarter",
  "examples.item1.left": "Rewrite the verb charts every day.",
  "examples.item2.left": "Highlight stem changes with colors.",
  "examples.item3.left": "Say every form slowly and clearly.",
  "practice.q1.prompt": "Wir ___ sehr müde.",
  "practice.q1.instruction": "Choose the correct verb form.",
  "practice.q1.option1": "sind",
  "practice.q1.option2": "seid",
  "practice.q1.option3": "bin",
  "practice.q2.prompt": "Ich ___ ein neues Fahrrad.",
  "practice.q2.instruction": "Click the matching form.",
  "practice.q2.option1": "habe",
  "practice.q2.option2": "hast",
  "practice.q2.option3": "hat",
  "practice.q3.prompt": "Du ___ jeden Morgen früh los.",
  "practice.q3.instruction": "Tap the correct answer.",
  "practice.q3.option1": "gehst",
  "practice.q3.option2": "gehe",
  "practice.q3.option3": "geht",
  "practice.q4.prompt": "Sie ___ morgen 30.",
  "practice.q4.instruction": "Which verb fits?",
  "practice.q4.option1": "wird",
  "practice.q4.option2": "werde",
  "practice.q4.option3": "werden",
  "practice.drag1.prompt": "Arrange the words into a sentence.",
  "practice.drag1.instruction": "Drag and drop.",
  "practice.drag1.word1": "Wir",
  "practice.drag1.word2": "sehen",
  "practice.drag1.word3": "heute",
  "practice.drag1.word4": "einen",
  "practice.drag1.word5": "Film",
  "practice.drag1.answer": "Wir sehen heute einen Film",
  "practice.q5.prompt": "Er ___ sehr freundlich.",
  "practice.q5.instruction": "Pick the form of \"sein\".",
  "practice.q5.option1": "ist",
  "practice.q5.option2": "bist",
  "practice.q5.option3": "sind",
  "practice.q6.prompt": "___ du morgen Zeit?",
  "practice.q6.instruction": "Choose the form of \"haben\".",
  "practice.q6.option1": "Hast",
  "practice.q6.option2": "Hat",
  "practice.q6.option3": "Haben",
  "practice.q7.prompt": "Wir ___ heute ins Theater.",
  "practice.q7.instruction": "Which form of \"gehen\" works?",
  "practice.q7.option1": "gehen",
  "practice.q7.option2": "gehst",
  "practice.q7.option3": "geht",
  "practice.q8.prompt": "Ich ___ dich später im Café.",
  "practice.q8.instruction": "Select the form of \"sehen\".",
  "practice.q8.option1": "sehe",
  "practice.q8.option2": "siehst",
  "practice.q8.option3": "sehen",
  "tips.title": "Memory tips for irregular verbs",
  "tips.intro": "Use these quick strategies:",
  "tips.item1.left": "Mark the stem change.",
  "tips.item1.right": "Write du and er forms next to each other.",
  "tips.item2.left": "Create mini tables.",
  "tips.item2.right": "Flashcards with ich/du/er.",
  "tips.item3.left": "Speak out loud.",
  "tips.item3.right": "Pair the form with a gesture.",
  "tips.outro": "Repeat briefly every day—three minutes are enough!",
};

const languages = [
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
  "ko",
  "ja",
  "nl",
  "zh",
  "hr",
  "hy",
];

const skipKeys = new Set([
  "forms.item1.left",
  "forms.item2.left",
  "forms.item3.left",
  "forms.item4.left",
  "forms.item5.left",
  "contexts.item1.left",
  "contexts.item2.left",
  "contexts.item3.left",
  "contexts.item4.left",
  "contexts.item5.left",
  "practice.q1.prompt",
  "practice.q2.prompt",
  "practice.q3.prompt",
  "practice.q4.prompt",
  "practice.q5.prompt",
  "practice.q6.prompt",
  "practice.q7.prompt",
  "practice.q8.prompt",
  "practice.q1.option1",
  "practice.q1.option2",
  "practice.q1.option3",
  "practice.q2.option1",
  "practice.q2.option2",
  "practice.q2.option3",
  "practice.q3.option1",
  "practice.q3.option2",
  "practice.q3.option3",
  "practice.q4.option1",
  "practice.q4.option2",
  "practice.q4.option3",
  "practice.q5.option1",
  "practice.q5.option2",
  "practice.q5.option3",
  "practice.q6.option1",
  "practice.q6.option2",
  "practice.q6.option3",
  "practice.q7.option1",
  "practice.q7.option2",
  "practice.q7.option3",
  "practice.q8.option1",
  "practice.q8.option2",
  "practice.q8.option3",
  "practice.drag1.word1",
  "practice.drag1.word2",
  "practice.drag1.word3",
  "practice.drag1.word4",
  "practice.drag1.word5",
  "practice.drag1.answer",
]);

const translate = (text, target) => {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "en",
    tl: target,
    dt: "t",
    q: text,
  });
  const url = `https://translate.googleapis.com/translate_a/single?${params.toString()}`;
  const response = execFileSync("curl", ["-s", url], { encoding: "utf8" });
  const data = JSON.parse(response);
  const chunks = data?.[0];
  if (!chunks) return text;
  return chunks.map((chunk) => chunk?.[0] ?? "").join("");
};

const run = async () => {
  const output = {};
  for (const lang of languages) {
    const entries = {};
    for (const [key, value] of Object.entries(english)) {
      if (skipKeys.has(key) || !value) {
        entries[key] = value;
        continue;
      }
      const translated = translate(value, lang);
      entries[key] = translated;
    }
    output[lang] = entries;
    console.error(`Translated ${lang}`);
  }
  fs.writeFileSync(
    "./Lingo/i18n/A1-9-translations.generated.json",
    JSON.stringify(output, null, 2),
    "utf8"
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
