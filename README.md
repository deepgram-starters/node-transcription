# Node Transcription Starter

Speech-to-text demo using Deepgram's API with Node.js backend and web frontend.

## Prerequisites

- [Deepgram API Key](https://console.deepgram.com/signup?jump=keys) (sign up for free)
- Node.js 24+ and pnpm 10+

**Note:** This project uses strict supply chain security measures. npm and yarn will NOT work - pnpm 10.0.0+ is required. See [SECURITY.md](SECURITY.md) for details.

## Quick Start

<!--
**Recommended: Using Deepgram CLI**
```bash
dg check      # Verify prerequisites
dg install    # Initialize and install dependencies
dg start      # Run the application
```
-->

**Using Make**
```bash
make check-prereqs
make init
cp sample.env .env  # Add your DEEPGRAM_API_KEY
make start
```

Open [http://localhost:8080](http://localhost:8080) in your browser

<details>
<summary>Alternative: Manual Setup</summary>

1. **Clone with submodules**
   ```bash
   git clone --recurse-submodules https://github.com/deepgram-starters/node-transcription.git
   cd node-transcription
   ```

2. **Check prerequisites**
   ```bash
   git --version
   node --version  # Requires 24+
   pnpm --version  # Requires 10+
   ```

3. **Initialize submodules**
   ```bash
   git submodule update --init --recursive
   ```

4. **Install dependencies**
   ```bash
   pnpm install
   cd frontend && pnpm install
   ```

5. **Configure environment**
   ```bash
   cp sample.env .env
   # Edit .env and add your DEEPGRAM_API_KEY
   ```

6. **Start servers** (in separate terminals)
   ```bash
   # Terminal 1 - Backend
   pnpm start

   # Terminal 2 - Frontend
   cd frontend && pnpm run dev -- --port 8080
   ```

7. **Open your browser**

   Visit [http://localhost:8080](http://localhost:8080)

</details>

## Features

- Upload audio files or provide URLs for transcription
- Multiple model options
- View transcription history
- Responsive web interface

## Architecture

- **Frontend** runs on port **8080** (user-facing)
- **Backend API** runs on port **8081**
- Frontend makes CORS requests to backend

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

## Available Commands

This project includes a Makefile for framework-agnostic operations:

```bash
make help                # Show all available commands
make check-prereqs       # Check for required tools
make init                # Initialize submodules and install dependencies
make start               # Start application (backend + frontend)
make start-backend       # Start backend only (port 8081)
make start-frontend      # Start frontend only (port 8080)
make update              # Update submodules to latest
make clean               # Remove node_modules and build artifacts
make status              # Show git and submodule status
```

Use `make` commands for a consistent cross-platform experience.

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
