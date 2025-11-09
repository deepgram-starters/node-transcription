# Code Structure Overview

A visual guide to understanding the structure of `server.js`.

## File Organization

The `server.js` file is organized into 7 clearly marked sections:

```
server.js (312 lines)
│
├─ 1. CONFIGURATION (lines 23-42)
│  └─ Easy-to-find constants and settings
│
├─ 2. API KEY LOADING (lines 44-84)
│  └─ Secure credential management with helpful errors
│
├─ 3. SETUP (lines 86-98)
│  └─ Initialize dependencies (Express, Deepgram, Multer)
│
├─ 4. HELPER FUNCTIONS (lines 100-202)
│  ├─ validateTranscriptionInput()  - Input validation
│  ├─ transcribeAudio()             - Call Deepgram API
│  ├─ formatTranscriptionResponse() - Format API response
│  └─ formatErrorResponse()         - Format errors
│
├─ 5. API ROUTES (lines 204-268)
│  ├─ POST /stt/transcribe - Main transcription endpoint
│  └─ [Space for your custom routes]
│
├─ 6. FRONTEND SERVING (lines 270-294)
│  └─ Dev proxy or production static files
│
└─ 7. SERVER START (lines 296-312)
   └─ Start listening for requests
```

## Code Flow Diagram

### Request Flow for POST /stt/transcribe

```
┌─────────────────────────────────────────────────────────────┐
│ Client makes request                                        │
│ POST /stt/transcribe                                        │
│ - Body: { url?, model? }                                    │
│ - File: multipart/form-data (optional)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Multer middleware                                           │
│ - Parses multipart form data                                │
│ - Stores file in memory                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Route handler (line 224)                                    │
│ - Extracts: body.url, body.model, file                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ validateTranscriptionInput(file, url)  (line 230)          │
│                                                             │
│ Returns:                                                    │
│ - { url } for URL requests                                  │
│ - { buffer, mimetype } for file requests                    │
│ - null if neither provided                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├── null? ──> Return 400 error
                     │
                     ▼ valid
┌─────────────────────────────────────────────────────────────┐
│ transcribeAudio(dgRequest, model)  (line 240)              │
│                                                             │
│ Calls Deepgram API:                                         │
│ - transcribeUrl() for URL requests                          │
│ - transcribeFile() for file requests                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├── Error? ──> Catch block (line 252)
                     │              └─> formatErrorResponse()
                     │                  └─> Return 500 error
                     │
                     ▼ success
┌─────────────────────────────────────────────────────────────┐
│ formatTranscriptionResponse(response, model)  (line 246)   │
│                                                             │
│ Extracts and formats:                                       │
│ - transcript (text)                                         │
│ - words (with timestamps)                                   │
│ - metadata (model info, request ID)                         │
│ - duration (optional)                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Return JSON response (line 250)                             │
│ res.json({ transcript, words, metadata, duration? })        │
└─────────────────────────────────────────────────────────────┘
```

## Function Dependencies

### Who calls what?

```
app.post("/stt/transcribe", ...)  (Main route handler)
│
├─> validateTranscriptionInput(file, url)
│   └─> Returns dgRequest object or null
│
├─> transcribeAudio(dgRequest, model)
│   └─> deepgram.listen.prerecorded.transcribeUrl() OR
│   └─> deepgram.listen.prerecorded.transcribeFile()
│
├─> formatTranscriptionResponse(response, model)
│   └─> Returns formatted response object
│
└─> formatErrorResponse(error, statusCode)  (on error)
    └─> Returns formatted error object
```

## Data Flow

### Input → Processing → Output

```
INPUT (Client Request)
│
├─ File Upload Path
│  │
│  ├─ multipart/form-data
│  │   - file: <binary data>
│  │   - model: "nova-3" (optional)
│  │
│  └─> Multer parses → { buffer, mimetype }
│      │
│      └─> validateTranscriptionInput()
│          └─> { buffer, mimetype }
│              │
│              └─> transcribeAudio()
│                  └─> deepgram.listen.prerecorded.transcribeFile()
│
└─ URL Path
   │
   ├─ multipart/form-data
   │   - url: "https://..."
   │   - model: "nova-3" (optional)
   │
   └─> validateTranscriptionInput()
       └─> { url }
           │
           └─> transcribeAudio()
               └─> deepgram.listen.prerecorded.transcribeUrl()

PROCESSING (Deepgram API)
│
└─> Returns:
    {
      result: {
        metadata: { ... },
        results: {
          channels: [{
            alternatives: [{
              transcript: "...",
              words: [...]
            }]
          }]
        }
      }
    }

OUTPUT (Formatted Response)
│
└─> formatTranscriptionResponse()
    │
    └─> Returns:
        {
          transcript: "...",
          words: [...],
          metadata: { ... },
          duration: 123.45
        }
```

## Configuration Flow

### How settings are loaded and used

```
ENVIRONMENT VARIABLES (.env file or system)
│
├─ DEEPGRAM_API_KEY (required)
│  └─> loadApiKey()
│      └─> createClient(apiKey)
│          └─> deepgram (global)
│
├─ PORT (optional, default: 3000)
│  └─> CONFIG.port
│      └─> app.listen(port, ...)
│
├─ HOST (optional, default: "0.0.0.0")
│  └─> CONFIG.host
│      └─> app.listen(port, host, ...)
│
├─ NODE_ENV (optional, default: undefined)
│  └─> CONFIG.isDevelopment
│      ├─> true  → Proxy to Vite dev server
│      └─> false → Serve static files
│
└─ VITE_PORT (optional, default: 5173)
   └─> CONFIG.vitePort
       └─> createProxyMiddleware({ target: ... })
```

## Customization Points

### Where to make common changes

```
server.js
│
├─ Change default model?
│  └─> Line 32: const DEFAULT_MODEL = "nova-3"
│
├─ Add Deepgram features (diarization, sentiment, etc.)?
│  └─> Line 131-144: transcribeAudio() function
│      └─> Add options to API call
│
├─ Change response format?
│  └─> Line 155-179: formatTranscriptionResponse() function
│      └─> Modify return object structure
│
├─ Add input validation (file size, type, etc.)?
│  └─> Line 110-123: validateTranscriptionInput() function
│      └─> Add checks and throw errors
│
├─ Add authentication?
│  └─> After line 98: Add middleware function
│      └─> Apply to routes: app.post("/stt/transcribe", authMiddleware, ...)
│
├─ Add new endpoints?
│  └─> Line 260-268: "ADD YOUR CUSTOM ROUTES HERE" section
│      └─> app.post("/new-endpoint", ...)
│
└─ Change error responses?
   └─> Line 188-201: formatErrorResponse() function
       └─> Modify error structure
```

## Error Handling Flow

```
TRY BLOCK
│
├─> validateTranscriptionInput()
│   └─> Returns null
│       └─> Immediate return with 400 error
│
├─> transcribeAudio()
│   └─> Deepgram API error
│       └─> Throws exception
│
└─> formatTranscriptionResponse()
    └─> No results from Deepgram
        └─> Throws exception

CATCH BLOCK (line 252-257)
│
├─> Log error to console
│   └─> console.error("Transcription error:", err)
│
├─> Format error response
│   └─> formatErrorResponse(err)
│       └─> Creates structured error object
│
└─> Return 500 error
    └─> res.status(500).json(errorResponse.body)
```

## Development vs Production

```
Development Mode (NODE_ENV=development)
│
├─> Frontend: Proxy to Vite dev server
│   └─> Hot module reload (HMR)
│   └─> Fast development
│   └─> Port 5173 (default)
│
└─> Backend: Runs on port 3000
    └─> API routes: /stt/*
    └─> Everything else → Proxied to Vite

Production Mode (NODE_ENV=production or unset)
│
├─> Frontend: Serve static files
│   └─> Built files in frontend/dist/
│   └─> Fast serving
│   └─> No external dependencies
│
└─> Backend: Runs on port 3000
    └─> API routes: /stt/*
    └─> Everything else → Static files
```

## Quick Reference

| Line Range | Section             | Purpose                          |
|------------|---------------------|----------------------------------|
| 1-21       | Header              | File documentation & imports     |
| 23-42      | Configuration       | Constants and settings           |
| 44-84      | API Key Loading     | Load Deepgram credentials        |
| 86-98      | Setup               | Initialize dependencies          |
| 100-202    | Helper Functions    | Modular, reusable logic          |
| 204-268    | API Routes          | Endpoint definitions             |
| 270-294    | Frontend Serving    | Dev proxy or static files        |
| 296-312    | Server Start        | Start listening                  |

## Next Steps

- See [Backend Architecture Guide](./Backend-Architecture.md) for detailed explanations
- See [Quick Reference](./Quick-Reference.md) for copy-paste code snippets
- Read inline comments in `server.js` for context-specific details

