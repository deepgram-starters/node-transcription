const { Deepgram } = require("@deepgram/sdk");
const config = require("./src/config.json");
const cors = require("cors");
const express = require("express");
const multer = require("multer");

const appPort = process.env.SERVER_PORT || 3000;
const port = process.env.API_PORT || 3001;
const appOrigin = config.appOrigin || `http://localhost:${appPort}`;

// Paid Accounts can use api.beta.deepgram.com
// const deepgram = new Deepgram(config.dgKey, "api.beta.deepgram.com");

// Free Accounts can only use api.deepgram.com
const deepgram = new Deepgram(config.dgKey, "api.deepgram.com");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { createServer } = require("http");
const { Server } = require("socket.io");

require('dotenv/config');

const app = express();

const httpServer = createServer(app);

let dgLiveObj;
let io;
let globalSocket;

app.use(cors({ origin: appOrigin }));

app.post("/api", upload.single("file"), async (req, res) => {
  const { body, file } = req;
  const { url, features, model, version, tier } = body;
  const dgFeatures = JSON.parse(features);

  let dgRequest = null;

  try {
    // validate the URL for a URL request
    if (url && url.startsWith("https://res.cloudinary.com/deepgram")) {
      dgRequest = { url };
    }

    // get file buffer for a file request
    if (file) {
      const { mimetype, buffer } = file;
      dgRequest = { buffer, mimetype };
    }

    if (!dgRequest) {
      throw Error(
        "Error: You need to choose a file to transcribe your own audio."
      );
    }

    // send request to deepgram
    const transcription = await deepgram.transcription.preRecorded(dgRequest, {
      ...dgFeatures,
      model,
      ...(version ? { version } : null),
      ...(model === "whisper" ? null : { tier }),
    });

    // return results
    res.send({ model, version, tier, dgRequest, dgFeatures, transcription });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err, dgRequest, {
      ...dgFeatures,
      version,
      model,
      tier,
    });

    // handle error
    res.status(500).send({ err: err.message ? err.message : err });
  }
});



// Socket Connection logic
const initDgConnection = (disconnect) => {
  dgLiveObj = createNewDeepgramLive(deepgram);
  addDeepgramTranscriptListener(dgLiveObj);
  addDeepgramOpenListener(dgLiveObj);
  addDeepgramCloseListener(dgLiveObj);
  addDeepgramErrorListener(dgLiveObj);
  // clear event listeners
  if (disconnect) {
    globalSocket.removeAllListeners();
  }
  // receive data from client and send to dgLive
  globalSocket.on("packet-sent", async (event) =>
    dgPacketResponse(event, dgLiveObj)
  );
};

const createWebsocket = () => {
  io = new Server(httpServer, { transports: "websocket" });
  io.on("connection", (socket) => {
    console.log(`Connected on server side with ID: ${socket.id}`);
    globalSocket = socket;
    initDgConnection(false);
  });
};

const createNewDeepgramLive = (dg) =>
  dg.transcription.live({
    language: "en",
    punctuate: true,
    smart_format: true,
    model: "nova",
  });

const addDeepgramTranscriptListener = (dg) => {
  dg.addListener("transcriptReceived", async (dgOutput) => {
    let dgJSON = JSON.parse(dgOutput);
    let utterance;
    try {
      utterance = dgJSON.channel.alternatives[0].transcript;
    } catch (error) {
      console.log(
        "WARNING: parsing dgJSON failed. Response from dgLive is:",
        error
      );
    }
    if (utterance) {
      globalSocket.emit("print-transcript", utterance);
    }
  });
};

const addDeepgramOpenListener = (dg) => {
  dg.addListener("open", async (msg) =>
    console.log(`dgLive WEBSOCKET CONNECTION OPEN!`)
  );
};

const addDeepgramCloseListener = (dg) => {
  dg.addListener("close", async (msg) => {
    console.log(`dgLive CONNECTION CLOSED!`);
    console.log(`Reconnecting`);
    createWebsocket();
  });
};

const addDeepgramErrorListener = (dg) => {
  dg.addListener("error", async (msg) => {
    console.log("ERROR MESG", msg);
    console.log(`dgLive ERROR::Type:${msg.type} / Code:${msg.code}`);
  });
};

const dgPacketResponse = (event, dg) => {
  if (dg.getReadyState() === 1) {
    dg.send(event);
  }
};

console.log(`Starting WebSocket Server on Port ${port}`);
httpServer.listen(port);

createWebsocket();