const mongoose = require("mongoose");

const uri =
  "mongodb+srv://karenkarapetyan286:oxZMsRlNmfOskuqn@words.ll1seyz.mongodb.net/words?retryWrites=true&w=majority";

function connectMongo() {
  const connectionsParam = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  mongoose
    .connect(uri, connectionsParam)
    .then((result) => {
      console.log("Connected to mongo db");
    })
    .catch((error) => {
      console.log(error);
    });
}

module.exports = connectMongo;
