const  swaggerJsdoc = require("swagger-jsdoc");
const  swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LogRocket Express API with Swagger",
      version: "0.1.0",
      description:
        "This is a simple CRUD API application made with Express and documented with Swagger",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "Tiko",
        url: "",
        email: "tiko8428@email.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./router/*.js", "./mongoDB/schema.js"],
};

const specs = swaggerJsdoc(options);

function swaggerConfig (app){
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
  app.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
}


module.exports = swaggerConfig;
