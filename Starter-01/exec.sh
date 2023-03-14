#!/usr/bin/env bash
docker build -t deepgram-javascript-01-basic .
docker run --init -p 3000:3000 -p 3001:3001 -it deepgram-javascript-01-basic