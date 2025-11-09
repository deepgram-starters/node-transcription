require("dotenv").config();

const { createClient } = require("@deepgram/sdk");
const { createProxyMiddleware } = require("http-proxy-middleware");
const express = require("express");
const multer = require("multer");
const path = require("path");

// Load API key from environment or config file
let apiKey = process.env.DEEPGRAM_API_KEY;

if (!apiKey) {
  try {
    const config = require("./config.json");
    apiKey = config.dgKey;
  } catch (err) {
    // config.json doesn't exist or is invalid
  }
}

if (!apiKey) {
  console.error("\n❌ ERROR: Deepgram API key not found!\n");
  console.error("Please set your API key using one of these methods:\n");
  console.error("1. Create a .env file (recommended):");
  console.error("   DEEPGRAM_API_KEY=your_api_key_here\n");
  console.error("2. Environment variable:");
  console.error("   export DEEPGRAM_API_KEY=your_api_key_here\n");
  console.error("3. Create a config.json file:");
  console.error("   cp config.json.example config.json");
  console.error("   # Then edit config.json with your API key\n");
  console.error("Get your API key at: https://console.deepgram.com\n");
  process.exit(1);
}

const port = process.env.PORT || 3000;
const vitePort = process.env.VITE_PORT || 5173;
const isDevelopment = process.env.NODE_ENV === "development";
const deepgram = createClient(apiKey);
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();

// STT Contract Endpoint - implements the /stt/transcribe interface
// IMPORTANT: Register API routes BEFORE the proxy middleware
app.post("/stt/transcribe", upload.single("file"), async (req, res) => {
  try {
    const { body, file } = req;
    const { url, model } = body;

    let dgRequest = null;

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
      return res.status(400).json({
        error: {
          type: "ValidationError",
          code: "MISSING_INPUT",
          message: "Either file or url must be provided",
        },
      });
    }

    // send request to deepgram (v3 SDK)
    let transcriptionResponse;

    if (url) {
      // Transcribe from URL
      transcriptionResponse = await deepgram.listen.prerecorded.transcribeUrl(
        { url },
        { model: model || "nova-3" }
      );
    } else {
      // Transcribe from file buffer
      transcriptionResponse = await deepgram.listen.prerecorded.transcribeFile(
        file.buffer,
        { model: model || "nova-3", mimetype: file.mimetype }
      );
    }

    // Extract and format response according to STT contract
    const transcription = transcriptionResponse.result;
    const result = transcription?.results?.channels?.[0]?.alternatives?.[0];

    if (!result) {
      throw new Error("No transcription results returned");
    }

    const response = {
      transcript: result.transcript || "",
      words: result.words || [],
      metadata: {
        model_uuid: transcription.metadata?.model_uuid,
        request_id: transcription.metadata?.request_id,
        model_name: model || "nova-3",
      },
    };

    // Add duration if available
    if (transcription.metadata?.duration) {
      response.duration = transcription.metadata.duration;
    }

    // return results according to STT contract
    res.json(response);
  } catch (err) {
    console.error("Transcription error:", err);

    // Return error according to STT contract
    res.status(500).json({
      error: {
        type: "TranscriptionError",
        code: "TRANSCRIPTION_FAILED",
        message: err.message || "An error occurred during transcription",
        details: {
          originalError: err.toString(),
        },
      },
    });
  }
});

// Serve frontend - proxy in development, static files in production
// IMPORTANT: This must be registered AFTER API routes
if (isDevelopment) {
  // Development: Proxy to Vite dev server
  app.use(
    "/",
    createProxyMiddleware({
      target: `http://localhost:${vitePort}`,
      changeOrigin: true,
      ws: true, // proxy websockets for HMR
    })
  );
} else {
  // Production: Serve static files from frontend/dist
  app.use(express.static(path.join(__dirname, "frontend", "dist")));
  
  // Catch-all route for SPA
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
  });
}

app.listen(port, () => {
  console.log(`\n🚀 STT Backend Server running at http://localhost:${port}`);
  if (isDevelopment) {
    console.log(
      `📡 Proxying frontend from Vite dev server on port ${vitePort}\n`
    );
  } else {
    console.log(`📦 Serving built frontend from frontend/dist\n`);
  }
});
