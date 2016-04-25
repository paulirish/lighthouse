#!/usr/bin/env bash

project_root=$PWD

# setup our testing server
cd test/fixtures && python -m SimpleHTTPServer 9999 &

# browserify lighthouse core for the extension
cd extension && gulp browserify
if [ $? -eq 1 ]; then
  echo "Fail! Browserify failed"
  exit 1
fi
cd "$project_root"

# test a boring page with no service worker
node cli http://localhost:9999/online-only.html > smoke-results

if ! grep -q "URL responds with a 200 when offline: false" smoke-results; then
  echo "Fail! online only site worked while offline"
  cat results
  exit 1
fi

# if run with --fast then we skip the second test
if [[ $@ == *'fast'* ]]; then
	exit 0
fi

# test a real offline-enabled app
sleep 1s
node cli https://www.moji-brush.com > smoke-results

if ! grep -q "URL responds with a 200 when offline: true" smoke-results; then
  echo "Fail! offline ready site did not work while offline"
  cat results
  exit 1
fi
