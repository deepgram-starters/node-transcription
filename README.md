# Node Transcription Starter

Speech-to-text demo using Deepgram's API with Node.js backend and web frontend.

## Prerequisites

- [Deepgram API Key](https://console.deepgram.com/signup?jump=keys) (sign up for free)
- Node.js 18+ and pnpm

## Quick Start

1. **Install dependencies**

```bash
pnpm install
cd frontend && pnpm install && cd ..
```

2. **Set your API key**

Create a `.env` file:

```bash
DEEPGRAM_API_KEY=your_api_key_here
```

3. **Run the app**

```bash
pnpm start
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- Upload audio files or provide URLs for transcription
- Multiple model options (Nova 3, Nova 2, Base)
- View transcription history
- Responsive web interface

## How It Works

- **Backend** (`server.js`): Node.js/Express server implementing the `/stt/transcribe` endpoint
- **Frontend** (`frontend/`): Vite-powered web UI for audio upload and transcription display
- **API**: Integrates with [Deepgram's Speech-to-Text API](https://developers.deepgram.com/)

## Getting Help

- [Open an issue](https://github.com/deepgram-starters/node-transcription/issues)
- [Join our Discord](https://discord.gg/xWRaCDBtW4)
- [Deepgram Documentation](https://developers.deepgram.com/)

## License

MIT - See [LICENSE](./LICENSE)
