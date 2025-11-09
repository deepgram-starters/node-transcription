# Node Transcription Starter

Speech-to-text demo using Deepgram's API with Node.js backend and web frontend.

## Prerequisites

- [Deepgram API Key](https://console.deepgram.com/signup?jump=keys) (sign up for free)
- Node.js 18+ and pnpm

## Quick Start

1. **Install dependencies**

```bash
pnpm install
```

This automatically installs both backend and frontend dependencies.

2. **Set your API key**

Create a `.env` file:

```bash
DEEPGRAM_API_KEY=your_api_key_here
```

3. **Run the app**

**Development mode** (with hot reload):

```bash
pnpm dev
```

**Production mode** (build and serve):

```bash
pnpm build
pnpm start
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- Upload audio files or provide URLs for transcription
- Multiple model options (Nova 3, Nova 2, Base)
- View transcription history
- Responsive web interface

## Scripts

- `pnpm install` - Install backend and frontend dependencies
- `pnpm dev` - Run in development mode with hot reload
- `pnpm build` - Build frontend for production
- `pnpm start` - Start production server (serves built frontend)

## How It Works

- **Backend** (`server.js`): Node.js/Express server implementing the `/stt/transcribe` endpoint
- **Frontend** (`frontend/`): Vite-powered web UI for audio upload and transcription display
- **API**: Integrates with [Deepgram's Speech-to-Text API](https://developers.deepgram.com/)

## Customization

This starter is designed to be forked and modified for your needs. See the [Backend Architecture Guide](./docs/Backend-Architecture.md) for:

- Detailed code walkthrough and explanations
- How to add Deepgram features (diarization, sentiment, etc.)
- Common customization examples
- Adding new API endpoints
- Testing strategies

Quick customizations:
- **Change model**: Edit `DEFAULT_MODEL` in `server.js`
- **Add features**: Modify `transcribeAudio()` function
- **Change response format**: Edit `formatTranscriptionResponse()`
- **Add authentication**: Add middleware before routes

## Getting Help

- [Open an issue](https://github.com/deepgram-starters/node-transcription/issues)
- [Join our Discord](https://discord.gg/xWRaCDBtW4)
- [Deepgram Documentation](https://developers.deepgram.com/)

## License

MIT - See [LICENSE](./LICENSE)
