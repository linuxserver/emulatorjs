#! /bin/bash

# Working emulators for retroarch
retroarchemus="\
fceumm
snes9x
mednafen_vb
gearboy
vba_next
genesis_plus_gx
handy
mednafen_ngp
mednafen_pce_fast
mednafen_wswan
o2em
prboom
vecx
bluemsx"
IFS=$'\n'
rootdir=$(pwd)
# Install modules
npm install
## Grab frontend blobs
# EmulatorJS
curl -o \
  /tmp/emulatorjs-blob.tar.gz -L \
  "https://github.com/ethanaobrien/emulatorjs/archive/main.tar.gz"
tar xf \
  /tmp/emulatorjs-blob.tar.gz -C \
  frontend/ --strip-components=1
# Libretro emscripten
mkdir retrotmp
cd retrotmp
wget https://buildbot.libretro.com/nightly/emscripten/RetroArch.7z
7z x RetroArch.7z
sed -i 's/wasmBinaryFile="/wasmBinaryFile="data\//g' retroarch/*.js
for emu in $retroarchemus; do
  mv retroarch/${emu}_libretro.* "${rootdir}/frontend/data/"
done
cd retroarch/assets/frontend/bundle/
zip -r frontend.zip  assets/xmb/monochrome assets/ozone shaders filters info autoconfig overlay assets/menu_widgets
mv frontend.zip "${rootdir}/frontend/data/"
cd "${rootdir}"
rm -Rf retrotmp
# Default folders
if [ ! -e 'fontend/user' ]; then
  if [ -d '/data' ]; then
    ln -s /data frontend/user
  else
    mkdir -p frontend/user
  fi
fi
