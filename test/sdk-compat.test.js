"use strict";

const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const http = require("node:http");
const { once } = require("node:events");
const { setTimeout: delay } = require("node:timers/promises");

const TEST_API_KEY = "sdk-compat-test-api-key";
const TEST_SESSION_SECRET = "sdk-compat-test-session-secret";
const TEST_AUDIO = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x01, 0x02, 0x03, 0x04]);

function listenResponse(kind) {
  return {
    metadata: {
      duration: kind === "url" ? 1.25 : 2.5,
      model_uuid: `fake-${kind}-model`,
      request_id: `fake-${kind}-request`,
    },
    results: {
      channels: [
        {
          alternatives: [
            {
              transcript: `${kind} transcript`,
              words: [
                {
                  confidence: 0.99,
                  end: 0.5,
                  start: 0,
                  word: kind,
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

function expectedPublicResponse(kind, modelName) {
  return {
    duration: kind === "url" ? 1.25 : 2.5,
    metadata: {
      model_name: modelName,
      model_uuid: `fake-${kind}-model`,
      request_id: `fake-${kind}-request`,
    },
    transcript: `${kind} transcript`,
    words: [
      {
        confidence: 0.99,
        end: 0.5,
        start: 0,
        word: kind,
      },
    ],
  };
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function startFakeDeepgram() {
  const requests = [];
  const server = http.createServer(async (request, response) => {
    const body = await readBody(request);
    const requestUrl = new URL(request.url, "http://127.0.0.1");
    const contentType = request.headers["content-type"];
    const kind = contentType === "application/json" ? "url" : "file";

    requests.push({
      body,
      headers: request.headers,
      method: request.method,
      url: requestUrl,
    });

    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(listenResponse(kind)));
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();

  return { requests, server, url: `http://127.0.0.1:${port}` };
}

function startStarter(port, deepgramApiBaseUrl) {
  const environment = {
    ...process.env,
    DEEPGRAM_API_BASE_URL: deepgramApiBaseUrl,
    DEEPGRAM_API_KEY: TEST_API_KEY,
    HOST: "127.0.0.1",
    PORT: String(port),
    SESSION_SECRET: TEST_SESSION_SECRET,
  };
  delete environment.DEEPGRAM_ACCESS_TOKEN;

  const child = spawn(process.execPath, ["--no-deprecation", "server.js"], {
    cwd: process.cwd(),
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output = [];
  child.stdout.on("data", (chunk) => output.push(chunk));
  child.stderr.on("data", (chunk) => output.push(chunk));

  return { child, output };
}

async function waitForStarter(url, child, output) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(
        `Starter exited before becoming ready:\n${Buffer.concat(output).toString()}`
      );
    }

    try {
      const response = await fetch(`${url}/api/session`, {
        signal: AbortSignal.timeout(250),
      });
      if (response.ok) {
        return response;
      }
    } catch {
      // The child process may not have bound its port yet.
    }

    await delay(100);
  }

  throw new Error(
    `Starter did not become ready:\n${Buffer.concat(output).toString()}`
  );
}

async function closeServer(server) {
  const closed = new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  server.closeAllConnections();
  await Promise.race([closed, delay(2_000)]);
  server.unref();
}

async function stopStarter(child) {
  if (child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), delay(2_000)]);
  if (child.exitCode === null) {
    child.kill("SIGKILL");
    await Promise.race([once(child, "exit"), delay(2_000)]);
  }
  child.stdout.destroy();
  child.stderr.destroy();
  child.unref();
}

function assertSdkRequest(request, expectedModel, expectedBody, expectedContentType) {
  assert.equal(request.method, "POST");
  assert.equal(request.url.pathname, "/v1/listen");
  assert.equal(request.url.search, `?model=${expectedModel}`);
  assert.equal(request.headers.authorization, `Token ${TEST_API_KEY}`);
  assert.equal(request.headers["content-type"], expectedContentType);
  assert.deepEqual(request.body, expectedBody);
}

async function run() {
  let fakeDeepgram;
  let child;

  try {
    fakeDeepgram = await startFakeDeepgram();
    const starterPort = await new Promise((resolve, reject) => {
      const server = http.createServer();
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        const { port } = server.address();
        server.close((error) => (error ? reject(error) : resolve(port)));
      });
    });
    const starterUrl = `http://127.0.0.1:${starterPort}`;
    const starter = startStarter(starterPort, fakeDeepgram.url);
    child = starter.child;
    const { output } = starter;

    const sessionResponse = await waitForStarter(starterUrl, child, output);
    const { token } = await sessionResponse.json();
    assert.equal(typeof token, "string");

    const authorization = { authorization: `Bearer ${token}` };
    const urlForm = new FormData();
    urlForm.set("model", "nova-2");
    urlForm.set("url", "https://example.test/source.wav");
    const urlResponse = await fetch(`${starterUrl}/api/transcription`, {
      body: urlForm,
      headers: authorization,
      method: "POST",
      signal: AbortSignal.timeout(5_000),
    });
    assert.equal(urlResponse.status, 200);
    assert.deepEqual(await urlResponse.json(), expectedPublicResponse("url", "nova-2"));

    const fileForm = new FormData();
    fileForm.set(
      "file",
      new Blob([TEST_AUDIO], { type: "audio/wav" }),
      "fixture.wav"
    );
    const fileResponse = await fetch(`${starterUrl}/api/transcription`, {
      body: fileForm,
      headers: authorization,
      method: "POST",
      signal: AbortSignal.timeout(5_000),
    });
    assert.equal(fileResponse.status, 200);
    assert.deepEqual(
      await fileResponse.json(),
      expectedPublicResponse("file", "nova-3")
    );

    assert.equal(fakeDeepgram.requests.length, 2);
    const [urlRequest, fileRequest] = fakeDeepgram.requests;
    assertSdkRequest(
      urlRequest,
      "nova-2",
      Buffer.from(JSON.stringify({ url: "https://example.test/source.wav" })),
      "application/json"
    );
    assertSdkRequest(fileRequest, "nova-3", TEST_AUDIO, "audio/wav");
  } finally {
    if (child) {
      await stopStarter(child);
    }
    if (fakeDeepgram) {
      await closeServer(fakeDeepgram.server);
    }
  }
}

run()
  .then(() => console.log("SDK compatibility test passed"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
