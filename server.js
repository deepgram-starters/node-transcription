/**
 * Node Transcription Starter - Backend Server
 *
 * This is a simple Express server that provides a transcription API endpoint
 * powered by Deepgram's Speech-to-Text service. It's designed to be easily
 * modified and extended for your own projects.
 *
 * Key Features:
 * - Single API endpoint: POST /api/transcription
 * - Accepts both file uploads and URLs
 * - CORS enabled for frontend communication
 * - JWT session auth with page nonce (production only)
 * - Pure API server (frontend served separately)
 */

require("dotenv").config();

const { createClient } = require("@deepgram/sdk");
const cors = require("cors");
const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const jwt = require("jsonwebtoken");
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
  port: process.env.PORT || 8081,
  host: process.env.HOST || "0.0.0.0",
};

// ============================================================================
// SESSION AUTH - JWT tokens with page nonce for production security
// ============================================================================

/**
 * Session secret for signing JWTs. When set (production/Fly.io), nonce
 * validation is enforced. When unset (local dev), tokens are issued freely.
 */
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const REQUIRE_NONCE = !!process.env.SESSION_SECRET;

/** In-memory nonce store: nonce → expiry timestamp */
const sessionNonces = new Map();

/** Nonce expiry time (5 minutes) */
const NONCE_TTL_MS = 5 * 60 * 1000;

/** JWT expiry time (1 hour) */
const JWT_EXPIRY = "1h";

/**
 * Generates a single-use nonce and stores it with an expiry
 * @returns {string} The generated nonce
 */
function generateNonce() {
  const nonce = crypto.randomBytes(16).toString("hex");
  sessionNonces.set(nonce, Date.now() + NONCE_TTL_MS);
  return nonce;
}

/**
 * Validates and consumes a nonce (single-use)
 * @param {string} nonce - The nonce to validate
 * @returns {boolean} True if the nonce was valid and consumed
 */
function consumeNonce(nonce) {
  const expiry = sessionNonces.get(nonce);
  if (!expiry) return false;
  sessionNonces.delete(nonce);
  return Date.now() < expiry;
}

/** Periodically clean up expired nonces (every 60 seconds) */
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiry] of sessionNonces) {
    if (now >= expiry) sessionNonces.delete(nonce);
  }
}, 60_000);

/**
 * Reads frontend/dist/index.html and injects a session nonce meta tag.
 * Returns null in dev mode (no built frontend).
 */
let indexHtmlTemplate = null;
try {
  indexHtmlTemplate = fs.readFileSync(
    path.join(__dirname, "frontend", "dist", "index.html"),
    "utf-8"
  );
} catch {
  // No built frontend (dev mode) — index.html served by Vite
}

/**
 * Express middleware that validates JWT from Authorization header.
 * Returns 401 with JSON error if token is missing or invalid.
 */
function requireSession(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        type: "AuthenticationError",
        code: "MISSING_TOKEN",
        message: "Authorization header with Bearer token is required",
      },
    });
  }

  try {
    const token = authHeader.slice(7);
    jwt.verify(token, SESSION_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        type: "AuthenticationError",
        code: "INVALID_TOKEN",
        message:
          err.name === "TokenExpiredError"
            ? "Session expired, please refresh the page"
            : "Invalid session token",
      },
    });
  }
}

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

// Enable CORS (wildcard is safe -- same-origin via Vite proxy / Caddy in production)
app.use(cors());

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
// SESSION ROUTES - Auth endpoints (unprotected)
// ============================================================================

/**
 * GET / — Serve index.html with injected session nonce (production only).
 * In dev mode, Vite serves the frontend directly.
 */
app.get("/", (req, res) => {
  if (!indexHtmlTemplate) {
    return res.status(404).send("Frontend not built. Run make build first.");
  }
  const nonce = generateNonce();
  const html = indexHtmlTemplate.replace(
    "</head>",
    `<meta name="session-nonce" content="${nonce}">\n</head>`
  );
  res.type("html").send(html);
});

/**
 * GET /api/session — Issues a JWT. In production (SESSION_SECRET set),
 * requires a valid single-use nonce via X-Session-Nonce header.
 */
app.get("/api/session", (req, res) => {
  if (REQUIRE_NONCE) {
    const nonce = req.headers["x-session-nonce"];
    if (!nonce || !consumeNonce(nonce)) {
      return res.status(403).json({
        error: {
          type: "AuthenticationError",
          code: "INVALID_NONCE",
          message: "Valid session nonce required. Please refresh the page.",
        },
      });
    }
  }

  const token = jwt.sign({ iat: Math.floor(Date.now() / 1000) }, SESSION_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
  res.json({ token });
});

// ============================================================================
// API ROUTES - Define your API endpoints here
// ============================================================================

/**
 * POST /api/transcription
 *
 * Main transcription endpoint. Accepts either:
 * - A file upload (multipart/form-data with 'file' field)
 * - A URL to audio file (form data with 'url' field)
 *
 * Optional parameters:
 * - model: Deepgram model to use (default: "nova-3")
 *
 * Protected by JWT session auth (requireSession middleware).
 */
app.post("/api/transcription", requireSession, upload.single("file"), async (req, res) => {
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
// SERVER START
// ============================================================================

app.listen(CONFIG.port, CONFIG.host, () => {
  console.log("\n" + "=".repeat(70));
  console.log(`🚀 Backend API running at http://localhost:${CONFIG.port}`);
  console.log(`📡 GET  /api/session${REQUIRE_NONCE ? " (nonce required)" : ""}`);
  console.log(`📡 POST /api/transcription (auth required)`);
  console.log(`📡 GET  /api/metadata`);
  console.log("=".repeat(70) + "\n");
});
