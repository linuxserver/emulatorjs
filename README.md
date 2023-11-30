# EmulatorJS helper

The purpose of this application is to provide a self hosted solution for people looking to run Retro games in their web browsers. It consists of a backend application for scanning roms and ingesting art assets with a static frontend application for serving those files via any basic webserver. The backend application is more or less a run once deal, when you have finalized the menus how you like them the resulting static files of the frontend no longer require the backend helper.

This idea was born from a single need, I wanted to run retro games on my Xbox which now includes a modern chromium based web browser with Microsoft Edge. Web based emulators are popular online but always ingesting roms from external sources is a pain not to mention prone to being taken down at any time, also their interfaces are never designed around basic controller input making navigation difficult with something like an Xbox controller.

## For Users

We recommend using the docker container located [here](https://github.com/linuxserver/docker-emulatorjs). This will spin up: 

* The nodejs backend used for managing your configuration files and rom art assets.
* An NGINX webserver to serve the static frontend files.
* An IPFS daemon for ingesting decentralized art asset files.

For the most part most things should be point and click, hop into port 3000, click buttons, add roms, hop over to the frontend on port 80, and play.
All navigation should be compatible with the up/down/left/right arrow keys on a keyboard thus working with a standard gamepad.

## For asset creators

The frontend is relatively simple it displays a psuedo wheel (popular with emulation frontends like Hyperspin and Coinops) layering pngs and videos on top of that based on the currently selected menu item. The layout of these items can be seen below:

![layout](https://github.com/linuxserver/emulatorjs/raw/master/docs/layout.png)

All images should be a png and run through pngquant for web optimization IE:

```
pngquant yourimage.png
```

Videos should be mp4 format and compressed pretty heavily to be optimized for web while load quickly in the web interface, IE using ffmpeg: (aac is also acceptable, but I had better results with mp3)

```
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 32 -acodec libmp3lame -qscale:a 7 output.mp4
```

If you wish to participate in improving and expanding the asset collection for games you will need to have a basic understanding of the json in the `metadata` folder of this project. Let's take a look at an example entry in Atari 2600:

```
  "2A9647E27AB27E6CF82B3BF122EDF212FA34AE86": {
    "name": "Halo 2600 (USA) (Unl)",
    "vid": "QmWNCjneSTECeGueXrCMHLrs4qHpvWfV6Lee3y5PQ9UTgN",
    "logo": "QmfVui1hFHNEUPpdGsvfFGFpxdAG2DNHhazDFKfFKRwiEE",
    "back": "QmSXacVTbftY1vsoK9RDJ47Jz2yeJB18td3rtTPmpfTw7D",
    "corner: "QmarPeRQzXTGPY88h744vhgCu1RGJtpV9HyTtjhrQmnQhq",
    "video_position": "left:11.5vw;top:31.5vh;width:36vw;height:43vh;"
  }
```

This metadata entry links to the following files consisting of a full interface rendering: 

https://ipfs.infura.io/ipfs/QmWNCjneSTECeGueXrCMHLrs4qHpvWfV6Lee3y5PQ9UTgN
https://ipfs.infura.io/ipfs/QmfVui1hFHNEUPpdGsvfFGFpxdAG2DNHhazDFKfFKRwiEE
https://ipfs.infura.io/ipfs/QmSXacVTbftY1vsoK9RDJ47Jz2yeJB18td3rtTPmpfTw7D
https://ipfs.infura.io/ipfs/QmarPeRQzXTGPY88h744vhgCu1RGJtpV9HyTtjhrQmnQhq

While the `video_position` variable is used to place the video in the correct location on the screen. In general the only really "needed" art assets are the logo and video. The background, corner, and position entry can all be rendered from the default files for the emulated system in question. If you are making a highly custom screen for a particular game the video position might need to be set to something non default, but it always needs to be in the vh and vw unit format to support any size scaling the end user might have. It is impossible to assume a perfect 1080p or 16:9 aspect ratio on a users web browser. The video is rendered by determining a starting top left corner position with "left:11.5vw" being the distance from the left of the browser window, "top:31.5vh" being the distance from the top of the browser window, and "width:36vw;height:43vh" being the relative size. 

All of the metadata entries are key based off public lists of rom/cd dumps from [https://no-intro.org/](https://no-intro.org/) and [http://redump.org/](http://redump.org/) using the sha1 of the files. This way when a user is scanning in their roms we can easily link them to the correct art assets for the menu entries.

## For websites

The libretro cores that are tested and functional are published as an easy to embed library [here](https://github.com/linuxserver/libretrojs) .

## Developing and testing assets

### Testing assets

If you want to participate in contributing assets to this frontend you will need to test them locally first and know a couple things to get them properly ingested into the P2P ecosystem. 

To test your local pngs and mp4s, first place the files in the system directories for the game in question. We will continue with the example of "Halo 2600 (USA)", the file structure would look like: 

```
/data/atari2600/roms/Halo 2600 (USA).zip
/data/atari2600/backgrounds/Halo 2600 (USA).png
/data/atari2600/logos/Halo 2600 (USA).png
/data/atari2600/corners/Halo 2600 (USA).png
/data/atari2600/videos/Halo 2600 (USA).mp4
```

Then edit the corresponding config file for the system, in this case atari2600:

```
/data/config/atari2600.json
```

And the actual game entry: 

```
{
  "title": "Atari 2600",
  "root": "atari2600",
  "parent": "main",
  "display_items": 1,
  "defaults": {
    "emulator": "libretro-stella2014",
    "bios": "",
    "path": "atari2600",
    "rom_extension": ".zip",
    "video_position": "left:11.5vw;top:31.5vh;width:36vw;height:43vh;",
    "type": "game",
    "has_back": false,
    "has_corner": false,
    "has_logo": true,
    "has_video": true,
    "multi_disc": 0
  },
  "items": {
    "Halo 2600 (USA)": {
      "video_position": "left:11.5vw;top:31.5vh;width:40vw;height:50vh;",
      "has_back": true,
      "has_corner": true
    }
  }
}
```

In this config we are overriding the default video position, but any of the "defaults" entries can be overridden on a per game basis. This is also useful for mixing menus and games in the same interface. 
We are also overriding the back and corner settings to tell the frontend to stop using the "default.png" for the system and pull by the game's name. 

### Pushing assets for network ingestion

So you have the menu entry setup with new art assets locally. In order to push changes to this repository you will first need to get your files into IPFS, probably the easiest way to achieve that is with this bash command: 

```
curl "https://ipfs.infura.io:5001/api/v0/add?pin=true" \
  -X POST -H "Content-Type: multipart/form-data" \
  -F "file=@\"/data/atari2600/backgrounds/Halo 2600 (USA).png\""
```

Which should return something like: 

```
{"Name":"Halo 2600 (USA).png","Hash":"QmSXacVTbftY1vsoK9RDJ47Jz2yeJB18td3rtTPmpfTw7D","Size":"127764"}
```

`QmSXacVTbftY1vsoK9RDJ47Jz2yeJB18td3rtTPmpfTw7D` is the IPFS cid you need to submit as new metadata in the `metadata/atari2600.json` file of this repository for the asset you uploaded. Once added to the metadata this art will be downloaded and config setup just as you do locally for users scanning in their own roms. 

# Development

Simply run `./setup_dev.sh` and use node or nodemon to start the application with `nodemon index.js`.

**You will need a local IPFS node running to use any of the download features of the application**

The application can be accesed at:
* Backend - http://localhost:3000
* Frontend - http://localhost:3000/frontend/index.html

The application is written in jQuery and scanning is backed by a simple bash helper. The idea is to keep it as simple as possible, people will not be spending hours in the backend interface. The frontend is all designed around converting json configs, images, videos, and roms into a useable web based emulator. 
