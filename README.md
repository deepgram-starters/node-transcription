# Node Transcription

Get started using Deepgram's Transcription with this Node demo app

<!-- [**Live Demo \u2192**](#) -->

## Quick Start

Click the button below to fork the repo:

[![Fork on GitHub](https://img.shields.io/badge/Fork_on_GitHub-blue?logo=github)](https://github.com/deepgram-starters/node-transcription/fork)

## Local Development

<!--
### CLI

```bash
dg check
dg install
dg start
```
-->

### Makefile (Recommended)

```bash
make init
cp sample.env .env  # Add your DEEPGRAM_API_KEY
make start
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Node.js & pnpm

```bash
git clone --recurse-submodules https://github.com/deepgram-starters/node-transcription.git
cd node-transcription
pnpm install
cd frontend && pnpm install && cd ..
cp sample.env .env  # Add your DEEPGRAM_API_KEY
```

Start both servers in separate terminals:

```bash
# Terminal 1 - Backend (port 8081)
node server.js

# Terminal 2 - Frontend (port 8080)
cd frontend && corepack pnpm run dev -- --port 8080 --no-open
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## SDK Compatibility Test

Run the deterministic SDK round-trip test with no Deepgram credentials or live
API calls:

```bash
pnpm test:sdk-compat
```

The test starts a local fake Deepgram API and points the starter at it with
`DEEPGRAM_API_BASE_URL`. This value replaces the destination of every
Deepgram SDK request, including the `Authorization` credential derived from
`DEEPGRAM_API_KEY`. Set it only for a trusted self-hosted Deepgram-compatible
endpoint or local test server; leave it unset to use the production Deepgram
API. The override accepts only `http:` and `https:` URLs, but it does not
restrict the host, so do not point it at an untrusted endpoint.

## License

MIT - See [LICENSE](./LICENSE)
