#!/usr/bin/env bash
docker build -t deepgram-javascript-01 .
docker run --init -p 8080:8080 -p 8081:8081 -it deepgram-javascript-01