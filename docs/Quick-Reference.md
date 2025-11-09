# Quick Reference - Common Code Snippets

This guide provides copy-paste code snippets for the most common modifications to the backend.

## Table of Contents

- [Adding Deepgram Features](#adding-deepgram-features)
- [Validation Examples](#validation-examples)
- [Authentication](#authentication)
- [New Endpoints](#new-endpoints)
- [Response Formatting](#response-formatting)
- [Error Handling](#error-handling)

---

## Adding Deepgram Features

### Enable Speaker Diarization

Modify the `transcribeAudio()` function:

```javascript
async function transcribeAudio(dgRequest, model = DEFAULT_MODEL) {
  const options = {
    model,
    diarize: true,  // Enable speaker diarization
  };

  if (dgRequest.url) {
    return await deepgram.listen.prerecorded.transcribeUrl(
      { url: dgRequest.url },
      options
    );
  }

  return await deepgram.listen.prerecorded.transcribeFile(
    dgRequest.buffer,
    { ...options, mimetype: dgRequest.mimetype }
  );
}
```

Then update `formatTranscriptionResponse()` to include speaker labels:

```javascript
function formatTranscriptionResponse(transcriptionResponse, modelName) {
  const transcription = transcriptionResponse.result;
  const result = transcription?.results?.channels?.[0]?.alternatives?.[0];

  if (!result) {
    throw new Error("No transcription results returned from Deepgram");
  }

  const response = {
    transcript: result.transcript || "",
    words: result.words || [],
    // Add paragraphs with speaker info
    paragraphs: result.paragraphs?.paragraphs || [],
    metadata: {
      model_uuid: transcription.metadata?.model_uuid,
      request_id: transcription.metadata?.request_id,
      model_name: modelName,
    },
  };

  if (transcription.metadata?.duration) {
    response.duration = transcription.metadata.duration;
  }

  return response;
}
```

### Enable Multiple Features at Once

```javascript
async function transcribeAudio(dgRequest, model = DEFAULT_MODEL) {
  const options = {
    model,
    diarize: true,           // Speaker separation
    punctuate: true,         // Smart punctuation
    paragraphs: true,        // Paragraph detection
    sentiment: true,         // Sentiment analysis
    summarize: "v2",         // Auto-summarization
    detect_language: true,   // Language detection
    detect_topics: true,     // Topic detection
  };

  if (dgRequest.url) {
    return await deepgram.listen.prerecorded.transcribeUrl(
      { url: dgRequest.url },
      options
    );
  }

  return await deepgram.listen.prerecorded.transcribeFile(
    dgRequest.buffer,
    { ...options, mimetype: dgRequest.mimetype }
  );
}
```

### Make Features Configurable via Request

Allow clients to specify features in the request:

```javascript
app.post("/stt/transcribe", upload.single("file"), async (req, res) => {
  try {
    const { body, file } = req;
    const { url, model, diarize, sentiment, summarize } = body;

    const dgRequest = validateTranscriptionInput(file, url);
    if (!dgRequest) {
      const errorResponse = formatErrorResponse(
        new Error("Either file or url must be provided"),
        400
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    // Build options from request parameters
    const options = { model: model || DEFAULT_MODEL };
    if (diarize === "true") options.diarize = true;
    if (sentiment === "true") options.sentiment = true;
    if (summarize === "true") options.summarize = "v2";

    // Pass options to transcribeAudio
    const transcriptionResponse = await transcribeAudioWithOptions(
      dgRequest,
      options
    );

    const response = formatTranscriptionResponse(
      transcriptionResponse,
      model || DEFAULT_MODEL
    );
    res.json(response);
  } catch (err) {
    console.error("Transcription error:", err);
    const errorResponse = formatErrorResponse(err);
    res.status(errorResponse.statusCode).json(errorResponse.body);
  }
});

// New helper function
async function transcribeAudioWithOptions(dgRequest, options) {
  if (dgRequest.url) {
    return await deepgram.listen.prerecorded.transcribeUrl(
      { url: dgRequest.url },
      options
    );
  }

  return await deepgram.listen.prerecorded.transcribeFile(
    dgRequest.buffer,
    { ...options, mimetype: dgRequest.mimetype }
  );
}
```

---

## Validation Examples

### File Size Limit

```javascript
function validateTranscriptionInput(file, url) {
  if (url) {
    return { url };
  }

  if (file) {
    // Limit file size to 50MB
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of 50MB`
      );
    }

    return { buffer: file.buffer, mimetype: file.mimetype };
  }

  return null;
}
```

### File Type Validation

```javascript
function validateTranscriptionInput(file, url) {
  if (url) {
    return { url };
  }

  if (file) {
    // Define allowed MIME types
    const ALLOWED_TYPES = [
      'audio/mpeg',      // MP3
      'audio/wav',       // WAV
      'audio/ogg',       // OGG
      'audio/webm',      // WEBM
      'audio/flac',      // FLAC
      'audio/mp4',       // M4A
      'video/mp4',       // MP4 (video)
      'video/webm',      // WEBM (video)
    ];

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new Error(
        `File type ${file.mimetype} not supported. Allowed types: ${ALLOWED_TYPES.join(', ')}`
      );
    }

    return { buffer: file.buffer, mimetype: file.mimetype };
  }

  return null;
}
```

### URL Validation

```javascript
function validateTranscriptionInput(file, url) {
  if (url) {
    // Validate URL format
    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('URL must use HTTP or HTTPS protocol');
      }
      
      return { url };
    } catch (err) {
      throw new Error(`Invalid URL: ${err.message}`);
    }
  }

  if (file) {
    return { buffer: file.buffer, mimetype: file.mimetype };
  }

  return null;
}
```

---

## Authentication

### Simple API Key Authentication

Add this middleware before your routes:

```javascript
// Add after: const app = express();

/**
 * Simple API key authentication middleware
 * Set YOUR_API_KEY in .env file
 */
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.YOUR_API_KEY;
  
  if (!validKey) {
    console.warn("Warning: YOUR_API_KEY not set in environment");
  }
  
  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({
      error: {
        type: "AuthenticationError",
        code: "UNAUTHORIZED",
        message: "Invalid or missing API key. Include X-API-Key header."
      }
    });
  }
  
  next();
}

// Apply to protected routes
app.post("/stt/transcribe", authenticate, upload.single("file"), async (req, res) => {
  // ... rest of handler
});
```

Usage:

```bash
curl -X POST http://localhost:3000/stt/transcribe \
  -H "X-API-Key: your_secret_key" \
  -F "file=@audio.mp3"
```

### JWT Authentication

```bash
# Install JWT library
pnpm add jsonwebtoken
```

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * JWT authentication middleware
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        type: "AuthenticationError",
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization header"
      }
    });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        type: "AuthenticationError",
        code: "INVALID_TOKEN",
        message: "Invalid or expired token"
      }
    });
  }
}

// Optional: Add login endpoint to issue tokens
app.post("/auth/login", express.json(), (req, res) => {
  const { username, password } = req.body;
  
  // Validate credentials (implement your own logic)
  if (username === "demo" && password === "password") {
    const token = jwt.sign(
      { username, userId: 1 },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return res.json({ token });
  }
  
  res.status(401).json({
    error: { message: "Invalid credentials" }
  });
});

// Apply to routes
app.post("/stt/transcribe", authenticateJWT, upload.single("file"), async (req, res) => {
  // Access user info via req.user
  console.log(`Transcription request from user: ${req.user.username}`);
  // ... rest of handler
});
```

---

## New Endpoints

### Health Check Endpoint

```javascript
// Add in the "API ROUTES" section

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: require("./package.json").version,
    uptime: process.uptime()
  });
});
```

### Batch Transcription Endpoint

```javascript
// Process multiple files at once
app.post("/stt/transcribe-batch", 
  upload.array("files", 10),  // Accept up to 10 files
  async (req, res) => {
    try {
      const { files } = req;
      const { model } = req.body;
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          error: { message: "No files provided" }
        });
      }

      // Process all files in parallel
      const results = await Promise.all(
        files.map(async (file, index) => {
          try {
            const dgRequest = { buffer: file.buffer, mimetype: file.mimetype };
            const response = await transcribeAudio(dgRequest, model || DEFAULT_MODEL);
            return {
              index,
              filename: file.originalname,
              success: true,
              data: formatTranscriptionResponse(response, model || DEFAULT_MODEL)
            };
          } catch (err) {
            return {
              index,
              filename: file.originalname,
              success: false,
              error: err.message
            };
          }
        })
      );

      res.json({ 
        total: files.length,
        results 
      });
    } catch (err) {
      console.error("Batch transcription error:", err);
      const errorResponse = formatErrorResponse(err);
      res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  }
);
```

### Status/Job Check Endpoint

```javascript
// Simple in-memory job tracking (use database for production)
const jobs = new Map();

app.post("/stt/transcribe-async", upload.single("file"), async (req, res) => {
  const jobId = Date.now().toString();
  
  jobs.set(jobId, { status: 'processing', result: null, error: null });
  
  // Return immediately with job ID
  res.json({ jobId, status: 'processing' });
  
  // Process in background
  const { body, file } = req;
  const { url, model } = body;
  
  try {
    const dgRequest = validateTranscriptionInput(file, url);
    const response = await transcribeAudio(dgRequest, model || DEFAULT_MODEL);
    const result = formatTranscriptionResponse(response, model || DEFAULT_MODEL);
    
    jobs.set(jobId, { status: 'completed', result, error: null });
  } catch (err) {
    jobs.set(jobId, { status: 'failed', result: null, error: err.message });
  }
});

app.get("/stt/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      error: { message: "Job not found" }
    });
  }
  
  res.json(job);
});
```

### Webhook Callback Endpoint

```javascript
// Add body parser for JSON
app.use(express.json());

app.post("/webhooks/deepgram", async (req, res) => {
  console.log("Received webhook from Deepgram:", req.body);
  
  // Verify webhook signature if configured
  // const signature = req.headers['deepgram-signature'];
  
  try {
    // Process the webhook data
    const { type, data } = req.body;
    
    switch (type) {
      case 'transcription.complete':
        // Handle completed transcription
        console.log("Transcription completed:", data.request_id);
        break;
        
      case 'transcription.failed':
        // Handle failed transcription
        console.error("Transcription failed:", data.error);
        break;
        
      default:
        console.log("Unknown webhook type:", type);
    }
    
    // Acknowledge receipt
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});
```

---

## Response Formatting

### Include Paragraphs and Sentences

```javascript
function formatTranscriptionResponse(transcriptionResponse, modelName) {
  const transcription = transcriptionResponse.result;
  const result = transcription?.results?.channels?.[0]?.alternatives?.[0];

  if (!result) {
    throw new Error("No transcription results returned from Deepgram");
  }

  const response = {
    transcript: result.transcript || "",
    
    // Include detailed word timings
    words: result.words || [],
    
    // Include paragraph structure (if paragraphs: true in options)
    paragraphs: result.paragraphs?.paragraphs || [],
    
    // Include sentence structure  
    sentences: result.paragraphs?.sentences || [],
    
    metadata: {
      model_uuid: transcription.metadata?.model_uuid,
      request_id: transcription.metadata?.request_id,
      model_name: modelName,
    },
  };

  if (transcription.metadata?.duration) {
    response.duration = transcription.metadata.duration;
  }

  return response;
}
```

### Simplified Response (Transcript Only)

```javascript
function formatTranscriptionResponse(transcriptionResponse, modelName) {
  const transcription = transcriptionResponse.result;
  const result = transcription?.results?.channels?.[0]?.alternatives?.[0];

  if (!result) {
    throw new Error("No transcription results returned from Deepgram");
  }

  // Return only the transcript text
  return {
    transcript: result.transcript || "",
  };
}
```

### Include Confidence Scores

```javascript
function formatTranscriptionResponse(transcriptionResponse, modelName) {
  const transcription = transcriptionResponse.result;
  const result = transcription?.results?.channels?.[0]?.alternatives?.[0];

  if (!result) {
    throw new Error("No transcription results returned from Deepgram");
  }

  // Calculate average confidence
  const words = result.words || [];
  const avgConfidence = words.length > 0
    ? words.reduce((sum, w) => sum + (w.confidence || 0), 0) / words.length
    : 0;

  return {
    transcript: result.transcript || "",
    words: words,
    confidence: {
      average: avgConfidence,
      min: Math.min(...words.map(w => w.confidence || 0)),
      max: Math.max(...words.map(w => w.confidence || 0)),
    },
    metadata: {
      model_uuid: transcription.metadata?.model_uuid,
      request_id: transcription.metadata?.request_id,
      model_name: modelName,
    },
  };
}
```

---

## Error Handling

### Custom Error Classes

```javascript
// Define custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class TranscriptionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TranscriptionError';
    this.statusCode = 500;
  }
}

// Update formatErrorResponse
function formatErrorResponse(error, statusCode) {
  return {
    statusCode: error.statusCode || statusCode || 500,
    body: {
      error: {
        type: error.name || "Error",
        code: error.code || "ERROR",
        message: error.message || "An error occurred",
        details: {
          originalError: error.toString(),
        },
      },
    },
  };
}

// Use in validation
function validateTranscriptionInput(file, url) {
  if (!file && !url) {
    throw new ValidationError("Either file or url must be provided");
  }
  
  if (file && file.size > 50 * 1024 * 1024) {
    throw new ValidationError("File size exceeds 50MB limit");
  }
  
  // ... rest of validation
}
```

### Rate Limiting

```bash
# Install rate limiter
pnpm add express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

// Create rate limiter
const transcriptionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: {
      type: "RateLimitError",
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests, please try again later"
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to routes
app.post("/stt/transcribe", transcriptionLimiter, upload.single("file"), async (req, res) => {
  // ... rest of handler
});
```

### Request Logging

```javascript
// Add after: const app = express();

app.use((req, res, next) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} | ${req.method} ${req.path} | ` +
      `Status: ${res.statusCode} | Duration: ${duration}ms`
    );
  });
  
  next();
});
```

---

## Testing Snippets

### Test with curl

```bash
# Test file upload
curl -X POST http://localhost:3000/stt/transcribe \
  -F "file=@/path/to/audio.mp3" \
  -F "model=nova-3"

# Test URL
curl -X POST http://localhost:3000/stt/transcribe \
  -F "url=https://example.com/audio.mp3"

# Test with authentication
curl -X POST http://localhost:3000/stt/transcribe \
  -H "X-API-Key: your_secret_key" \
  -F "file=@audio.mp3"

# Test with features
curl -X POST http://localhost:3000/stt/transcribe \
  -F "file=@audio.mp3" \
  -F "model=nova-3" \
  -F "diarize=true" \
  -F "sentiment=true"
```

### Test with JavaScript fetch

```javascript
// Test file upload from browser
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('model', 'nova-3');

const response = await fetch('http://localhost:3000/stt/transcribe', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result);
```

---

## Need More Examples?

Check out:
- [Backend Architecture Guide](./Backend-Architecture.md) - Detailed explanations
- [Deepgram API Docs](https://developers.deepgram.com/) - All available features
- [Express.js Guide](https://expressjs.com/en/guide/routing.html) - Routing patterns

