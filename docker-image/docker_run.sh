#!/bin/bash
set -x

docker kill lighthouse_docker
docker run -d -p 8080:8080 --rm --name lighthouse_docker --cap-add=SYS_ADMIN lighthouse_docker
