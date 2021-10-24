#! /bin/bash

# Install modules
npm install
# Grab frontend blobs
curl -o \
  /tmp/emulatorjs-blob.tar.gz -L \
  "https://github.com/ethanaobrien/emulatorjs/archive/main.tar.gz"
tar xf \
  /tmp/emulatorjs-blob.tar.gz -C \
  frontend/ --strip-components=1
# Default folders
if [ -d '/data' ]; then
  ln -s /data frontend/user
else
  mkdir -p frontend/user
fi
