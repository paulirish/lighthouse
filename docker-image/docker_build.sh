#!/bin/bash

# Build for Headless Chrome.
# docker build -t lighthouse_docker . --build-arg CACHEBUST=$(date +%d)

# Build for non-headless Chrome version.
docker build -f Dockerfile -t lighthouse_docker .
