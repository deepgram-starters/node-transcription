# STT Interface Conformance

This starter app implements the `/stt/transcribe` endpoint according to the [starter-contracts specification](../starter-contracts/interfaces/stt/).

## Changes Made for Conformance

### 1. **Schema Validation** ✅
- Added `ajv` and `ajv-formats` dependencies for runtime schema validation
- Loads schemas from `starter-contracts/interfaces/stt/schema/`
- Validates every response against `transcript.json` before sending
- Validates error responses against `error.json`

**Why:** Ensures responses always match the contract, catches bugs immediately

### 2. **Response Format** ✅
- Transforms Deepgram responses to standardized format
- Required field: `transcript` (string)
- Optional fields: `words`, `duration`, `metadata`
- Words include: `text`, `start`, `end`, `speaker` (optional)

**Why:** Consistent response format across all starter apps

### 3. **Error Handling** ✅
- Returns structured errors matching `error.json` schema
- Error codes: `UNSUPPORTED_MEDIA_TYPE`, `BAD_AUDIO`
- Proper HTTP status codes (415, 400, 500)
- Includes error details for debugging

**Why:** Standardized error handling for better developer experience

### 4. **Header Support** ✅
- Echoes `X-Request-Id` header in responses
- Supports `Content-Type` validation
- Echoes request ID even in error responses

**Why:** Request tracing and debugging support

### 5. **Query Parameter Handling** ✅
- Accepts all standard STT parameters
- Unknown parameters are passed through (forward compatibility)
- Boolean parameters parsed correctly

**Why:** Flexible parameter handling, backward/forward compatible

---

## Testing Against Conformance Suite

### Run Schema Validation Tests
```bash
cd ../starter-contracts
npm run test:stt:schema
```

Expected: ✅ 25/25 tests passing

### Run Conformance Tests
```bash
# Start this app
cd ../prerecorded-node-starter
npm install
npm start

# In another terminal, run conformance tests
cd ../starter-contracts
STARTER_APP_URL=http://localhost:8080 npm run test:stt
```

Expected: ✅ 15/15 tests passing (if Deepgram API key is configured)

---

## Implementation Details

### Request Flow
1. **Validate Content-Type** → Return 415 if invalid
2. **Validate Body** → Return 400 if empty
3. **Parse Query Params** → Extract features
4. **Call Deepgram API** → Get transcription
5. **Transform Response** → Convert to standard format
6. **Validate Schema** → Ensure compliance
7. **Return Response** → With proper headers

### Error Handling
- HTTP-level errors (415, 400) for client mistakes
- 500 for processing errors
- All errors match `error.json` schema
- X-Request-Id echoed in all responses

### Schema Compliance
- Runtime validation ensures responses always match contract
- Logs validation failures for debugging
- Prevents schema drift over time

---

## Benefits

### For Developers Building Starter Apps
- ✅ **Guaranteed data structure** - No surprises in production
- ✅ **Type-safe** - Can generate TypeScript types from schemas
- ✅ **Validated examples** - Documentation is always accurate
- ✅ **Clear errors** - Structured error responses

### For Deepgram Team
- ✅ **Consistency** - All starter apps use same format
- ✅ **Testable** - Automated conformance validation
- ✅ **Maintainable** - Single source of truth for contracts
- ✅ **Discoverable** - Clear API specification

---

## Next Steps

1. ✅ Implement `/stt/transcribe` endpoint
2. ✅ Add schema validation
3. ✅ Pass conformance tests
4. 🔄 **Run tests against live backend** (current step)
5. ⏳ Apply pattern to other endpoints (TTS, Live STT, etc.)

---

## Files Changed

- `server.js` - Added schema validation and conformance
- `package.json` - Added ajv dependencies
- `CONFORMANCE.md` - This documentation

## Dependencies Added

```json
{
  "ajv": "^8.17.1",
  "ajv-formats": "^3.0.1"
}
```

---

## Questions?

See the [starter-contracts repository](../starter-contracts/) for:
- Full API specifications
- JSON schemas
- Example requests/responses
- Testing guide

