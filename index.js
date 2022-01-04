// NPM modules
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
var ipfs = create();

// Default vars
var baseUrl = process.env.SUBFOLDER || '/';
if (fs.existsSync('/data')) { 
  var dataRoot = '/data/';
} else {
  var dataRoot = __dirname + '/frontend/user/'
};
var configPath = dataRoot + 'config/';
var hashPath = dataRoot + 'hashes/';
var defaultPeer = '/ip4/206.189.169.226/tcp/4001/p2p/12D3KooWHRqeK6as7tbuoaQdoTUNayUQzfY5aUtTa9GpYzdWNPqU';
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
  {'name': 'nds', 'video_position': 'left:11.5vw;top:30vh;width:35vw;height:46vh;'},
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
io = socketIO(http, {path: baseUrl + 'socket.io'});
io.on('connection', async function (socket) {
  //// Functions ////
  // Send config list to client
  async function renderConfigs() {
    var files = await fsw.readdir(configPath);
    socket.emit('renderconfigs', files);
  };
  // Send rom directories to client
  async function renderRomsDir() {
    if (fs.existsSync(hashPath)) {
      var dirs = await fsw.readdir(hashPath);
      socket.emit('renderromsdir', dirs);
    } else {
      socket.emit('renderromsdir', []);
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
    var file = file + '.json';
    var fileContents = await fsw.readFile(configPath + file, 'utf8');
    socket.emit('renderconfig', JSON.parse(fileContents));
  };
  // Save sent config file
  async function saveConfig(data) {
    var fileName = data.name + '.json';
    configFile = JSON.stringify(data.config, null, 2);
    await fsw.writeFile(configPath + fileName, configFile);
  };
  // Organize rom data to send to client
  async function getRoms(dir) {
    var metaData = await fsw.readFile('./metadata/' + dir + '.json', 'utf8');
    var metaData = JSON.parse(metaData);
    if (fs.existsSync(dataRoot + 'metadata/' + dir + '.json')) {
      var userMetaData = await fsw.readFile(dataRoot + 'metadata/' + dir + '.json', 'utf8');
      var userMetaData = JSON.parse(userMetaData);
      Object.assign(metaData, userMetaData);
    };
    var shaPath = hashPath + dir + '/roms/';
    var files = await fsw.readdir(shaPath);
    var identified = {};
    var unidentified = {};
    var metaVars = [];
    metaVars.push(...metaVariables);
    metaVars.push(['video_position', 'videos', '.position']);
    for (var file of files) {
      var fileName = file.replace('.sha1','');
      var fileExtension = path.extname(fileName);
      var name = path.basename(fileName, fileExtension);
      var sha = await fsw.readFile(shaPath + file, 'utf8');
      if (metaData.hasOwnProperty(sha)) {
        if (metaData[sha].hasOwnProperty('ref')) {
          var sha = metaData[sha].ref;
        };
        identified[fileName] = {'has_art': 'none'};
	for await (var variable of metaVars) {
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
    var nameList = {};
    socket.emit('renderrom', [identified, unidentified, metaData]);
  }
  // IPFS downloading
  async function ipfsDownload(cid, file, count) {
    count++
    await fsw.mkdir(path.dirname(file), { recursive: true });
    let writeStream = fs.createWriteStream(file);
    socket.emit('modaldata', 'Downloading: ' + file);
    try {
      for await (var fileStream of ipfs.cat(cid, {'timeout': 10000})) {
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
  function scanRoms(folder) {
    socket.emit('emptymodal');
    var scanProcess = spawn('./has_files.sh', ['/' + folder + '/roms/', folder]);
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
      renderRoms();
    });
  };
  // Add roms to config file
  async function addToConfig(dir, render) {
    // For arcade roms we need clone info
    if (dir == 'arcade') { 
      var metaData = await fsw.readFile('./metadata/' + dir + '.json', 'utf8');
      var metaData = JSON.parse(metaData);
    };
    // Update config file with current rom files
    var configFile = configPath + dir + '.json';
    var shaPath = hashPath + dir + '/roms/';
    var files = await fsw.readdir(shaPath);
    var config = await fsw.readFile(configFile, 'utf8');
    var config = JSON.parse(config);
    config.items = {};
    if (files.length < 9) {
      var itemsLength = files.length;
    } else {
      var itemsLength = 9;
    };
    config.display_items = itemsLength;
    for await (var file of files) {
      var fileName = file.replace('.sha1','');
      var fileExtension = path.extname(fileName);
      var name = path.basename(fileName, fileExtension);
      var has_logo = fs.existsSync(dataRoot + dir + '/logos/' + name + '.png');
      var has_back = fs.existsSync(dataRoot + dir + '/backgrounds/' + name + '.png');
      var has_corner = fs.existsSync(dataRoot + dir + '/corners/' + name + '.png');
      var has_video = fs.existsSync(dataRoot + dir + '/videos/' + name + '.mp4');
      var positionFile = dataRoot + dir + '/videos/' + name + '.position';
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
        var video_position = await fsw.readFile(positionFile, 'utf8');
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
      if ((video_position) && (video_position !== config.defaults.video_position)) {
        Object.assign(config.items[name], {'video_position': video_position});
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
    var metaData = await fsw.readFile('./metadata/' + dir + '.json', 'utf8');
    var metaData = JSON.parse(metaData);
    if (fs.existsSync(dataRoot + 'metadata/' + dir + '.json')) {
      var userMetaData = await fsw.readFile(dataRoot + 'metadata/' + dir + '.json', 'utf8');
      var userMetaData = JSON.parse(userMetaData);
      Object.assign(metaData, userMetaData);
    };
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
        if (metaData[sha].hasOwnProperty('position')) {
          await fsw.writeFile(dataRoot + dir + '/videos/' + name + '.position', metaData[sha].position); 
        };
      };
    };
    socket.emit('modaldata', 'Downloaded All Files');
    getRoms(dir);
  };

  // Set user linked metadata
  async function userMeta(data) {
    await fsw.mkdir(dataRoot + 'metadata', { recursive: true })
    var romSha = data[0];
    var linkSha = data[1];
    var dir = data[2];
    if (fs.existsSync(dataRoot + 'metadata/' + dir + '.json')) {
      var metaData = await fsw.readFile(dataRoot + 'metadata/' + dir + '.json', 'utf8');
      var metaData = JSON.parse(metaData);
    } else {
      var metaData = {};
    };
    var link = {};
    link[romSha] = {'ref': linkSha};
    Object.assign(metaData, link);
    userMetadataFile = JSON.stringify(metaData, null, 2);
    await fsw.writeFile(dataRoot + 'metadata/' + dir + '.json', userMetadataFile);
    getRoms(dir);
  };
  
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

  // Delete rom
  async function deleteRom(data) {
    var fileName = data[0].replace("|","'");
    var dir = data[1];
    var fileExtension = path.extname(fileName);
    var name = path.basename(fileName, fileExtension);
    let metaVars = [];
    metaVars.push(...metaVariables);
    metaVars.push(['video_position', 'videos', '.position']);
    for await (var variable of metaVars) {
      var file = dataRoot + dir + '/' + variable[1] + '/' + name + variable[2];
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      };
    };
    var romFile = dataRoot + dir + '/roms/' + fileName;
    var shaFile = dataRoot + 'hashes/' + dir + '/roms/' + fileName + '.sha1';
    for await (var file of [romFile, shaFile]) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      };
    };
    getRoms(dir);
  };

  // Incoming socket requests
  socket.on('renderconfigs', renderConfigs);
  socket.on('renderroms', renderRoms);
  socket.on('renderromsdir', renderRomsDir);
  socket.on('getconfig', getConfig);
  socket.on('getroms', getRoms);
  socket.on('saveconfig', saveConfig);
  socket.on('dldefaultfiles', dlDefaultFiles);
  socket.on('scanroms', scanRoms);
  socket.on('addtoconfig', addToConfig);
  socket.on('purgenoart', purgeNoArt);
  socket.on('downloadart', downloadArt);
  socket.on('usermeta', userMeta);
  socket.on('renderfiles', renderFiles);
  socket.on('deleterom', deleteRom);
  // Render landing page
  if (fs.existsSync(dataRoot + 'config/main.json')) {
    renderRoms();
  } else {
    renderLanding();
  };
});

// Cloudcmd File browser
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

