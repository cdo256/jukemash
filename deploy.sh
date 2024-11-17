#!/bin/bash -e
#git pull
processes=$(docker ps -q --filter ancestor=jukemash)
if [[ -n "$processes" ]]; then
	docker stop $processes
fi
DOCKER_BUILDKIT=1 docker build -t jukemash .
docker run -p 443:5000 --env-file .env -t jukemash .
