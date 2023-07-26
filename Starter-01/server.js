const express = require("express");
const { join } = require("path");
const app = express();

const port = process.env.SERVER_PORT || 8080;

app.use(express.static(join(__dirname, "build")));
app.listen(port, () => console.log(`Server listening on port ${port}`));
