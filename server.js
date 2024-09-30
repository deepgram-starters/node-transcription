const { createClient } = require("@deepgram/sdk");
const config = require("./config.json");
const express = require("express");
const multer = require("multer");
const path = require("path");

const port = process.env.API_PORT || 8080;
const deepgram = createClient(config.dgKey, {
  global: { url: "api.beta.deepgram.com" },
});
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();

app.use(express.static(path.join(__dirname, "static")));

const transcribeFile = async (source, options) => {
  return await deepgram.listen.prerecorded.transcribeFile(source, options);
};

const transcribeUrl = async (source, options) => {
  return await deepgram.listen.prerecorded.transcribeUrl(source, options);
};

app.post("/api", upload.single("file"), async (req, res) => {
  const { body, file } = req;
  const { url, features, model, version, tier } = body;
  const dgFeatures = JSON.parse(features);
  let dgRequest;

  try {
    // validate the URL for a URL request

    if (!url && !file) {
      throw Error(
        "Error: You need to choose a file to transcribe your own audio."
      );
    }

    let transcription;

    if (url) {
      dgRequest = { url };
      const { result: transcriptionResult, error: transcriptionError } =
        await transcribeUrl(dgRequest, {
          ...dgFeatures,
          model,
          tier,
          ...(version ? { version } : null),
          ...(model === "whisper" ? null : { tier }),
        });

      if (transcriptionError) {
        throw Error(transcriptionError.message);
      }

      transcription = transcriptionResult;
    }

    if (file) {
      const { mimetype, buffer } = file;
      dgRequest = { buffer, mimetype };
      const { result: transcriptionResult, error: transcriptionError } =
        await transcribeFile(dgRequest, {
          ...dgFeatures,
          model,
          tier,
          ...(version ? { version } : null),
          ...(model === "whisper" ? null : { tier }),
        });

      if (transcriptionError) {
        throw Error(transcriptionError.message);
      }

      transcription = transcriptionResult;
    }

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

app.listen(port, () =>
  console.log(`Starter app running at http://localhost:${port}`)
);
