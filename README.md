# EmulatorJS All-in-One

This project [linuxserver/emulatorjs](https://github.com/linuxserver/emulatorjs) is not affiliated with [EmulatorJS/EmulatorJS](https://github.com/EmulatorJS/EmulatorJS). This is an All-in-One solution for a web based game server, and the other project is focused on making highly customizable, embedded emulators and code to be included in custom websites.

<br />
<br />

## Table of Contents [(top)](#emulatorjs-all-in-one)
* [Project Goals](#project-goals-top)
* [Features](#features-top)
* [Getting Started](#getting-started-top)
  * [Server Installation](#server-installation-top)
  * [Server Setup](#server-setup-top)
    * [Linux](#linux)
    * [Docker](#docker)
  * [Client Setup](#client-setup-top)
    * [Windows](#windows)
    * [Android/iOS](#androidios)
    * [Steam Deck](#steam-deck)
* [Changelog/Releases](https://github.com/linuxserver/emulatorjs/releases)
* [Contribute](#contribute-top)
  * [For asset creators](#for-asset-creators-top)
    * [Testing assets](#testing-assets-top)
    * [Pushing assets for network ingestion](#pushing-assets-for-network-ingestion-top)
  * [Development](#development-top)
    * [Building](#building)
    * [For Websites](#for-websites-top)

<br />
<br />

## Project Goals [(top)](#emulatorjs-all-in-one)
The purpose of this application is to provide a self hosted solution for people looking to run Retro games in their web browsers. It consists of a backend application for scanning roms and ingesting art assets with a static frontend application for serving those files via any basic webserver. The backend application is more or less a run once deal, when you have finalized the menus how you like them the resulting static files of the frontend no longer require the backend helper.

This idea was born from a single need: I wanted to run retro games on my Xbox which now includes a modern chromium based web browser with Microsoft Edge. Web based emulators are popular online but always ingesting roms from external sources is a pain, not to mention its prone to being taken down at any time, also their interfaces are never designed around basic controller input making navigation difficult with something like an Xbox controller.

**It is important to note that the current emulator used for this frontend is obfuscated code. Efforts are being made to [reverese engineer it](https://github.com/ethanaobrien/emulatorjs/) but you should know that it can potentially reach out to third party services if you manually enable features like netplay (this should never happen in a stock setup). We are in the process to transitioning to libretro cores for emulators, currently 27/30 emulators have been replaced.**

<br />
<br />

## Features [(top)](#emulatorjs-all-in-one)
EmulatorJS has been developed by gamers for gamers. As such, we know what we want. Have a look at our features and feel free to submit further feature requests [here](https://github.com/linuxserver/emulatorjs/issues) and title it "Feature Request: ".

<br />

### User Features
* User Accounts
  * After the admin creates a username and password, an individual can login and have their own persistent configs & save data which could be downloaded from the website & uploaded to a different computer, or have the option to push your save directly to the server and pull it down again after logging in to another computer.
* Drag-&-Drop saves right onto the running emulator to load from where you left off.

<br />

#### File Browser
The file browser can be accessed via the folder icon on the top left corner of the play screen. Clicking on it, the player has the option to login to their profile and pull their profile from the server and pickup where they left off in their save files, or push their latest saves to the server.

Here, we are also given the option to download or upload a full backup of our profile to take on the go.

Lastly, we have "Backup to IPFS". (wip) This is a decentralized storage system.

<br />

### Admin Features
* Rom Management:
  * Able to scan games and scrape their information from online soucres.
* Media Managemment:
  * Uses the scraped ROM data to download artwork and videos for each console and ROM added.
* Config Management:
  * Edit the config file for each system including defining what emulator to use.
* File Management:
  * Download and upload files remotely
* Profile Management:
  * Add or delete users/profiles
* Custom Metadata:
  * When you identify roms or upload custom artwork from the rom management interface, all of that data is stored as custom metadata in your server. Any uploaded custom art assets are added to the local IPFS server running in this the EmulatorJS server. To share this data with the world, you will need to forward port 4001 to a public IP address.

<br />
<br />

## Getting Started [(top)](#emulatorjs-all-in-one)

### TL;DR
We recommend using the docker container located [here](https://github.com/linuxserver/docker-emulatorjs). This will spin up: 

* The nodejs backend used for managing your configuration files and rom art assets.
* An NGINX webserver to serve the static frontend files.
* An IPFS daemon for ingesting decentralized art asset files.

For the most part most things should be point and click, hop into port 3000, click buttons, add roms, hop over to the frontend on port 80, and play.
All navigation should be compatible with the [up/down/left/right] arrow keys on a keyboard, [Z,X,A,S] for [A,B,X,Y], [enter] for "Start" and [right shift] for "Select", thus working with a standard gamepad.

<br />
<br />

### Server Installation [(top)](#emulatorjs-all-in-one)

#### Linux

WIP (executable bash script coming soon)

<br />

#### Docker

Follow the instructions on the [linuxserver/docker-emulatorjs](https://github.com/linuxserver/docker-emulatorjs) page for the docker CLI or docker-compose deployment, then access the admin page at (http://[YOUR-SERVER-IP]:3000)

NOTE: Do NOT link the data folder to a folder on your OS hard drive (aka C:/ drive). EmulatorJS will auto-download without checking for remaining hard drive space and could potentially lock-up your computer.

NOTE: Port 4001 is for the IPFS server for decentralized saves & sharing of your uploaded game metadata/art work. This will need to be port forwarded through your router, but optional.

<br />

### Server Setup [(top)](#emulatorjs-all-in-one)

After the server is installed, its time to finish getting it setup:
1) Access your "data" folder which was mapped to something like "D:\Games\emulatorjs-library"
2) Inside that folder, you should have 35+ folders which are labeled according to each emulated system as well as the following:
* ".ipfs" folder which is your local IPFS server storage
* "config" folder to hold the json config file for each of your systems
* "hashes" folder to hold the hash files for each of your roms
* "main" folder to hold the pics and videos for the consoles
3) Copy and paste your roms into the "roms" folder of its system (always keep an extra copy of your roms)
4) Access the admin page in the browser (example: "http://192.168.1.120:3000/")

These next few steps are to identify your roms, download their pics/videos and update the frontend's config file:
1) Download the initial files (pics/videos for each of the consoles)
2) When it says "finished" close the popup window. The server should have automatically scanned and counted how many roms you have in each system folder.
3) Click "Scan" on one system at a time. It will try to identify each game and then it will give you a system button on the left hand side.
4) For our example, lets say you scanned some n64 games in. Click the "n64" system button on the left hand side.
5) Identified roms will show in green, unidentified roms will show on the right side under the "unidentified" section. Here you can click each one and manually link it to a game from that console.
* If a game is in the "identified" section but still grey, that means the rom was scanned correctly, but there is no media for it yet.
* The "scan" works by reading the hash (fingerprint) of your rom and matching it to the online database. Since there can be multiple roms from different people making backups, there can be different hashes for the same game. This is where the IPFS system comes into play. If you uploaded media for that game to your server, it will then get copied out to anyone else who has a matching hash/rom and doesn't yet have any art/videos yet.
6) After all the art is downloaded, move on to "step 2" and click "Add all roms to config" which will then update the front end and show the consoles and games you just added.
* Note: Only consoles that have at least one game will show up on the front end.

Repeat steps 3 - 6 for each system/console you've added games to, then get to gaming!

<br />

### Client Setup [(top)](#emulatorjs-all-in-one)
Because this software uses WebAssembly (WASM) applications, it can be ran within a modern browser so there is no installation necessary.
Only Safari for Apple devices and Chromium based browsers (Google Chrome, Edge, Brave, etc.) are supported. Other browsers might work, but have not been tested and likely never will be. Gamepads do not function on Firefox (yet!).

To make things a little more seamless, we can create a shortcut file to act as a launcher.

#### Windows
In this example, we will use Google Chrome:
1) Right click on Chrome and click "Send to" then "Desktop (create shortcut)"
2) Now right click on the new shortcut and in the "Target" field, add this to the end:
```
 --kiosk "http://192.168.1.120:8080/"
```
(example: "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --kiosk "http://192.168.1.120:8080/")
3) Lastly, rename the shortcut to "EmulatorJS"

To exit 'Kiosk' mode, hit ctrl+W

#### Android/iOS
1) Open your browser and go to the server ip address (example: http://192.168.1.120:8080/)
2) After EmulatorJS has loaded in, open your browser settings and click "Add to Home Screen" or something similar.
3) Click through any other prompts that may come up, but you should be left with a shortcut on your phone's home screen that acts like an app.

#### Steam Deck
The process is similar as that of the Windows setup
1) Enter Desktop mode
2) Right click on Chrome and add to Steam
3) Right click on the Chrome shortcut in Steam and click "Properties"
4) Under the "Shortcut" options, find the "Launch Options" text box.
5) Add this to the end:
```
--kiosk "http://192.168.1.120:8080/"
```
(example: run --branch=stable --arch=x86_64 --command=/app/bin/chrome --file-forwarding com.google.Chrome @@u @@ --window-size=1024,640 --force-device-scale-factor=1.25 --device-scale-factor=1.25 --kiosk "http://192.168.1.120:8080/")

<br />
<br />

# Contribute [(top)](#emulatorjs-all-in-one)

There are several ways to contribue to this project including:
* [Creating assets](#for-asset-creators-top) like logos, backgrounds and video media for roms
* Help out with [open issues](https://github.com/linuxserver/emulatorjs/issues)
* Updating the repository documentation as features/changes are made
* Contribute over at [libretro](https://retroarch.com/index.php?page=donate) since they are doing the heavy lifting with developing the emulator cores

## For asset creators [(top)](#emulatorjs-all-in-one)

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

<br />
<br />

### Testing assets [(top)](#emulatorjs-all-in-one)

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

<br />
<br />

### Pushing assets for network ingestion [(top)](#emulatorjs-all-in-one)

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

<br />
<br />

# Development [(top)](#emulatorjs-all-in-one)

This project's primary deployment focus is on the [docker container](https://github.com/linuxserver/docker-emulatorjs).
As shown in its 'Dockerfile', it pulls the frontend files from [linuxserver/emulatorjs](https://github.com/linuxserver/emulatorjs) and pulls the emulator blobs from [linuxserver/libretro-cores](https://github.com/linuxserver/libretro-cores) & [thelamer/emulatorjs](https://github.com/thelamer/emulatorjs) which is forked from [EmulatorJS/EmulatorJS](https://github.com/EmulatorJS/EmulatorJS)

<br />

## Building

Once built and hosted via NodeJS, the application can be accesed at:
* Backend - http://localhost:3000
* Frontend - http://localhost:3000/frontend/index.html

<br />

Requirements:
* NodeJS

[Install](https://github.com/nodesource/distributions/blob/master/README.md) with:
```sh
curl -fsSL https://deb.nodesource.com/setup_19.x | sudo -E bash - &&\
sudo apt-get install -y nodejs &&\
npm install socket.io
```

For linux builders, run "`./setup_dev.sh`" to download cores and setup folders, then use node or nodemon (npm) to start the application with "`nodemon index.js`".
* Note: If the "`setup_dev.sh`" file doesn't seem to work, it could be because of some windows/linux confusion regarding line endings. Open it with vim and use `:set ff=unix` to set the file format back to unix, and then `:wq` to save and exit the file.

Alternatively, run:
```sh
npm start
```

<br />

For windows builders, use the build in WSL (Windows Subsystem for Linux) feature to install a headless version of Ubuntu that can then build the program. The "index.js" file is coded with a linux file system syntax and wont work on windows.

Open Windows PowerShell with admin rights and execute the following:
```sh
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```
Restart your computer and then just run this to launch ubuntu insde PowerShell:
```sh
wsl
```
Note: its home directory will be linked to your Windows user home directory (ex: C:\Users\[your-home-directory]) so it's suggested to have your github projects there and accessible to both operating systems.
If this is your first run with WSL, you will need to run the next few lines then install NodeJS as mentioned above:
```sh
sudo apt update
sudo apt upgrade
sudo apt install npm
```

If you keep getting build errors, try refreshing your nodemon install with this:
```sh
npm cache clean --force && rm -rf node_modules package-lock.json && npm install && npm start
```
Note: This takes some time to delete the "node_modules" folder and then reinstall npm

**You will need a local IPFS node running to use any of the download features of the application**

The application is written in jQuery and scanning is backed by a simple bash helper. The idea is to keep it as simple as possible. People will not be spending hours in the backend interface. The frontend is all designed around converting json configs, images, videos, and roms into a useable web based emulator.

<br />

## For websites [(top)](#emulatorjs-all-in-one)

The libretro cores that are tested and functional are published as an easy to embed library [here](https://github.com/linuxserver/libretrojs) .