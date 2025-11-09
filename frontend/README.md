# Deepgram Transcription HTML

A minimal HTML starter with Deepgram design system styles included.

## Features

- 🎨 Deepgram design system styles via workspace dependency
- ⚡ Vite for fast development and building
- 📦 Simple setup with minimal boilerplate

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- pnpm (workspace package manager)
- A Deepgram API key (get one at [console.deepgram.com](https://console.deepgram.com))

### Installation

From the workspace root:

```bash
pnpm install
```

### Development

Run the development server:

```bash
# From workspace root
nx dev @deepgram/transcription-html

# Or from this directory
pnpm dev
```

The app will open automatically at `http://localhost:8081`.

### Build

Build the application:

```bash
# From workspace root
nx build @deepgram/transcription-html

# Or from this directory
pnpm build
```

### Preview

Preview the built application:

```bash
# From workspace root
nx preview @deepgram/transcription-html

# Or from this directory
pnpm preview
```

## Usage

This demo provides a two-column interface for pre-recorded speech-to-text transcription:

### State Preview Mode

For styling and development purposes, you can preview different app states using URL query parameters:

- **Initial State**: `http://localhost:8081/` or `index.html`
  - Default empty state with prompt to select audio

- **Waiting State**: `http://localhost:8081/?state=waiting`
  - Shows loading spinner and "Working..." status

- **Results State**: `http://localhost:8081/?state=results`
  - Displays mock transcript and metadata

- **Error State**: `http://localhost:8081/?state=error`
  - Shows error message with appropriate styling

This feature is particularly useful for:
- Testing and styling different UI states
- Taking screenshots for documentation
- Demonstrating the app without a backend
- Developing UI components in isolation

### Left Sidebar (Controls)

- **Audio Source Selection**: Choose between audio URL, file upload, or sample audio
- **Model Selection**: Select from Nova 3, Nova 2, Base, or Enhanced models
- **Status Indicator**: Shows working status during transcription
- **Metadata Display**: Shows duration, word count, and other metadata after transcription

### Main Content Area

- Displays initial instructions when no transcript is available
- Shows the full transcript text after successful transcription

### API Integration

The demo expects a backend implementing the `/stt/transcribe` endpoint according to the [@starter-contracts/stt](../../../starter-contracts/interfaces/stt/) specification:

**Request (File Upload):**

```http
POST /stt/transcribe
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="audio.mp3"
Content-Type: audio/mpeg

[binary file data]
------WebKitFormBoundary
Content-Disposition: form-data; name="model"

nova-3
------WebKitFormBoundary--
```

**Request (URL):**

```http
POST /stt/transcribe
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="url"

https://example.com/audio.mp3
------WebKitFormBoundary
Content-Disposition: form-data; name="model"

nova-3
------WebKitFormBoundary--
```

**Success Response (200):**

```json
{
  "transcript": "Full transcribed text...",
  "duration": 45.2,
  "words": [{ "text": "Hello", "start": 0.0, "end": 0.5 }],
  "metadata": {}
}
```

**Error Response (4XX):**

```json
{
  "error": {
    "type": "ValidationError",
    "code": "INVALID_URL",
    "message": "The provided URL is not valid",
    "details": {}
  }
}
```

The backend accepts either a file upload or a URL via multipart/form-data. The app validates both success and error responses to ensure they match the contract specification. Error messages will display the type, message, and code (if available) to help with debugging.

## Technology Stack

- **Vite** - Fast build tool and dev server
- **Vanilla JavaScript** - No frameworks, just plain JS
- **@deepgram/styles** - Workspace styles library with Tailwind CSS
- **STT Contract** - Follows [@starter-contracts/stt](../../../starter-contracts/interfaces/stt/) specification

## Project Structure

```
apps/transcription-html/
├── index.html          # Two-column layout with sidebar controls and main content
├── main.js             # Application logic and API integration
├── vite.config.js      # Vite configuration
├── package.json        # Project dependencies and scripts
├── project.json        # Nx project configuration
└── README.md           # This file
```

## Features

- 📁 Multiple audio input methods (file upload or URL via sample audio)
- 🎛️ Model selection (Nova 3)
- 📊 Metadata display (duration, word count, etc.)
- ⏳ Loading states and error handling
- 📱 Responsive three-column layout with history sidebar
- 🎨 Built with Deepgram design system components
- 💾 Local history tracking with localStorage

## Deepgram Design System

This app uses the `@deepgram/styles` workspace library, which provides a comprehensive set of CSS components built with Tailwind CSS. All class names are prefixed with `dg-` for consistency.

Key components used:

- `dg-hero` - Hero section with gradient title
- `dg-section` - Content sections with modifiers
- `dg-btn` - Buttons with variants (primary, ghost, etc.)
- `dg-form-field` - Form inputs and labels
- `dg-drag-drop-zone` - File upload area
- `dg-card` - Content cards
- `dg-code-block` - Code/JSON display

## License

MIT © Deepgram

## Support

For support, visit [developers.deepgram.com](https://developers.deepgram.com) or join our [Discord community](https://discord.gg/deepgram).
