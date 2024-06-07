// NPM modules
var home = require('os').homedir();
var socketIO = require('socket.io');
var fs = require('fs');
var fsw = require('fs').promises;
var util = require('util');
var path = require('path');
var cloudcmd = require('cloudcmd');
var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var baserouter = express.Router();
var { spawn } = require('child_process');
var { create } = require('ipfs-http-client');
var crypto = require('crypto');
var ipfs = create();
var merge = require('deepmerge');

// Default vars
if (home == '/data') {
  home = '/config'
}
var baseUrl = process.env.SUBFOLDER || '/';
if (fs.existsSync('/data')) { 
  var dataRoot = '/data/';
} else {
  var dataRoot = __dirname + '/frontend/user/'
};
var configPath = dataRoot + 'config/';
var hashPath = dataRoot + 'hashes/';
var metaPath = dataRoot + 'metadata/';
var defaultPeer = '/ip4/65.109.29.184/tcp/4001/p2p/12D3KooWAQZgCmhRo6V6yzGWTtw57xSRBnTn5kGMqzahFKyt5CW3';
var metaVariables = [
  ['vid', 'videos', '.mp4'],
  ['logo', 'logos', '.png'],
  ['back', 'backgrounds', '.png'],
  ['corner', 'corners', '.png']
];
var emus = [
  {'name': '3do', 'video_position': 'left:11.5vw;top:30vh;width:36.3vw;height:45.5vh;'},
  {'name': 'arcade', 'video_position': 'left:10.3vw;top:30.5vh;width:36.5vw;height:48vh;'},
  {'name': 'atari2600', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'atari5200', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'atari7800', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'colecovision', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'doom', 'video_position': 'left:11.5vw;top:30vh;width:36.3vw;height:45.5vh;'},
  {'name': 'gb', 'video_position': 'left:14.5vw;top:31vh;width:26vw;height:43.5vh;'},
  {'name': 'gba', 'video_position': 'left:13.5vw;top:36vh;width:31.7vw;height:38.3vh;'},
  {'name': 'gbc', 'video_position': 'left:15.5vw;top:31.2vh;width:28vw;height:44.7vh;'},
  {'name': 'jaguar', 'video_position': 'left:11.5vw;top:30vh;width:36.3vw;height:45.5vh;'},
  {'name': 'lynx', 'video_position': 'left:11vw;top:31vh;width:36vw;height:44vh;'},
  {'name': 'msx', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'n64', 'video_position': 'left:11.5vw;top:30vh;width:36.3vw;height:45.5vh;'},
  {'name': 'nds', 'video_position': 'left:23.8vw;top:25.7vh;width:20vw;height:56vh;'},
  {'name': 'nes', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'ngp', 'video_position': 'left:15vw;top:34vh;width:25vw;height:40vh;'},
  {'name': 'odyssey2', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'pce', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'psx', 'video_position': 'left:11.5vw;top:30vh;width:36.3vw;height:45.5vh;'},
  {'name': 'sega32x', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'segaCD', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'segaGG', 'video_position': 'left:12.3vw;top:31.5vh;width:33.4vw;height:43.3vh;'},
  {'name': 'segaMD', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'segaMS', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'segaSaturn', 'video_position': 'left:11.5vw;top:30vh;width:36.3vw;height:45.5vh;'},
  {'name': 'segaSG', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'snes', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'vb', 'video_position': 'left:11.5vw;top:31.5vh;width:36vw;height:43vh;'},
  {'name': 'vectrex', 'video_position': 'left:18vw;top:30vh;width:22vw;height:46vh;'},
  {'name': 'ws', 'video_position': 'left:11.5vw;top:31vh;width:35vw;height:43vh;'}
];
var retroArchCfg = `
input_menu_toggle_gamepad_combo = 3
system_directory = /home/web_user/retroarch/system/`

app.use(function(req, res, next) {
  res.header("Cross-Origin-Embedder-Policy", "require-corp");
  res.header("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

//// Http server ////
baserouter.use('/public', express.static(__dirname + '/public'));
baserouter.use('/frontend', express.static(__dirname + '/frontend'));
baserouter.get("/", function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});
app.use(baseUrl, baserouter);
http.listen(3000);

//// socketIO comms ////
io = socketIO(http, {path: baseUrl + 'socket.io',maxHttpBufferSize: 100000000});
io.on('connection', async function (socket) {
  //// Functions ////
  // Send config list to client
  async function renderConfigs() {
    var files = await fsw.readdir(configPath);
    socket.emit('renderconfigs', files);
  };

  // Send MetaData list to client
  async function renderMeta() {
    await fsw.mkdir(metaPath, { recursive: true });
    var files = await fsw.readdir(metaPath);
    socket.emit('rendermeta', files);
  };

  // Send rom directories to client
  async function renderRomsDir() {
    let dirData = [];
    if (fs.existsSync(hashPath)) {
      let dirs = await fsw.readdir(hashPath);
      for await (let dir of dirs) {
        if (fs.lstatSync(hashPath + dir).isDirectory()) {
          dirData.push(dir);
        }
      }
      socket.emit('renderromsdir', dirData);
    } else {
      socket.emit('renderromsdir', dirData);
    };
  };

  // Tell client to render rom scanners
  async function renderRoms() {
    var romData = {}
    for await (var emu of emus) {
      var romCount = 0;
      var hashCount = 0;
      var romPath = dataRoot + emu.name + '/roms/';
      if (fs.existsSync(hashPath + emu.name)) {
        var hashes = await fsw.readdir(hashPath + emu.name + '/roms/');
        var hashCount = hashes.length;
      };
      if (fs.existsSync(romPath)) {
        var roms = await fsw.readdir(romPath);
        var romCount = roms.length;
      };
      romData[emu.name] = {'roms': romCount,'hashes': hashCount};
    };
    // Grab default files data
    var defaultFiles = await fsw.readFile('./metadata/default_files.json', 'utf8');
    var defaultFiles = JSON.parse(defaultFiles);
    var defaultCount = defaultFiles.length;
    var defaultDlCount = 0;
    for await (var item of defaultFiles) {
      if (fs.existsSync(item.file.replace('/data/', dataRoot))) {
        defaultDlCount++
      };
    };
    romData['default'] = {'available': defaultCount,'downloaded': defaultDlCount};
    renderRomsDir();
    socket.emit('renderromslanding', romData);
  };

  // Tell client to render landing
  function renderLanding() {
    socket.emit('renderlanding');
  };

  // Send file contents to client
  async function getConfig(file) {
    file = file + '.json';
    let fileContents = await fsw.readFile(configPath + file, 'utf8');
    socket.emit('renderconfig', JSON.parse(fileContents));
  };

 // Send meta contents to client
  async function getMetaJSON(file) {
    file = file + '.json';
    let fileContents = await fsw.readFile(metaPath + file, 'utf8');
    socket.emit('rendermetajson', JSON.parse(fileContents));
  };

  // Save sent config file
  async function saveConfig(data) {
    var fileName = data.name + '.json';
    configFile = JSON.stringify(data.config, null, 2);
    await fsw.writeFile(configPath + fileName, configFile);
  };

  // Organize rom data to send to client
  async function getRoms(dir) {
    let metaData = await getMeta(dir);
    let shaPath = hashPath + dir + '/roms/';
    let files = await fsw.readdir(shaPath);
    let identified = {};
    let unidentified = {};
    let metaVars = [];
    metaVars.push(...metaVariables);
    metaVars.push(['video_position', 'videos', '.position']);
    for (var file of files) {
      let fileName = file.replace('.sha1','');
      let fileExtension = path.extname(fileName);
      let name = path.basename(fileName, fileExtension);
      var sha = await fsw.readFile(shaPath + file, 'utf8');
      if (metaData.hasOwnProperty(sha)) {
        if (metaData[sha].hasOwnProperty('ref')) {
          var sha = metaData[sha].ref;
        };
        identified[fileName] = {'has_art': 'none'};
	for await (let variable of metaVars) {
          if (metaData[sha].hasOwnProperty(variable[0])) {
            if (fs.existsSync(dataRoot + dir + '/' + variable[1] + '/' + name + variable[2])) {
              identified[fileName] = {'has_art': true};
            } else {
              identified[fileName] = {'has_art': false};
              break;
            };
          };
        };
      } else {
        unidentified[fileName] = sha;
      };
    };
    socket.emit('renderrom', [identified, unidentified, metaData]);
  }
  // IPFS downloading
  async function ipfsDownload(cid, file, count) {
    count++
    await fsw.mkdir(path.dirname(file), { recursive: true });
    let writeStream = fs.createWriteStream(file);
    socket.emit('modaldata', 'Downloading: ' + file);
    try {
      for await (var fileStream of ipfs.cat(cid, {'timeout': 20000})) {
        writeStream.write(fileStream);
      };
      writeStream.end();
      try {
        await ipfs.pin.add(cid);
      } catch (e) {
        console.log(e);
        return '';
      };
    } catch (e) {
      writeStream.end();
      if (count < 3) {
        ipfsDefaultPeer();
        await ipfsDownload(cid, file, count);
      } else {
        socket.emit('modaldata', 'ERROR Downloading: ' + file);
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
        return '';
      };
    };
    return '';
  };

  // Set default ipfs peer if DL times out
  async function ipfsDefaultPeer() {
    await ipfs.swarm.connect(defaultPeer);
  };

  // Download default files for user directory
  async function dlDefaultFiles() {
    var metaData = await fsw.readFile('./metadata/default_files.json', 'utf8');
    var metaData = JSON.parse(metaData);
    socket.emit('emptymodal');
    for await (var item of metaData) {
      var file = item.file.replace('/data/', dataRoot);
      var cid = item.cid;
      if (cid == 'directory') {
        await fsw.mkdir(file, { recursive: true });
      } else {
        await ipfsDownload(cid, file, 0);
      }
    };
    for await (var dir of emus) {
      var path = dataRoot + 'hashes/' + dir.name + '/roms/';
      if (fs.existsSync(path)) {
        var roms = await fsw.readdir(path);
        if (roms.length > 0) {
          socket.emit('modaldata', 'Processing Config for ' + dir.name);
          await addToConfig(dir.name, true);
        };
      };
    };
    socket.emit('modaldata', 'Downloaded All Files');
    renderRoms();
  };

  // Scan roms directory using helper script
  function scanRoms(data) {
    let folder = data[0];
    let fullScan = data[1];
    socket.emit('emptymodal');
    let scanProcess = spawn('./has_files.sh', ['/' + folder + '/roms/', folder, fullScan]);
    scanProcess.stdout.setEncoding('utf8');
    scanProcess.stderr.setEncoding('utf8');
    scanProcess.stdout.on('data', function(data) {
      socket.emit('modaldata', data);
    });
    scanProcess.stderr.on('data', function(data) {
      socket.emit('modaldata', data);
    });
    scanProcess.on('close', function(code) {
      socket.emit('modaldata', 'Scan exited with code: ' + code);
      if (fullScan) {
        renderRoms();
      } else {
        getRoms(folder);
      }
    });
  };

  // Add roms to config file
  async function addToConfig(dir, render) {
    // For arcade roms we need clone info
    if (dir == 'arcade') { 
      var metaData = await getMeta(dir);
    };
    // Update config file with current rom files
    let configFile = configPath + dir + '.json';
    let shaPath = hashPath + dir + '/roms/';
    let files = await fsw.readdir(shaPath);
    let config = await fsw.readFile(configFile, 'utf8');
    config = JSON.parse(config);
    config.items = {};
    if (files.length < 9) {
      var itemsLength = files.length;
    } else {
      var itemsLength = 9;
    };
    config.display_items = itemsLength;
    for await (let file of files) {
      let fileName = file.replace('.sha1','');
      let fileExtension = path.extname(fileName);
      let name = path.basename(fileName, fileExtension);
      let has_logo = fs.existsSync(dataRoot + dir + '/logos/' + name + '.png');
      let has_back = fs.existsSync(dataRoot + dir + '/backgrounds/' + name + '.png');
      let has_corner = fs.existsSync(dataRoot + dir + '/corners/' + name + '.png');
      let has_video = fs.existsSync(dataRoot + dir + '/videos/' + name + '.mp4');
      let positionFile = dataRoot + dir + '/videos/' + name + '.position';
      config.items[name] = {};
      var multi_disc = 0;
      if (fileExtension == '.disk1') {
        var roms = await fsw.readdir(dataRoot + dir + '/roms/');
        for await (var rom of roms) {
          var romExtension = path.extname(rom);
          var romName = path.basename(rom, romExtension);
          if (romName == name) {
            multi_disc++
          }
        };
      };
      if ((dir == 'arcade') && (metaData.hasOwnProperty(name)) && (metaData[name].hasOwnProperty('cloneof'))) {
        Object.assign(config.items[name], {'cloneof': metaData[name].cloneof});
      };
      if (multi_disc !== config.defaults.multi_disc) {
        Object.assign(config.items[name], {'multi_disc': multi_disc});
      };
      if (fs.existsSync(positionFile)) {
        let video_position = await fsw.readFile(positionFile, 'utf8');
        Object.assign(config.items[name], {'video_position': video_position});
      };
      if (has_logo !== config.defaults.has_logo) {
        Object.assign(config.items[name], {'has_logo': has_logo});
      };
      if (has_back !== config.defaults.has_back) {
        Object.assign(config.items[name], {'has_back': has_back});
      };
      if (has_corner !== config.defaults.has_corner) {
        Object.assign(config.items[name], {'has_corner': has_corner});
      };
      if (has_video !== config.defaults.has_video) {
        Object.assign(config.items[name], {'has_video': has_video});
      };
      if (fileExtension !== config.defaults.rom_extension) {
        Object.assign(config.items[name], {'rom_extension': fileExtension});
      };
    };
    var configContents = JSON.stringify(config, null, 2);
    await fsw.writeFile(configFile, configContents);
    // Update main to include stuff with roms
    var mainFile = configPath + 'main.json';
    var main = await fsw.readFile(mainFile, 'utf8');
    var main = JSON.parse(main);
    main.items = {};
    for await (var emu of emus) {
      var emuPath = dataRoot + 'hashes/' + emu.name + '/roms/';
      if (fs.existsSync(emuPath)) {
        var roms = await fsw.readdir(emuPath);
        if (roms.length > 0) {
          main.items[emu.name] = {'video_position': emu.video_position};
        };
      };
    };
    if (Object.keys(main.items).length < 9) {
      main.display_items = Object.keys(main.items).length;
    } else {
      main.display_items = 9;
    };
    var mainContents = JSON.stringify(main, null, 2);
    await fsw.writeFile(mainFile, mainContents);
    // Render page for user if needed
    if (render) {
      return '';
    } else {
      renderRoms();
    };
  };

  // Remove config items without art
  async function purgeNoArt(dir) {
    var configFile = configPath + dir + '.json';
    var config = await fsw.readFile(configFile, 'utf8');
    var config = JSON.parse(config);
    for await (let item of Object.keys(config.items)) {
      if ((config.items[item].hasOwnProperty('has_logo')) || (config.items[item].hasOwnProperty('has_video'))) {
        if ((config.items[item].has_logo == false) || (config.items[item].has_video == false)) {
          delete config.items[item];
        }
      }
    }
    var configContents = JSON.stringify(config, null, 2);
    await fsw.writeFile(configFile, configContents);
    renderRoms();
  }

  // Download art assets from IPFS
  async function downloadArt(dir) {
    var metaData = await getMeta(dir);
    var shaPath = hashPath + dir + '/roms/';
    var files = await fsw.readdir(shaPath);
    socket.emit('emptymodal');
    for await (var file of files) {
      var fileName = file.replace('.sha1','');
      var fileExtension = path.extname(fileName);
      var name = path.basename(fileName, fileExtension);
      var sha = await fsw.readFile(shaPath + file, 'utf8');
      if (metaData.hasOwnProperty(sha)) {
        if (metaData[sha].hasOwnProperty('ref')) {
          var sha = metaData[sha].ref;
        };
        for await (var variable of metaVariables) {
          if (metaData[sha].hasOwnProperty(variable[0])) {
            await ipfsDownload(metaData[sha][variable[0]], dataRoot + dir + '/' + variable[1] + '/' + name + variable[2], 0) 
          };
        };
        if (metaData[sha].hasOwnProperty('video_position')) {
          await fsw.writeFile(dataRoot + dir + '/videos/' + name + '.position', metaData[sha].video_position); 
        };
      };
    };
    socket.emit('modaldata', 'Downloaded All Files');
    getRoms(dir);
  };

  // Set user linked metadata
  async function userMeta(data) {
    await fsw.mkdir(metaPath, { recursive: true });
    let romSha = data[0];
    let linkSha = data[1];
    let dir = data[2];
    if (fs.existsSync(metaPath + dir + '.json')) {
      var metaData = await fsw.readFile(metaPath + dir + '.json', 'utf8');
      var metaData = JSON.parse(metaData);
    } else {
      var metaData = {};
    };
    let link = {};
    link[romSha] = {'ref': linkSha};
    Object.assign(metaData, link);
    userMetadataFile = JSON.stringify(metaData, null, 2);
    await fsw.writeFile(metaPath + dir + '.json', userMetadataFile);
    getRoms(dir);
  };

  // Remove user linked metadata
  async function removeMeta(data) {
    await fsw.mkdir(metaPath, { recursive: true });
    let romSha = data[0];
    let dir = data[1];
    let file = data[2];
    let purge = data[3];
    let fileExtension = path.extname(file);
    let name = path.basename(file, fileExtension);
    if (fs.existsSync(metaPath + dir + '.json')) {
      var metaData = await fsw.readFile(metaPath + dir + '.json', 'utf8');
      var metaData = JSON.parse(metaData);
    } else {
      var metaData = {};
    };
    if (metaData.hasOwnProperty(romSha)) {
      delete metaData[romSha];
      userMetadataFile = JSON.stringify(metaData, null, 2);
      await fsw.writeFile(metaPath + dir + '.json', userMetadataFile);
    }
    // Delete any downloaded or uploaded art
    for await (let variable of metaVariables) {
      let artFile = dataRoot + dir + '/' + variable[1] + '/' + name + variable[2];
      if (fs.existsSync(artFile)) {
        fs.unlinkSync(artFile); 
      }
    };
    let vidPosFile = dataRoot + dir + '/videos/' + name + '.position';
    if (fs.existsSync(vidPosFile)) {
      fs.unlinkSync(vidPosFile);
    }
    // Delete rom and sha if requested
    if (purge) {
      let romFile = dataRoot + dir + '/roms/' + file;
      let shaFile = dataRoot + 'hashes/' + dir + '/roms/' + file + '.sha1';
      for await (var delFile of [romFile, shaFile]) {
        if (fs.existsSync(delFile)) {
          fs.unlinkSync(delFile);
        }
      }
    }
    // Tell client to render
    getRoms(dir);
  };

  // Get combined metadata
  async function getMeta(dir) {
    let metaDataRaw = await fsw.readFile('./metadata/' + dir + '.json', 'utf8');
    let metaData = JSON.parse(metaDataRaw);
    if (fs.existsSync(metaPath + dir + '.json')) {
      let userMetaDataRaw = await fsw.readFile(metaPath + dir + '.json', 'utf8');
      let userMetaData = JSON.parse(userMetaDataRaw);
      metaData = merge(metaData, userMetaData);
    };
    return metaData;
  }
  
  // Render files page
  async function renderFiles() {
    var dirItems = await fsw.readdir(dataRoot);
    var dirs = [];
    for await (var item of dirItems) {
      if ((fs.lstatSync(dataRoot + item).isDirectory()) && (! /^\..*/.test(item))){
        dirs.push(item);
      };
    };
    socket.emit('renderfiledirs', dirs);
  };

  // Send profile data to client
  async function renderProfiles() {
    let profilesData = await fsw.readFile(home + '/profile/profile.json', 'utf8');
    let profilesJson = JSON.parse(profilesData);
    let profiles = [];
    if (Object.keys(profilesJson).length > 0) { 
      for await (let profile of Object.keys(profilesJson)) {
        profiles.push(profilesJson[profile].username)
      }
    }
    socket.emit('renderprofiles', profiles);
  }

  // Create a blank profile
  async function createProfile(data) {
    let user = data[0];
    let pass = data[1];
    let auth = user + pass;
    // Create hash and store user in profile.json
    let hash = crypto.createHash('sha256').update(auth).digest('hex');
    let profilesData = await fsw.readFile(home + '/profile/profile.json', 'utf8');
    let profilesJson = JSON.parse(profilesData);
    profilesJson[hash] = {username: user};
    profileFile = JSON.stringify(profilesJson, null, 2);
    await fsw.writeFile(home + '/profile/profile.json', profileFile);
    // Make directory for user with default config
    await fsw.mkdir(home + '/profile/' + user);
    await fsw.writeFile(home + '/profile/' + user + '/retroarch.cfg', retroArchCfg);
    // Tell client to render profiles
    let profiles = [];
    for await (let profile of Object.keys(profilesJson)) {
      profiles.push(profilesJson[profile].username)
    }
    socket.emit('renderprofiles', profiles);
  }

  // Delete a profile
  async function deleteProfile(user) {
    let profilesData = await fsw.readFile(home + '/profile/profile.json', 'utf8');
    let profilesJson = JSON.parse(profilesData);
    for await (let profile of Object.keys(profilesJson)) {
      if (profilesJson[profile].username == user) {
        delete profilesJson[profile];
      }
    }
    profileFile = JSON.stringify(profilesJson, null, 2);
    await fsw.writeFile(home + '/profile/profile.json', profileFile);
    if (user !== 'default') {
      await fsw.rm(home + '/profile/' + user, { recursive: true, force: true });
    }
    let profiles = [];
    for await (let profile of Object.keys(profilesJson)) {
      profiles.push(profilesJson[profile].username)
    }
    socket.emit('renderprofiles', profiles);
  }

  // Send individual rom data
  async function getRomData(data) {
    let dir = data[0];
    let file = data[1];
    let fileExtension = path.extname(file);
    let name = path.basename(file, fileExtension);
    // Create the preview json
    let rawConfig = await fsw.readFile(dataRoot + 'config/' + dir + '.json', 'utf8');
    let config = JSON.parse(rawConfig);
    let defaultVidPos = config.defaults.video_position;
    config.display_items = 1;
    config.items = {};
    config.items[name] = {};
    // Assemble metdata for client
    let romData = {};
    romData.file = file;
    let hash = await fsw.readFile(hashPath + dir + '/roms/' + file + '.sha1', 'utf8');
    romData.hash = hash;
    let metaData = await getMeta(dir);
    if (metaData.hasOwnProperty(hash)) {
      if (metaData[hash].hasOwnProperty('ref')) {
        romData.metadata = metaData[metaData[hash].ref];
        if (metaData[hash].hasOwnProperty('name')) {
          romData.metadata.name = metaData[hash].name;
        }
      } else {
        romData.metadata = metaData[hash];
      }
      if (metaData[hash].hasOwnProperty('video_position')) {
        romData.vidpos = true;
        romData.metadata.video_position = metaData[hash].video_position;
        config.items[name].video_position = metaData[hash].video_position;
      } else {
        romData.vidpos = false;
        romData.metadata.video_position = defaultVidPos;
        config.items[name].video_position = defaultVidPos;
      }
    } else {
      romData.metadata = false;
    }
    for await (let variable of metaVariables) {
      if (fs.existsSync(dataRoot + dir + '/' + variable[1] + '/' + name + variable[2])) {
        romData[variable[0]] = dir + '/' + variable[1] + '/' + name + variable[2];
        config.items[name]['has_' + variable[0].replace('vid','video')] = true;
      } else {
        romData[variable[0]] = false;
        config.items[name]['has_' + variable[0].replace('vid','video')] = false;
      }
    }
    // Write the preview config
    await fsw.writeFile(hashPath + 'preview.json', JSON.stringify(config, null, 2));
    // Send data to client
    socket.emit('romdata', romData);
  }

  // Process upload and add to custom user metadata
  async function uploadArt(data) {
    // Parse vars
    let fileType = data[0];
    let dir = data[1];
    let file = data[2];
    let hash = data[3];
    // Upload data to local ipfs node
    let fileData = Buffer.from(data[4]);
    let ipfsRes = await ipfs.add(fileData);
    let cid = ipfsRes.path;
    await ipfs.pin.add(cid);
    // Build and write custom metadata
    if (fs.existsSync(metaPath + dir + '.json')) {
      let rawMetaData = await fsw.readFile(metaPath + dir + '.json', 'utf8');
      var metaData = JSON.parse(rawMetaData);
    } else {
      var metaData = {};
    }
    let metaUpdate = {};
    metaUpdate[hash] = {};
    metaUpdate[hash][fileType] = cid;
    metaData = merge(metaData, metaUpdate);
    await fsw.writeFile(metaPath + dir + '.json', JSON.stringify(metaData, null, 2));
    // Write actual file
    if (fileType == 'vid') {
      var extension = '.mp4';
      var filePath = '/videos/';
    } else if (fileType == 'back') {
      var extension = '.png';
      var filePath = '/backgrounds/';
    } else if (fileType == 'corner') {
      var extension = '.png';
      var filePath = '/corners/';
    } else if (fileType == 'logo') {
      var extension = '.png';
      var filePath = '/logos/';
    }
    let fileExtension = path.extname(file);
    let name = path.basename(file, fileExtension);
    if (! fs.existsSync(dataRoot + dir + filePath)) {
      await fsw.mkdir(dataRoot + dir + filePath);
    }
    await fsw.writeFile(dataRoot + dir + filePath + name + extension, fileData);
    // Render game for client
    getRomData([dir, file]);
  }

  // Update video position metadata for rom
  async function updateVidPosition(data) {
    let dir = data[0];
    let file = data[1];
    let hash = data[2];
    let position = data[3];
    // Build and write custom metadata
    if (fs.existsSync(metaPath + dir + '.json')) {
      let rawMetaData = await fsw.readFile(metaPath + dir + '.json', 'utf8');
      var metaData = JSON.parse(rawMetaData);
    } else {
      var metaData = {};
    }
    let metaUpdate = {};
    metaUpdate[hash] = {};
    metaUpdate[hash].video_position = position;
    metaData = merge(metaData, metaUpdate);
    await fsw.writeFile(metaPath + dir + '.json', JSON.stringify(metaData, null, 2));
    getRomData([dir, file]);
  }

  // Create a custom metadata entry
  async function customMeta(data) {
    await fsw.mkdir(metaPath, { recursive: true });
    let romSha = data[0];
    let dir = data[1];
    let name = data[2];
    if (fs.existsSync(metaPath + dir + '.json')) {
      var metaData = await fsw.readFile(metaPath + dir + '.json', 'utf8');
      var metaData = JSON.parse(metaData);
    } else {
      var metaData = {};
    };
    metaData[romSha] = {};
    metaData[romSha].name = name;
    userMetadataFile = JSON.stringify(metaData, null, 2);
    await fsw.writeFile(metaPath + dir + '.json', userMetadataFile);
    getRoms(dir);
  }

  // Incoming socket requests
  socket.on('renderconfigs', renderConfigs);
  socket.on('renderroms', renderRoms);
  socket.on('renderromsdir', renderRomsDir);
  socket.on('getconfig', getConfig);
  socket.on('getmeta', getMetaJSON);
  socket.on('getroms', getRoms);
  socket.on('saveconfig', saveConfig);
  socket.on('dldefaultfiles', dlDefaultFiles);
  socket.on('scanroms', scanRoms);
  socket.on('addtoconfig', addToConfig);
  socket.on('purgenoart', purgeNoArt);
  socket.on('downloadart', downloadArt);
  socket.on('usermeta', userMeta);
  socket.on('renderfiles', renderFiles);
  socket.on('renderprofiles', renderProfiles);
  socket.on('createprofile', createProfile);
  socket.on('deleteprofile', deleteProfile);
  socket.on('getromdata', getRomData);
  socket.on('uploadart', uploadArt);
  socket.on('updatevidposition', updateVidPosition);
  socket.on('removemeta', removeMeta);
  socket.on('custommeta', customMeta);
  socket.on('rendermeta', renderMeta);
  // Render landing page
  if (fs.existsSync(dataRoot + 'config/main.json')) {
    renderRoms();
  } else {
    renderLanding();
  };
});

// Cloudcmd File browser data
baserouter.use('/files', cloudcmd({
  config: {
    root: dataRoot,
    prefix: baseUrl + 'files',
    terminal: false,
    console: false,
    configDialog: false,
    contact: false,
    auth: false,
    name: 'Files',
    log: false,
    keysPanel: false,
    oneFilePanel: true,
    zip: false
  }
}));

// Cloudcmd File browser profile
baserouter.use('/profile', cloudcmd({
  config: {
    root: home + '/profile',
    prefix: baseUrl + 'profile',
    terminal: false,
    console: false,
    configDialog: false,
    contact: false,
    auth: false,
    name: 'Files',
    log: false,
    keysPanel: false,
    oneFilePanel: true,
    zip: false
  }
}));
