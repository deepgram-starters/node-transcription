const express = require("express");
const { join } = require("path");
const app = express();

const port = process.env.SERVER_PORT || 8081;

app.use(express.static(join(__dirname, "static")));
app.listen(port, () => console.log(`Server listening on port ${port}`));
