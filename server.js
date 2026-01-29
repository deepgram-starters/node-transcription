/**
 * Node Transcription Starter - Backend Server
 *
 * This is a simple Express server that provides a transcription API endpoint
 * powered by Deepgram's Speech-to-Text service. It's designed to be easily
 * modified and extended for your own projects.
 *
 * Key Features:
 * - Single API endpoint: POST /stt/transcribe
 * - Accepts both file uploads and URLs
 * - Proxies to Vite dev server in development
 * - Serves static frontend in production
 */

require("dotenv").config();

const { createClient } = require("@deepgram/sdk");
const { createProxyMiddleware } = require("http-proxy-middleware");
const express = require("express");
const multer = require("multer");
const path = require("path");

// ============================================================================
// CONFIGURATION - Customize these values for your needs
// ============================================================================

/**
 * Default transcription model to use when none is specified
 * Options: "nova-3", "nova-2", "nova", "enhanced", "base"
 * See: https://developers.deepgram.com/docs/models-languages-overview
 */
const DEFAULT_MODEL = "nova-3";

/**
 * Server configuration - These can be overridden via environment variables
 */
const CONFIG = {
  port: process.env.PORT || 8080,
  host: process.env.HOST || "0.0.0.0",
  vitePort: process.env.VITE_PORT || 8081,
  isDevelopment: process.env.NODE_ENV === "development",
};

// ============================================================================
// API KEY LOADING - Load Deepgram API key from .env or config.json
// ============================================================================

/**
 * Loads the Deepgram API key from environment variables or config.json
 * Priority: DEEPGRAM_API_KEY env var > config.json > error
 */
function loadApiKey() {
  // Try environment variable first (recommended)
  let apiKey = process.env.DEEPGRAM_API_KEY;

  // Fall back to config.json if it exists
  if (!apiKey) {
    try {
      const config = require("./config.json");
      apiKey = config.dgKey;
    } catch (err) {
      // config.json doesn't exist or is invalid - that's ok
    }
  }

  // Exit with helpful error if no API key found
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

  return apiKey;
}

const apiKey = loadApiKey();

// ============================================================================
// SETUP - Initialize Express, Deepgram, and middleware
// ============================================================================

// Initialize Deepgram client
const deepgram = createClient(apiKey);

// Configure Multer for file uploads (stores files in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Express app
const app = express();

// ============================================================================
// HELPER FUNCTIONS - Modular logic for easier understanding and testing
// ============================================================================

/**
 * Validates that either a file or URL was provided in the request
 * @param {Object} file - Multer file object
 * @param {string} url - URL string from request body
 * @returns {Object|null} - Request object for Deepgram, or null if invalid
 */
function validateTranscriptionInput(file, url) {
  // URL-based transcription
  if (url) {
    return { url };
  }

  // File-based transcription
  if (file) {
    return { buffer: file.buffer, mimetype: file.mimetype };
  }

  // Neither provided
  return null;
}

/**
 * Sends a transcription request to Deepgram
 * @param {Object} dgRequest - Request object with url OR buffer+mimetype
 * @param {string} model - Model name to use (e.g., "nova-3")
 * @returns {Promise<Object>} - Deepgram API response
 */
async function transcribeAudio(dgRequest, model = DEFAULT_MODEL) {
  // URL transcription
  if (dgRequest.url) {
    return await deepgram.listen.prerecorded.transcribeUrl(
      { url: dgRequest.url },
      { model }
    );
  }

  // File transcription
  return await deepgram.listen.prerecorded.transcribeFile(dgRequest.buffer, {
    model,
    mimetype: dgRequest.mimetype,
  });
}

/**
 * Formats Deepgram's response into a simplified, consistent structure
 * This is where you'd customize the response format for your application
 *
 * @param {Object} transcriptionResponse - Raw Deepgram API response
 * @param {string} modelName - Name of model used for transcription
 * @returns {Object} - Formatted response object
 */
function formatTranscriptionResponse(transcriptionResponse, modelName) {
  const transcription = transcriptionResponse.result;
  const result = transcription?.results?.channels?.[0]?.alternatives?.[0];

  if (!result) {
    throw new Error("No transcription results returned from Deepgram");
  }

  // Build response object
  const response = {
    transcript: result.transcript || "",
    words: result.words || [],
    metadata: {
      model_uuid: transcription.metadata?.model_uuid,
      request_id: transcription.metadata?.request_id,
      model_name: modelName,
    },
  };

  // Add optional fields if available
  if (transcription.metadata?.duration) {
    response.duration = transcription.metadata.duration;
  }

  return response;
}

/**
 * Formats error responses in a consistent structure
 * @param {Error} error - The error that occurred
 * @param {number} statusCode - HTTP status code to return
 * @returns {Object} - Formatted error response
 */
function formatErrorResponse(error, statusCode = 500) {
  return {
    statusCode,
    body: {
      error: {
        type: statusCode === 400 ? "ValidationError" : "TranscriptionError",
        code: statusCode === 400 ? "MISSING_INPUT" : "TRANSCRIPTION_FAILED",
        message: error.message || "An error occurred during transcription",
        details: {
          originalError: error.toString(),
        },
      },
    },
  };
}

// ============================================================================
// API ROUTES - Define your API endpoints here
// ============================================================================

/**
 * POST /stt/transcribe
 *
 * Main transcription endpoint. Accepts either:
 * - A file upload (multipart/form-data with 'file' field)
 * - A URL to audio file (form data with 'url' field)
 *
 * Optional parameters:
 * - model: Deepgram model to use (default: "nova-3")
 *
 * CUSTOMIZATION TIPS:
 * - Add more Deepgram features like diarization, sentiment, etc. in the
 *   transcribeAudio() function by adding options to the API call
 * - Modify formatTranscriptionResponse() to include/exclude different fields
 * - Add authentication middleware here if you want to protect this endpoint
 */
app.post("/stt/transcribe", upload.single("file"), async (req, res) => {
  try {
    const { body, file } = req;
    const { url, model } = body;

    // Validate input - must have either file or URL
    const dgRequest = validateTranscriptionInput(file, url);
    if (!dgRequest) {
      const errorResponse = formatErrorResponse(
        new Error("Either file or url must be provided"),
        400
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    // Send transcription request to Deepgram
    const transcriptionResponse = await transcribeAudio(
      dgRequest,
      model || DEFAULT_MODEL
    );

    // Format and return response
    const response = formatTranscriptionResponse(
      transcriptionResponse,
      model || DEFAULT_MODEL
    );
    res.json(response);
  } catch (err) {
    console.error("Transcription error:", err);

    // Return formatted error response
    const errorResponse = formatErrorResponse(err);
    res.status(errorResponse.statusCode).json(errorResponse.body);
  }
});

/**
 * GET /api/metadata
 *
 * Returns metadata about this starter application from deepgram.toml
 * Required for standardization compliance
 */
app.get("/api/metadata", (req, res) => {
  try {
    const fs = require("fs");
    const toml = require("toml");
    const tomlPath = path.join(__dirname, "deepgram.toml");
    const tomlContent = fs.readFileSync(tomlPath, "utf-8");
    const config = toml.parse(tomlContent);

    if (!config.meta) {
      return res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "Missing [meta] section in deepgram.toml",
      });
    }

    res.json(config.meta);
  } catch (error) {
    console.error("Error reading metadata:", error);
    res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to read metadata from deepgram.toml",
    });
  }
});

/**
 * ADD YOUR CUSTOM ROUTES HERE
 *
 * Examples:
 * - POST /stt/transcribe-with-diarization
 * - POST /stt/summarize
 * - GET /health (health check endpoint)
 * - POST /webhooks/deepgram (callback endpoint)
 */

// ============================================================================
// FRONTEND SERVING - Development proxy or production static files
// ============================================================================

/**
 * In development: Proxy all requests to Vite dev server for hot reload
 * In production: Serve pre-built static files from frontend/dist
 *
 * IMPORTANT: This MUST come AFTER your API routes to avoid conflicts
 */
if (CONFIG.isDevelopment) {
  console.log(`Development mode: Proxying to Vite dev server on port ${CONFIG.vitePort}`);

  // Proxy all requests (including WebSocket for Vite HMR) to Vite dev server
  // Note: This app has no backend WebSocket connections, so we can proxy all WebSockets to Vite
  app.use(
    "/",
    createProxyMiddleware({
      target: `http://localhost:${CONFIG.vitePort}`,
      changeOrigin: true,
      ws: true, // All WebSockets go to Vite (no backend WebSocket endpoints)
    })
  );
} else {
  console.log('Production mode: Serving static files');

  const distPath = path.join(__dirname, "frontend", "dist");
  app.use(express.static(distPath));
}

// ============================================================================
// SERVER START
// ============================================================================

app.listen(CONFIG.port, CONFIG.host, () => {
  console.log("\n" + "=".repeat(70));
  console.log(
    `🚀 STT Backend Server running at http://localhost:${CONFIG.port}`
  );
  if (CONFIG.isDevelopment) {
    console.log(
      `📡 Proxying frontend from Vite dev server on port ${CONFIG.vitePort}`
    );
    console.log(`\n⚠️  Open your browser to http://localhost:${CONFIG.port}`);
  } else {
    console.log(`📦 Serving built frontend from frontend/dist`);
  }
  console.log("=".repeat(70) + "\n");
});
