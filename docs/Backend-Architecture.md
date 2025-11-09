# Backend Architecture Guide

This document explains the architecture of the Node.js backend (`server.js`) and how to customize it for your needs.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Configuration](#configuration)
- [Core Functions](#core-functions)
- [Common Customizations](#common-customizations)
- [Adding New Features](#adding-new-features)
- [Testing](#testing)

## Overview

The backend is a simple Express.js server that:
1. Provides a `/stt/transcribe` API endpoint
2. Handles both file uploads and URL-based transcription
3. Integrates with Deepgram's Speech-to-Text API
4. Serves the frontend (via proxy in dev, static files in production)

**Key Design Principles:**
- **Simple & Focused**: Single responsibility - transcription
- **Modular**: Functions are small and testable
- **Well-Documented**: Every section and function has clear comments
- **Easy to Extend**: Clear customization points throughout

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     server.js                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Configuration                                       │
│     - DEFAULT_MODEL                                     │
│     - CONFIG object (port, host, etc.)                  │
│                                                         │
│  2. API Key Loading                                     │
│     - loadApiKey()                                      │
│                                                         │
│  3. Setup                                               │
│     - Initialize Deepgram client                        │
│     - Configure Multer for file uploads                 │
│     - Initialize Express app                            │
│                                                         │
│  4. Helper Functions                                    │
│     - validateTranscriptionInput()                      │
│     - transcribeAudio()                                 │
│     - formatTranscriptionResponse()                     │
│     - formatErrorResponse()                             │
│                                                         │
│  5. API Routes                                          │
│     - POST /stt/transcribe                              │
│     - [Your custom routes here]                         │
│                                                         │
│  6. Frontend Serving                                    │
│     - Dev: Proxy to Vite                                │
│     - Prod: Serve static files                          │
│                                                         │
│  7. Server Start                                        │
│     - app.listen()                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## File Structure

The code is organized into clearly marked sections:

1. **Configuration** - All customizable values in one place
2. **API Key Loading** - Secure credential management
3. **Setup** - Initialize dependencies
4. **Helper Functions** - Reusable, testable logic
5. **API Routes** - Your endpoint definitions
6. **Frontend Serving** - Dev/prod environment handling
7. **Server Start** - Bootstrap the application

## Configuration

### Environment Variables

All configuration can be controlled via environment variables:

```bash
# Required
DEEPGRAM_API_KEY=your_api_key_here

# Optional (with defaults)
PORT=3000                 # Server port
HOST=0.0.0.0             # Server host
VITE_PORT=5173           # Vite dev server port (development only)
NODE_ENV=development     # Environment mode
```

### In-Code Configuration

At the top of `server.js`:

```javascript
// Default Deepgram model
const DEFAULT_MODEL = "nova-3";

// Server configuration object
const CONFIG = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || "0.0.0.0",
  vitePort: process.env.VITE_PORT || 5173,
  isDevelopment: process.env.NODE_ENV === "development",
};
```

## Core Functions

### `loadApiKey()`

Loads the Deepgram API key with fallback logic:
1. Try `DEEPGRAM_API_KEY` environment variable
2. Try `config.json` file
3. Exit with helpful error message if not found

**Why separate function?** Makes testing easier and centralizes credential logic.

### `validateTranscriptionInput(file, url)`

Validates that either a file or URL was provided in the request.

**Returns:**
- `{ url }` for URL requests
- `{ buffer, mimetype }` for file requests
- `null` if neither provided

**Customization:** Add additional validation (file size, supported formats, etc.)

### `transcribeAudio(dgRequest, model)`

Sends transcription request to Deepgram.

**Parameters:**
- `dgRequest` - Object with either `url` OR `buffer`+`mimetype`
- `model` - Deepgram model name (default: `DEFAULT_MODEL`)

**Returns:** Deepgram API response object

**Customization:** This is where you add Deepgram features:

```javascript
async function transcribeAudio(dgRequest, model = DEFAULT_MODEL) {
  const options = {
    model,
    // Add any of these features:
    diarize: true,              // Speaker diarization
    punctuate: true,            // Smart punctuation
    paragraphs: true,           // Paragraph detection
    sentiment: true,            // Sentiment analysis
    summarize: true,            // Auto-summarization
    detect_language: true,      // Language detection
    // ... see Deepgram docs for more
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

### `formatTranscriptionResponse(transcriptionResponse, modelName)`

Formats Deepgram's response into your application's structure.

**Current structure:**
```javascript
{
  transcript: "The full transcript text",
  words: [{ word, start, end, confidence }],
  metadata: {
    model_uuid: "uuid",
    request_id: "request_id",
    model_name: "nova-3"
  },
  duration: 123.45  // optional
}
```

**Customization:** Modify this to include/exclude fields based on your needs.

### `formatErrorResponse(error, statusCode)`

Formats errors into a consistent structure.

**Current structure:**
```javascript
{
  error: {
    type: "ValidationError" | "TranscriptionError",
    code: "MISSING_INPUT" | "TRANSCRIPTION_FAILED",
    message: "Error message",
    details: {
      originalError: "..."
    }
  }
}
```

## Common Customizations

### 1. Change Default Model

Edit `DEFAULT_MODEL` at the top of `server.js`:

```javascript
const DEFAULT_MODEL = "nova-2";  // or "base", "enhanced", etc.
```

Available models: https://developers.deepgram.com/docs/models-languages-overview

### 2. Add Deepgram Features

Modify the `transcribeAudio()` function to add features like diarization, sentiment, etc.:

```javascript
async function transcribeAudio(dgRequest, model = DEFAULT_MODEL) {
  const options = {
    model,
    diarize: true,      // Speaker separation
    punctuate: true,    // Smart punctuation
    paragraphs: true,   // Paragraph breaks
  };
  
  // ... rest of function
}
```

### 3. Customize Response Format

Modify `formatTranscriptionResponse()` to change what data is returned:

```javascript
function formatTranscriptionResponse(transcriptionResponse, modelName) {
  const transcription = transcriptionResponse.result;
  const result = transcription?.results?.channels?.[0]?.alternatives?.[0];

  return {
    // Add or remove fields as needed
    transcript: result.transcript,
    paragraphs: result.paragraphs?.transcript,  // If paragraphs enabled
    sentiment: transcription.sentiment,          // If sentiment enabled
    // ... customize to your needs
  };
}
```

### 4. Add File Type Validation

Update `validateTranscriptionInput()`:

```javascript
function validateTranscriptionInput(file, url) {
  if (url) {
    return { url };
  }

  if (file) {
    // Add validation
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Unsupported file type: ${file.mimetype}`);
    }

    // Add size limit (e.g., 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 50MB');
    }

    return { buffer: file.buffer, mimetype: file.mimetype };
  }

  return null;
}
```

### 5. Add Request Logging

Add middleware before routes:

```javascript
// Add after: const app = express();

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

### 6. Add Authentication

Add auth middleware to protect your endpoint:

```javascript
// Simple API key authentication
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.YOUR_API_KEY) {
    return res.status(401).json({
      error: {
        type: "AuthenticationError",
        code: "UNAUTHORIZED",
        message: "Invalid or missing API key"
      }
    });
  }
  
  next();
}

// Apply to route
app.post("/stt/transcribe", authenticate, upload.single("file"), async (req, res) => {
  // ... rest of handler
});
```

## Adding New Features

### Example: Add Health Check Endpoint

```javascript
// Add in the "API ROUTES" section

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: require("./package.json").version
  });
});
```

### Example: Add Webhook Endpoint

```javascript
// Add body parser for JSON
app.use(express.json());

// Add webhook handler
app.post("/webhooks/deepgram", async (req, res) => {
  console.log("Received webhook:", req.body);
  
  // Process webhook data
  // Save to database, trigger notifications, etc.
  
  res.json({ received: true });
});
```

### Example: Add Batch Processing

```javascript
// Accept multiple files
app.post("/stt/transcribe-batch", 
  upload.array("files", 10),  // Max 10 files
  async (req, res) => {
    try {
      const { files } = req;
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          error: { message: "No files provided" }
        });
      }

      // Process all files in parallel
      const results = await Promise.all(
        files.map(file => 
          transcribeAudio(
            { buffer: file.buffer, mimetype: file.mimetype },
            DEFAULT_MODEL
          ).then(response => 
            formatTranscriptionResponse(response, DEFAULT_MODEL)
          )
        )
      );

      res.json({ results });
    } catch (err) {
      console.error("Batch transcription error:", err);
      const errorResponse = formatErrorResponse(err);
      res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  }
);
```

## Testing

### Manual Testing

```bash
# Start the server
pnpm dev

# Test with a file
curl -X POST http://localhost:3000/stt/transcribe \
  -F "file=@/path/to/audio.mp3" \
  -F "model=nova-3"

# Test with a URL
curl -X POST http://localhost:3000/stt/transcribe \
  -F "url=https://example.com/audio.mp3" \
  -F "model=nova-3"
```

### Unit Testing (Recommended)

Since functions are now modular, they're easy to test:

```javascript
// Example with Jest or Mocha
describe('validateTranscriptionInput', () => {
  it('should return url object when url provided', () => {
    const result = validateTranscriptionInput(null, 'https://example.com/audio.mp3');
    expect(result).toEqual({ url: 'https://example.com/audio.mp3' });
  });

  it('should return null when neither file nor url provided', () => {
    const result = validateTranscriptionInput(null, null);
    expect(result).toBeNull();
  });
});
```

## Best Practices

1. **Keep Functions Small**: Each function should do one thing well
2. **Use Environment Variables**: Never hardcode secrets or config
3. **Add Error Handling**: Always wrap Deepgram calls in try-catch
4. **Log Appropriately**: Log errors, not sensitive data
5. **Validate Input**: Always validate before processing
6. **Use TypeScript** (optional): Add type safety for larger projects
7. **Extract to Modules**: For complex apps, split into separate files:
   ```
   /routes
     - transcribe.js
     - health.js
   /services
     - deepgram.js
   /middleware
     - auth.js
     - validate.js
   /utils
     - format.js
   server.js (main)
   ```

## Resources

- [Deepgram API Documentation](https://developers.deepgram.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Deepgram Node SDK](https://github.com/deepgram/deepgram-node-sdk)

## Need Help?

- [Open an issue](https://github.com/deepgram-starters/node-transcription/issues)
- [Join Deepgram Discord](https://discord.gg/xWRaCDBtW4)
- [Read the guides](https://developers.deepgram.com/docs)

