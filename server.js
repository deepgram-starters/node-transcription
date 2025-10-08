const { Deepgram } = require("@deepgram/sdk");
const config = require("./config.json");
const express = require("express");
const multer = require("multer");
const path = require("path");

const port = process.env.API_PORT || 8080;
const deepgram = new Deepgram(config.dgKey, "api.beta.deepgram.com");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();

// NOTE: Originally planned to use /stt:transcribe but changed to /stt/transcribe for framework compatibility
// The colon syntax caused routing issues in Express and would cause similar problems in other frameworks.
// Standard REST paths (/resource/action) work universally across all web frameworks.

app.use(express.static(path.join(__dirname, "static")));

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

// STT Interface Compliant Endpoint (implements starter-contracts specification)
app.post("/stt/transcribe", express.raw({ type: ['audio/wav', 'audio/mpeg', 'audio/webm'], limit: '50mb' }), async (req, res) => {
  try {
    // Validate content type
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.startsWith('audio/')) {
      return res.status(415).json({
        error: {
          type: "validation_error",
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: `Content-Type '${contentType}' is not supported. Supported types are: audio/wav, audio/mpeg, audio/webm`,
          details: {
            received_content_type: contentType,
            supported_content_types: ["audio/wav", "audio/mpeg", "audio/webm"]
          }
        }
      });
    }

    // Validate body exists
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({
        error: {
          type: "validation_error",
          code: "BAD_AUDIO",
          message: "Request body is empty or invalid",
          details: {}
        }
      });
    }

    // Extract query parameters
    const {
      model = "nova-2",
      language,
      punctuate,
      diarize,
      smart_format,
      sentiment,
      topics,
      intents,
      summarize,
      // ... include other parameters as needed
      ...otherParams
    } = req.query;

    // Build Deepgram features from query params
    const dgFeatures = {
      ...(punctuate === 'true' && { punctuate: true }),
      ...(diarize === 'true' && { diarize: true }),
      ...(smart_format === 'true' && { smart_format: true }),
      ...(sentiment === 'true' && { sentiment: true }),
      ...(topics === 'true' && { topics: true }),
      ...(intents === 'true' && { intents: true }),
      ...(summarize && { summarize: summarize === 'true' ? true : summarize }),
      ...(language && { language }),
      // Include any other parameters passed
      ...Object.fromEntries(
        Object.entries(otherParams).map(([key, value]) => [
          key,
          value === 'true' ? true : value === 'false' ? false : value
        ])
      )
    };

    // Prepare request for Deepgram
    const dgRequest = {
      buffer: req.body,
      mimetype: contentType
    };

    // Send to Deepgram
    const transcription = await deepgram.transcription.preRecorded(dgRequest, {
      ...dgFeatures,
      model: model || "nova-2"
    });

    // Transform Deepgram response to our standard format
    const standardResponse = transformDeepgramResponse(transcription, dgFeatures);

    // Echo X-Request-Id header if provided
    const requestId = req.headers['x-request-id'];
    if (requestId) {
      res.setHeader('X-Request-Id', requestId);
    }

    res.json(standardResponse);

  } catch (err) {
    console.error('STT Transcribe Error:', err);

    // Echo X-Request-Id even in errors
    const requestId = req.headers['x-request-id'];
    if (requestId) {
      res.setHeader('X-Request-Id', requestId);
    }

    res.status(500).json({
      error: {
        type: "processing_error",
        code: "BAD_AUDIO",
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
      ...(word.speaker !== undefined && { speaker: `Speaker ${word.speaker}` })
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

  // Add metadata
  response.metadata = {
    ...(transcription.metadata?.model_info && { model_info: transcription.metadata.model_info }),
    ...(transcription.metadata?.channels && { channels: transcription.metadata.channels }),
    ...(features.model && { model: features.model }),
    ...(transcription.metadata?.request_id && { request_id: transcription.metadata.request_id })
  };

  return response;
}

app.listen(port, () =>
  console.log(`Starter app running at http://localhost:${port}`)
);
