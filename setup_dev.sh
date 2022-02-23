#! /bin/bash

IFS=$'\n'
rootdir=$(pwd)
# Install modules
npm install
## Grab frontend blobs
# EmulatorJS
curl -o \
  /tmp/emulatorjs-blob.tar.gz -L \
  "https://github.com/thelamer/emulatorjs/archive/main.tar.gz"
tar xf \
  /tmp/emulatorjs-blob.tar.gz -C \
  frontend/ --strip-components=1
# Custom cores
curl -o \
  /tmp/custom-cores.tar.gz -L \
  "https://github.com/linuxserver/libretro-cores/archive/master.tar.gz" && \
tar xf \
  /tmp/custom-cores.tar.gz -C \
  frontend/ --strip-components=1
rm frontend/README.md
# Default folders
if [ ! -e 'fontend/user' ]; then
  if [ -d '/data' ]; then
    ln -s /data frontend/user
  else
    mkdir -p frontend/user
  fi
fi
