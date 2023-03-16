# Deepgram Node.js Starter

This sample demonstrates interacting with the Deepgram API from Node.js. It uses the Deepgram Node SDK, and has a React companion application to interact with the Node integration.

## Sign-up to Deepgram

Before you start, it's essential to generate a Deepgram API key to use in this project. [Sign-up now for Deepgram](https://console.deepgram.com/signup).

## Quickstart

### Manual

Follow these steps to get started with this starter application.

#### Clone the repository

Go to GitHub and [clone the repository](https://github.com/deepgram-starters/deepgram-javascript-starter).

#### Install depedencies

Install the project dependencies.

```bash
npm install
```

#### Edit the config file

Copy `config.json.example` to `config.json` and give it the API key you generate in the [Deepgram console](https://console.deepgram.com/).

```json
{
  "dgKey": "api_key"
}
```

#### Run the application

The `dev` script will run a web and API server concurrently. Once running, you can [access the application in your browser](http://localhost:3000/).

```bash
npm run dev
```

### Docker

Follow these steps to run the application with docker.

#### Useful binary files

You can run the binary `exec.sh` for Mac or Linux, and `exec.ps1` for Windows.

#### Dockerfile

To use the `Dockerfile` to run the application with docker, run the build and run commands as required.

Build the docker image.

```sh
docker build -t deepgram-javascript-01 .
```

Run the docker image.

```sh
docker run --init -p 3000:3000 -p 3001:3001 -it deepgram-javascript-01
```
