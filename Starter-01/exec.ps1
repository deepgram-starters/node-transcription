docker build --rm -t deepgram-javascript-01 .
docker run --init -p 8080:8080 -p 8080:8080 -it deepgram-javascript-01
