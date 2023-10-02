const axios = require("axios");
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = "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"; // Replace with your API Key

const migrate = function async(word) {
  // const prompt = `I will provide german words write the plural of that word: ${word}`;
  const newPrompt =
    "I will provide german words write the plural of that with die article word then comma and 3 wrong plurals and nothing else, if the word doesn’t have a plural or I provided something false write just -";
  return new Promise((resolve, reject) => {
    axios
      .post(
        OPENAI_API_URL,
        {
          model: "gpt-4",
          messages: [
            { role: "user", content: word },
            { role: "system", content: newPrompt },
          ],
          max_tokens: 50,
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        console.log("RES =>>>>>>>", res.data.choices[0].message.content);
        const pluralResponse = res.data.choices[0].message.content.split(", ");
        // pluralResponse.map(item=>item.trim());
        if (pluralResponse[0] === "-") {
          resolve([]);
        }
        resolve(pluralResponse);
      })
      .catch((e) => {
        console.log(e);
        reject([]);
      });
  });
};

// (async () => {
//   const result = await migrate("das Eis");
//   if (result === "_") {
//     console.log("ERROR");
//   } else {
//     console.log("result => \n", result);
//   }
// })();

const { readJsonFile, saveJsonMigrate } = require("./helper");
const laval = "C1";
const language = "de";

const testDuplicate = () => {
  const data = readJsonFile(laval, language);
  const objKeys = Object.keys(data);

  const checkIfDuplicateExists = (arr) => {
    return new Set(arr).size !== arr.length;
  };
  for (let i = 0; i <= objKeys.length - 1; i += 1) {
    const item = data[objKeys[i]];
    const plurals = item.plurals;
    if (plurals && !Array.isArray(plurals)) {
         console.log(objKeys[i]);
      
      // if (checkIfDuplicateExists(plurals)) {
      //   console.log(objKeys[i]);
      // }
    }
  }
};

// testDuplicate();

const migrateJson = async () => {
  const data = readJsonFile(laval, language);
  const objKeys = Object.keys(data);
  for (let i = 0; i <= objKeys.length - 1; i += 1) {
    const item = data[objKeys[i]];
    // console.log(item);
    const article = item.field1?.split(" ")[0];
    if (article === "der" || article === "die" || article === "das") {
      const result = await migrate(item.field1);
      if (result?.length > 0) {
        data[objKeys[i]].plurals = result;
      }
    }
  }
  saveJsonMigrate(laval, language, data);
};

// const test = (field, index) =>
//   new Promise((res, rej) => {
//     setTimeout(() => {
//       res(field + " => " + index);
//     }, 1);
//   });
// migrateJson();
