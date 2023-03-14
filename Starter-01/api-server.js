const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const config = require("./src/config.json");

const app = express();

const port = process.env.API_PORT || 3001;
const appPort = process.env.SERVER_PORT || 3000;
const appOrigin = config.appOrigin || `http://localhost:${appPort}`;

app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: appOrigin }));

app.get("/api", (req, res) => {
  var delayInMilliseconds = 1000; //1 second

  setTimeout(function () {
    res.send({
      msg: "test!",
    });
  }, delayInMilliseconds);
});

app.listen(port, () => console.log(`API Server listening on port ${port}`));
