const express = require("express");
const uuid = require("uuid");
const path = require("path");
const {
  readJsonFile,
  saveJson,
  readUsersJson,
  userError,
  saveUserJson,
} = require("../helper");
const { adminUser } = require("../constants");
const vision = require("@google-cloud/vision");

const CREDANTIOLS = JSON.parse(
  JSON.stringify({
    type: "service_account",
    project_id: "test-image-api-358416",
    private_key_id: "502315b893ea2b62e7ec67991ad062f01f08aedd",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6NEp3X+mRRHkF\nm0gdXeK2489LzR/AqqwnWSvXFuxHZqtvL4dp3lABvcUq3setKldGuQwvmvY+EIBt\nD9AGLzNJjjOHJnGaeLtnPQaFmw+Wv+2OB1aBr6T9316u58HDE5e9Yoamw8TcoDyJ\n+KMwvjZvvPRIjnhCcY01v52y2FNgF0OBF7MjTa6WrpKxUFxZeQHLhgcKG+AXNwQX\nz+VK24om14NmCegBT50h0DqA8LMNeyChZU/GkGxyzON3dL5bk2mf6ea/RaG5sHW/\nUE+kW3H+jS9nDjKdSSWi9xOEZinkQgnUWW8WgchtvmCgkUBrDetPJbLbhQQy5gYZ\nHptyPrDPAgMBAAECggEAMf4TFizSnVV4dqhjurq3wWm1gMEAau6HzQK0cgmuA1eN\n5IqqvSJacbU9KA7rJlNtXkgVfPyKa0xr5pwtulNW3kNHE1yfeJ08l3G7fAiPLWa3\nRYAz2hrJ3f1oQuZnT9RFU6wNwd1iz+dXiaWPTulq3SIqpgZWRGSPSKR7Fwbcj7oJ\net90m/5KKV9ir56ia7gdEFFjpTUwou8WT+YHFIVRSCA/FOR+5Dff6NIcYRczIMbB\nVNssnQh0e2YDWCyiNN+WuPPd9Njg9WOQh90R8gfh0HfnCoMEaj5dC9EUo9KSipyE\nfi1lJkO9uVXBs0HzLMc4+ObagZBMNNaO9wEEyRjt7QKBgQDwASQkmPn7byxTIelx\nEET8d/5rwvYI3qNfmxn/5HIx7aBIqCG/ksA5ZYDpQ+YOjms5cUQl0x7ZxBg0824p\nt/rcViVfIaXYUh2kf2wqIak/ZhGeYXpyL7ruktEIEXntbGEixPdDO1trH/vJ9HYJ\n+1LZdEtCSO5dVNpkKLQRTI/x1QKBgQDGnTuIJY+THzjrajlmwnhW8N17zKOOHA6d\nqBHEZQBwz/ssupxAMeEAVw33gOP3uakebfpectmKiXtXAcoBwfweJ1fR0/QDxaBV\nsRbu5hOkmuqgomFJ9vukej8iqd1auHnbRb2m2jpCuKc2ukDQ4x1NWDu7PXxmtBqE\n7VqTMfHGEwKBgEv0wICInYzSiV+h+uRadsrEGxP1trHl7CSEzLysiut8Pd7gvxWH\nFyjTE/I/F98BebPLQfsKjtfydIrFg9bWMCFtbhRmbLtCebkmzo+i6ZJz9h1+0iaz\nLmD0vAzmowTd6Pv9BBgV//+uNpyaroTIMlc5s9u9gxqskRVjwGE9Ls0lAoGAR+/B\nFTHNi9L+Mb4apk5/ebXp8qIPBzTAUngCX2jZvQKHjg7U8yddwFrHk0KazynuyDe7\nPCRLCLN8+emK+hIBuAY196jWM9uLlB39GXA54x+9JYtKw5hyUoN4hJyTsP0qHbJn\n25wlB++LmPXi7gWkolP35nyBp01KYaT6bl/jmwMCgYEAvIjL4PwsIJU6sIOtuiGQ\nlZVDAY7K/RMxVEvo8QchBHMLVY2rbg1nGdLLbZn6WDemoxnA2JCDTqFxhl2Ue3UI\nx25icZh8TzCV4TNrJUvpOh2Ltp92rltc0zfNy1VKcBsWAscJXwADH0OjpIxfxXNp\nHXEstkbo1eo+pVTRq61iW5o=\n-----END PRIVATE KEY-----\n",
    client_email: "textdetection@test-image-api-358416.iam.gserviceaccount.com",
    client_id: "115006785167494947450",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/textdetection%40test-image-api-358416.iam.gserviceaccount.com",
  })
);
const CONFIG = {
  credentials: {
    private_key: CREDANTIOLS.private_key,
    client_email: CREDANTIOLS.client_email,
  },
};

const client = new vision.ImageAnnotatorClient(CONFIG);

const adminRoutes = express.Router();

adminRoutes.post("/get-data-array", async (req, res) => {
  const filePath = req.files.file.tempFilePath;
  try {
    const all = await client.textDetection(filePath);
    const foolText = all[0].fullTextAnnotation.text.split("\n");
    const lang =
      all[0].fullTextAnnotation.pages[0].property.detectedLanguages[0]
        .languageCode;
    const formatedData = {
      cardNumber: foolText[0],
      field1: "",
      field2: "",
      field3: "",
      field4: "",
      field5: "",
      field6: "",
      field7: "",
      field8: "",
      category: foolText[foolText.length - 2],
      imageName: "",
    };
    let counter = 1;
    foolText.forEach((item, index) => {
      if (index !== 0 && index !== foolText.length - 2 && counter <= 6) {
        formatedData["field" + counter] = item;
        counter += 1;
      }
    });
    res.send({ row: formatedData, lang: lang !== "de" ? "ua" : lang });
  } catch (error) {
    console.log(error);
    res.status(400);
    res.send({
      status: "error",
      error: "main Error > GOOGLE API",
    });
    return;
  }
});

adminRoutes.use("/", (req, res, next) => {
  const { adminKey } = req.query;
  if (adminUser.key === adminKey) {
    next();
  } else {
    console.log("YOU are not ADMIN");
    userError(res, "YOU are not ADMIN");
  }
});

adminRoutes.get("/users", (req, res) => {
  const users = readUsersJson();
  if (users) {
    res.json(users);
  } else {
    userError(res, "can't find user List");
  }
});

adminRoutes.post("/create-user", (req, res) => {
  const item = req.body.body;
  const newUser = {
    ...item,
    key: uuid.v4(),
  };
  const users = readUsersJson();
  if (users) {
    const newUsers = [...users, newUser];
    saveUserJson(newUsers);
    res.json(newUsers);
  } else {
    userError(res, "can't find user List");
  }
});

adminRoutes.delete("/delete-user", (req, res) => {
  const { deleteUser } = req.query;
  const users = readUsersJson();
  if (users) {
    const filteredPeople = users.filter((item) => item.key !== deleteUser);
    saveUserJson(filteredPeople);
    res.json(filteredPeople);
  } else {
    userError(res, "can't find user List");
  }
});

adminRoutes.delete("/delete-item", (req, res) => {
  const { deleteItemKey, language, laval } = req.query;
  const data = readJsonFile(laval, language);
  if (data) {
    delete data[deleteItemKey];
    saveJson(laval, language, data);
    res.send("ok");
  } else {
    userError(res, "can't find user List");
  }
});

adminRoutes.get("/download", (req, res) => {
  const { language, laval } = req.query;
  const filePhat = path.join(__dirname, `../json_db/${laval}_${language}.json`);
  if (filePhat) {
    res.download(filePhat);
  } else {
    userError(res, "can't find file");
  }
});

adminRoutes.get("/getAll", (req, res) => {
  const { targetLanguage, level } = req.query;
  try {
    const DeData = readJsonFile(level, "de");
    const DeDataKeys = Object.keys(DeData);
    const targetData = readJsonFile(level, targetLanguage);
    
    if (DeDataKeys.length > 0 ) {
      const newArry = []
      DeDataKeys.forEach((key)=>{
        const newData ={ 
          ...DeData[key],
          translation: targetData[key]
        };
        newArry.push(newData)
      })
      res.status(200).json(newArry || {})
    } else {
      userError(res, "can't find word (rout => /word ) ");
    }
  } catch (error) {
    userError(res, "can't find file (rout => /word ) ");
  }
});

module.exports = adminRoutes;
