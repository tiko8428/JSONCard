const express = require("express");
const axios = require("axios");
const { readJsonFile, saveJson, readUsersJson, userError } = require("../helper");

const exampleJson = `
 [
     {
         "id": 1,
         "type": "textLesson",
         "title": "Greetings in German",
         "description": "Hallo, Guten Tag, Guten Abend..."
     },
     {
         "id": 2,
         "type": "quiz",
         "question": "What is the meaning of 'Danke'?",
         "options": ["Hello", "Goodbye", "Thank You", "Please"],
         "correctAnswerIndex": 2
     },
     {
         "id": 3,
         "type": "textLesson",
         "title": "Basic Grammar",
         "description": "The verb 'sein' means 'to be'. Examples: Ich bin (I am), Du bist (You are)..."
     },
     {
         "id": 4,
         "type": "quiz",
         "question": "Which article is correct for 'Buch'?",
         "options": ["Der Buch", "Die Buch", "Das Buch"],
         "correctAnswerIndex": 2
     },
     {
         "id": 5,
         "type": "vocabulary",
         "word": "Apfel",
         "translation": "Apple",
         "exampleSentence": "Ich esse einen Apfel. (I am eating an apple.)"
     },
     {
         "id": 6,
         "type": "dialogue",
         "title": "At the Cafe",
         "content": [
             {"speaker": "Customer", "text": "Ich hätte gerne einen Kaffee."},
             {"speaker": "Waiter", "text": "Möchten Sie Milch oder Zucker?"},
             {"speaker": "Customer", "text": "Nur Milch, bitte."}
         ]
     },
     {
         "id": 7,
         "type": "textLesson",
         "title": "Colors in German",
         "description": "Rot (red), Blau (blue), Grün (green), Gelb (yellow)..."
     },
     {
         "id": 8,
         "type": "quiz",
         "question": "What does 'Guten Morgen' mean?",
         "options": ["Good Morning", "Good Night", "Good Afternoon", "Good Evening"],
         "correctAnswerIndex": 0
     },
     {
         "id": 9,
         "type": "vocabulary",
         "word": "Hund",
         "translation": "Dog",
         "exampleSentence": "Der Hund spielt im Garten. (The dog is playing in the garden.)"
     },
     {
         "id": 10,
         "type": "dialogue",
         "title": "At the Train Station",
         "content": [
             {"speaker": "Passenger", "text": "Wann fährt der nächste Zug nach Berlin?"},
             {"speaker": "Clerk", "text": "Der nächste Zug fährt um 10:30 Uhr."},
             {"speaker": "Passenger", "text": "Danke schön!"},
             {"speaker": "Clerk", "text": "Gern geschehen!"}
         ]
     },
]`;

const grokRequest = async ({ learningFromLanguage, limit }) => {

  const prompt = `
  Generate a JSON object with ${limit} feed items designed for teaching German.
  The content should be tailored to a user whose learning language is identified by the 
  language code ${learningFromLanguage}. Each item should include:
  - id: Unique identifier (integer)
  - type: One of textLesson, quiz, vocabulary, or dialogue
  - title (optional for some types): A title for the item
  - description (optional for some types): A description or explanation for text lessons
  - question (optional for quizzes): A quiz question to test understanding
  - options (optional for quizzes): An array of multiple-choice answers
  - correctAnswerIndex (optional for quizzes): Index of the correct answer in the options array
  - word (optional for vocabulary): A German vocabulary word
  - translation (optional for vocabulary): The word's translation in the users learning language
  - exampleSentence (optional for vocabulary): A sentence using the word in German with its translation in the users learning language
  - content (optional for dialogues): Array of dialogue lines, where each line includes a speaker and text
  Here is an example JSON for reference:
  ${exampleJson}
  Ensure the items are suitable for learning German and include translations or context in the language identified by the language code ${learningFromLanguage}.

  Use the example JSON as a reference to generate the feed items but in every request be creative and return different content.`;

  const XAI_API_KEY = process.env.XAI_API_KEY;
  // console.log(prompt);
  // return {"test": prompt};
  if (!XAI_API_KEY) {
    return "no api kee";
  }
  try {
    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        // prompt,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates JSON data for teaching German to users in various learning languages"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        model: "grok-2-latest"
      },
      {
        headers: {
          "Authorization": `Bearer ${XAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const stringData = response.data.choices[0].message.content

    let cleanResponse = stringData.trim().replace(/^```json/, "").replace(/```$/, "");
    cleanedString = cleanResponse.replace(/\n/g, "");
    const jsonObject = JSON.parse(cleanedString);
    // console.log(jsonObject);
    return jsonObject;

  } catch (error) {
    console.log("eeeeeeeeeeeeeee", error)
    return error.message;
  }
}



const feedRouter = express.Router();

feedRouter.post("/grok", (req, res) => {
  // check login
  const {
    firebaseUserId,
    learningLanguage,
    deviceLanguage,
    learningFromLanguage,
    limit,
    page,
  } = req.body || {};

  grokRequest({ learningFromLanguage, limit }).then((data) => {
    res.json(data);
  });

});

feedRouter.post("feed-json/", (req, res) => {
  const {
    firebaseUserId,
    learningLanguage,
    deviceLanguage,
    learningFromLanguage,
    limit,
    page,
  } = req.body.body;

});



module.exports = feedRouter;

// userRouter.get("/jsonData", (req, res) => {
//   const { laval, language } = req.query
//   const currentJSonData = readJsonFile(laval, language);
//   setTimeout(() => {
//     res.json(JSON.stringify(currentJSonData));
//   }, 0)
// })

// userRouter.post("/create-item", (req, res) => {
//   const { laval, language, data } = req.body.body
//   const currentJSonData = readJsonFile(laval, language);
//   if (!currentJSonData) {
//     userError(res, "json save error");
//     return
//   }
//   const newData = { ...currentJSonData, [data.cardNumber]: data }
//   saveJson(laval, language, newData);
//   res.send("ok");
// })

// userRouter.get("/by-card-number", (req, res) => {
//   const { laval, language, cardNumber } = req.query;
//   const currentJSonData = readJsonFile(laval, language);
//   const currentRow = currentJSonData[cardNumber];
//   if (currentRow) {
//     res.json(JSON.stringify(currentRow))
//   } else {
//     res.json(JSON.stringify({}))
//   }
// })

// userRouter.put("/translate", (req, res)=>{
//   const { laval, language, values } = req.body.body;
//   const currentJSonData = readJsonFile(laval, language);
//   currentJSonData[values.cardNumber] = values;
//   saveJson(laval, language, currentJSonData);
//   res.send("ok")  
// })

// userRouter.put("/edit", (req, res)=>{
//   const { laval, language, values, originCardNumber } = req.body.body;
//   const currentJSonData = readJsonFile(laval, language);
//   delete currentJSonData[originCardNumber];

//   currentJSonData[values.cardNumber] = values;
//   saveJson(laval, language, currentJSonData);
//   res.send("ok") 
// })


