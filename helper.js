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
  fs.writeFileSync("./users.json", JSON.stringify(data), 'utf8', err => {
    if (err) {
      console.log(`Error writing file: ${err}`)
    } else {
      console.log(`File is written successfully!`)
    }
  })
}


function readJsonFile(leng) {
  const data = fs.readFileSync(`./src/json/data/${leng}.json`, 'utf8')
  if (!data) {
    return {}
  }
  const obj = JSON.parse(data) || {}
  return obj
}

function saveJson(lang, data) {
  fs.writeFileSync(`./src/json/data/${lang}.json`, JSON.stringify(data), 'utf8', err => {
    if (err) {
      console.log(`Error writing file: ${err}`)
    } else {
      console.log(`File is written successfully!`)
    }
  })
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
}