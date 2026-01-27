# Node Transcription Starter

Speech-to-text demo using Deepgram's API with Node.js backend and web frontend.

## Prerequisites

- [Deepgram API Key](https://console.deepgram.com/signup?jump=keys) (sign up for free)
- Node.js 24+ and pnpm 10+

**Note:** This project uses strict supply chain security measures. npm and yarn will NOT work - pnpm 10.0.0+ is required. See [SECURITY.md](SECURITY.md) for details.

## Quick Start

1. **Clone the repository**

Clone the repository with submodules (the frontend is a shared submodule):

```bash
git clone --recurse-submodules https://github.com/deepgram-starters/node-transcription.git
cd node-transcription
```

2. **Install dependencies**

```bash
# Option 1: Use the helper script (recommended)
pnpm run install:all

# Option 2: Manual two-step install
pnpm install
cd frontend && pnpm install && cd ..
```

**Note:** Due to security settings (`ignore-scripts=true`), frontend dependencies must be installed separately. The `install:all` script handles both steps. See [SECURITY.md](SECURITY.md) for details.

3. **Set your API key**

Create a `.env` file:

```bash
DEEPGRAM_API_KEY=your_api_key_here
```

4. **Run the app**

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
- Multiple model options
- View transcription history
- Responsive web interface

## How It Works

- **Backend** (`server.js`): Node.js/Express server implementing the `/stt/transcribe` endpoint
- **Frontend** (`frontend/`): Vite-powered web UI for audio upload and transcription display
- **API**: Integrates with [Deepgram's Speech-to-Text API](https://developers.deepgram.com/)

## Security

This project implements comprehensive supply chain security measures including:
- Dependency pinning to exact versions
- Automated vulnerability scanning with Snyk
- Disabled lifecycle scripts
- Strict package manager enforcement (pnpm only)

See [SECURITY.md](SECURITY.md) for complete security documentation and reporting procedures.

## Contributing

Contributions are welcome! Please review:
- [Contributing Guidelines](CONTRIBUTING.md) - includes pnpm setup requirements
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md) - required for dependency updates

## Getting Help

- [Open an issue](https://github.com/deepgram-starters/node-transcription/issues)
- [Join our Discord](https://discord.gg/xWRaCDBtW4)
- [Deepgram Documentation](https://developers.deepgram.com/)

## License

MIT - See [LICENSE](./LICENSE)
