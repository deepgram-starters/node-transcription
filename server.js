const { Deepgram } = require("@deepgram/sdk");
const config = require("./config.json");
const express = require("express");
const multer = require("multer");
const path = require("path");

const port = process.env.API_PORT || 8080;
const deepgram = new Deepgram(config.dgKey, "api.deepgram.com");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();

app.use(express.static(path.join(__dirname, "static")));
app.use(express.json()); // Enable JSON body parsing for /stt/transcribe endpoint

app.post("/api", upload.single("file"), async (req, res) => {
  const { body, file } = req;
  const { url, features, model, version, tier } = body;
  const dgFeatures = JSON.parse(features);

  let dgRequest = null;

  try {
    // validate the URL for a URL request
    if (url) {
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
      tier,
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

// STT Interface Compliant Endpoint (implements minimal starter-contracts specification)
// Minimal URL-based approach: accepts JSON with audio URL
app.post("/stt/transcribe", async (req, res) => {
  try {
    // Echo X-Request-Id header if provided
    const requestId = req.headers['x-request-id'];
    if (requestId) {
      res.setHeader('X-Request-Id', requestId);
    }

    // Validate request body exists and has url
    if (!req.body || !req.body.url) {
      return res.status(400).json({
        error: {
          type: "validation_error",
          code: "INVALID_URL",
          message: "Request body must contain 'url' field",
          details: {}
        }
      });
    }

    // Validate URL format
    const { url } = req.body;
    try {
      new URL(url); // Throws if invalid URL format
    } catch (urlError) {
      return res.status(400).json({
        error: {
          type: "validation_error",
          code: "INVALID_URL",
          message: "Provided URL is not valid",
          details: { url }
        }
      });
    }

    // Extract only the model query parameter (minimal contract supports only this)
    const { model } = req.query;

    // Prepare request for Deepgram (URL-based)
    const dgRequest = { url };

    // Send to Deepgram
    const transcription = await deepgram.transcription.preRecorded(dgRequest, {
      model: model || "nova-2"
    });

    // Transform Deepgram response to our standard format
    const standardResponse = transformDeepgramResponse(transcription, { model });

    res.json(standardResponse);

  } catch (err) {
    console.error('STT Transcribe Error:', err);

    // Echo X-Request-Id even in errors
    const requestId = req.headers['x-request-id'];
    if (requestId) {
      res.setHeader('X-Request-Id', requestId);
    }

    // Determine appropriate error code
    let errorCode = "BAD_AUDIO";
    let statusCode = 500;

    if (err.message && err.message.includes('URL')) {
      errorCode = "INVALID_URL";
      statusCode = 400;
    } else if (err.message && err.message.includes('model')) {
      errorCode = "MODEL_NOT_FOUND";
      statusCode = 400;
    }

    res.status(statusCode).json({
      error: {
        type: "processing_error",
        code: errorCode,
        message: err.message || "Audio processing failed",
        details: {}
      }
    });
  }
});

// Helper function to transform Deepgram response to our standard format
function transformDeepgramResponse(transcription, features) {
  const channel = transcription?.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];

  if (!alternative) {
    throw new Error("No transcription results found");
  }

  const response = {
    transcript: alternative.transcript || "",
  };

  // Add word-level timing if available
  if (alternative.words && alternative.words.length > 0) {
    response.words = alternative.words.map(word => ({
      text: word.word,
      start: word.start,
      end: word.end,
      // Include speaker as string if present (Deepgram returns numbers, convert to string)
      ...(word.speaker !== undefined && { speaker: String(word.speaker) })
    }));
  }

  // Add duration from metadata
  if (transcription?.results?.channels?.[0]?.alternatives?.[0]?.words?.length > 0) {
    const words = transcription.results.channels[0].alternatives[0].words;
    const lastWord = words[words.length - 1];
    if (lastWord?.end) {
      response.duration = lastWord.end;
    }
  }

  // Add metadata (schema allows additionalProperties: true)
  // Only include metadata if there's something to add
  const metadata = {};

  if (transcription.metadata?.model_info) {
    metadata.model_info = transcription.metadata.model_info;
  }
  if (transcription.metadata?.channels) {
    metadata.channels = transcription.metadata.channels;
  }
  if (features.model) {
    metadata.model = features.model;
  }
  if (transcription.metadata?.request_id) {
    metadata.request_id = transcription.metadata.request_id;
  }

  // Only add metadata field if it has content
  if (Object.keys(metadata).length > 0) {
    response.metadata = metadata;
  }

  return response;
}

app.listen(port, () =>
  console.log(`Starter app running at http://localhost:${port}`)
);
