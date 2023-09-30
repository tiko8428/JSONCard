const fs = require('fs')


function readUsersJson() {
  const data = fs.readFileSync(`./users.json`, 'utf8')
  if (!data) {
    return {}
  }
  const obj = JSON.parse(data) || {}
  return obj
}

function saveUserJson(data) {
  fs.writeFileSync("./users.json", JSON.stringify(data), 'utf8');  
}


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

function saveJsonMigrate(laval, language, data) {
  fs.writeFileSync(`./json_test/${laval}_${language}.json`, JSON.stringify(data), 'utf8');
}

const userError = (res, msg) => {
  res.status(404);
  res.send({ error: msg })
}

module.exports = {
  readUsersJson,
  saveUserJson,
  readJsonFile,
  saveJson,
  userError,
  saveJsonMigrate
}