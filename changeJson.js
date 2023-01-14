const fs = require('fs')

function readJsonFile(laval, language) {
  const data = fs.readFileSync(`./json_db/${laval}_${language}.json`, 'utf8')
  if (!data) {
    return {}
  }
  const obj = JSON.parse(data) || {}
  return obj
}

function saveJson(laval, language, data) {
  fs.writeFileSync(`./json_db/${laval}_${language}.json`, JSON.stringify(data), 'utf8');
}

function updateJson() {
  const laval = ["A1", "A2", "B1", "B2", "C1"];
  const language = ["de", "en", "ru", "ua"];
  laval.forEach(lavalItem => {
    language.forEach(lang => {
        const data = readJsonFile(lavalItem, lang);
        let newData = {};
        for (let key in data) {
          const item = data[key];
          const  {category,imageName, ...rest } = item;
          const newItem = {...rest, field7:"", field8:"",category,imageName };
          newData[key] = newItem; 
        }
        saveJson(lavalItem, lang, newData);
    })
  })
  t = false;
}

function addImageName (){
  const data = readJsonFile("B1", "ua");
  let newData = {};
  for (let key in data) {
    const item = data[key];
    item.imageName = "";
    const newItem = {...item, imageName: "" };
    newData[key] = newItem; 
  }
  saveJson("B1", "ua", newData);
}

addImageName()

//************* changes all JSON files be careful */ 
//  updateJson();
