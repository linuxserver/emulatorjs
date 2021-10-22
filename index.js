// NPM modules
var http = require('http');
var socketIO = require('socket.io');
var fs = require('fs');
var fsw = require('fs').promises;
var util = require('util');
var path = require('path');
var { spawn } = require('child_process');
var { create } = require('ipfs-http-client');
var ipfs = create();

// Default vars
var configPath = '/data/config/';
var hashPath = '/data/hashes/';
var defaultPeer = '/ip4/206.189.169.226/tcp/4001/p2p/12D3KooWHRqeK6as7tbuoaQdoTUNayUQzfY5aUtTa9GpYzdWNPqU';
var metaVariables = [
  ['vid', 'videos', '.mp4'],
  ['logo', 'logos', '.png'],
  ['back', 'backs', '.png'],
  ['corner', 'corners', '.png']
];

//// Http server ////
var main = async function (req, res) {
  if (req.url == '/') {
    var url = '/public/index.html';
  } else {
    var url = req.url;
  }
  try {
    var data = await fsw.readFile(__dirname + url);
    res.writeHead(200);
    res.end(data);
  } catch (err) {
    res.writeHead(404);
    res.end(JSON.stringify(err));
  };
};
var server = http.createServer(main);
server.listen(3000);

//// socketIO comms ////
io = socketIO(server);
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
  function renderRoms() {
    renderRomsDir();
    socket.emit('renderromslanding');
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
    if (fs.existsSync('/data/metadata/' + dir + '.json')) {
      var userMetaData = await fsw.readFile('/data/metadata/' + dir + '.json', 'utf8');
      var userMetaData = JSON.parse(userMetaData);
      Object.assign(metaData, userMetaData);
    };
    var shaPath = hashPath + dir + '/roms/';
    var files = await fsw.readdir(shaPath);
    var identified = {};
    var unidentified = {};
    for (var file of files) {
      var fileName = file.replace('.sha1','');
      var fileExtension = path.extname(fileName);
      var name = path.basename(fileName, fileExtension);
      var sha = await fsw.readFile(shaPath + file, 'utf8');
      if (metaData.hasOwnProperty(sha)) {
        if (metaData[sha].hasOwnProperty('ref')) {
          var sha = metaData[sha].ref;
        };
        identified[name] = {'has_art': 'none'};
        metaVariables.push(['video_position', 'videos', '.position']);
	for await (var variable of metaVariables) {
          if (metaData[sha].hasOwnProperty(variable[0])) {
            if (fs.existsSync('/data/' + dir + '/' + variable[1] + '/' + name + variable[2])) {
              identified[name] = {'has_art': true};
            } else {
              identified[name] = {'has_art': false};
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
      for await (var fileStream of ipfs.cat(cid, {'timeout': 5000})) {
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
    for await (var item of metaData) {
      var file = item.file;
      var cid = item.cid;
      if (cid == 'directory') {
        await fsw.mkdir(file, { recursive: true });
      } else {
        await ipfsDownload(cid, file, 0);
      }
    };
    socket.emit('modaldata', 'Downloaded All Files');
    renderRoms();
  };
  // Scan roms directory using helper script
  function scanRoms(folder) {
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
  async function addToConfig(dir) {
    var configPath = '/data/config/' + dir + '.json';
    var shaPath = hashPath + dir + '/roms/';
    var files = await fsw.readdir(shaPath);
    var config = await fsw.readFile(configPath, 'utf8');
    var config = JSON.parse(config);
    config.items = {};
    for await (var file of files) {
      var fileName = file.replace('.sha1','');
      var fileExtension = path.extname(fileName);
      var name = path.basename(fileName, fileExtension);
      var has_logo = fs.existsSync('/data/' + dir + '/logos/' + name + '.png');
      var has_back = fs.existsSync('/data/' + dir + '/backgrounds/' + name + '.png');
      var has_corner = fs.existsSync('/data/' + dir + '/corners/' + name + '.png');
      var has_video = fs.existsSync('/data/' + dir + '/videos/' + name + '.mp4');
      var positionFile = '/data/' + dir + '/videos/' + name + '.position';
      if (fs.existsSync(positionFile)) {
        var video_position = await fsw.readFile(positionFile, 'utf8');
      };
      config.items[name] = {};
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
        Object.assign(config.items[name], {'extension': fileExtension});
      };
      if ((video_position) && (video_position !== config.defaults.video_position)) {
        Object.assign(config.items[name], {'video_position': video_position});
      };
    };
    configFile = JSON.stringify(config, null, 2);
    await fsw.writeFile(configPath, configFile);
    renderRoms();
  };
  // Download art assets from IPFS
  async function downloadArt(dir) {
    var metaData = await fsw.readFile('./metadata/' + dir + '.json', 'utf8');
    var metaData = JSON.parse(metaData);
    if (fs.existsSync('/data/metadata/' + dir + '.json')) {
      var userMetaData = await fsw.readFile('/data/metadata/' + dir + '.json', 'utf8');
      var userMetaData = JSON.parse(userMetaData);
      Object.assign(metaData, userMetaData);
    };
    var shaPath = hashPath + dir + '/roms/';
    var files = await fsw.readdir(shaPath);
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
            await ipfsDownload(metaData[sha][variable[0]], '/data/' + dir + '/' + variable[1] + '/' + name + variable[2], 0) 
          };
        };
        socket.emit('modaldata', 'Downloaded All Files');
        if (metaData[sha].hasOwnProperty('position')) {
          await fsw.writeFile('/data/' + dir + '/videos/' + name + '.position', metaData[sha].position); 
        };
      };
    };
    getRoms(dir);
  };
  // Set user linked metadata
  async function userMeta(data) {
    await fsw.mkdir('/data/metadata', { recursive: true })
    var romSha = data[0];
    var linkSha = data[1];
    var dir = data[2];
    if (fs.existsSync('/data/metadata/' + dir + '.json')) {
      var metaData = await fsw.readFile('/data/metadata/' + dir + '.json', 'utf8');
      var metaData = JSON.parse(metaData);
    } else {
      var metaData = {};
    };
    var link = {};
    link[romSha] = {'ref': linkSha};
    Object.assign(metaData, link);
    userMetadataFile = JSON.stringify(metaData, null, 2);
    await fsw.writeFile('/data/metadata/' + dir + '.json', userMetadataFile);
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
  socket.on('downloadart', downloadArt);
  socket.on('usermeta', userMeta);
  // Render landing page
  if (fs.existsSync('/data/config/main.json')) {
    renderRoms();
  } else {
    renderLanding();
  };
});
