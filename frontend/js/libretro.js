// Game vars
var Module;
var EJS_biosUrl;
var EJS_onGameStart;
var rom = EJS_gameUrl.substr(EJS_gameUrl.lastIndexOf('/')+1);
if (EJS_gameUrl.endsWith('.multizip')) {
  var rom = rom.replace('multizip','zip');
} else if (rom.slice(0, -1).endsWith('disk')) {
  var rom = rom.split('.').shift() + '.chd'
}
// Function vars
var chunkSize = 10240000;
var dlProgress = 0;
var afs;
BrowserFS.install(window);
var fs = require('fs');
var retroArchCfg = `
input_menu_toggle_gamepad_combo = 3
system_directory = /home/web_user/retroarch/system/`
var retroArchDir = '/home/web_user/retroarch/'
var Init = { method:'GET',headers:{'Access-Control-Allow-Origin':'*'},mode:'cors'};
var headerInit = { method:'HEAD',headers:{'Access-Control-Allow-Origin':'*'},mode:'cors'};

// Update loading div
function setLoader(name) {
  $('#loading').empty();
  var message = $('<p>').text('Loading ' + name + ': ');
  var progress = $('<span>').attr('id','progress');
  message.append(progress);
  $('#loading').append(message);
};

// File downloads with progress
async function downloadFile(url, gameDL) {
  var response = await fetch(url,Init);
  var length = response.headers.get('Content-Length');
  if (!length) {
    return await response.arrayBuffer();
  };
  var array = new Uint8Array(length);
  let at = 0;
  var reader = response.body.getReader();
  for (;;) {
    var {done, value} = await reader.read();
    if (done) {
      break;
    }
    array.set(value, at);
    at += value.length;
    dlProgress = ((at / length).toFixed(2) * 100).toFixed(0);
    $('#progress').text(dlProgress.toString() + '%');
  }
  try {
    return array;
  } finally {
    array = null;
  }
};

// Create IndexDB filestore
async function setupFileSystem() {
  var imfs = new BrowserFS.FileSystem.InMemory();
  afs = new BrowserFS.FileSystem.AsyncMirror(imfs,
    new BrowserFS.FileSystem.IndexedDB(async function(e, fs) {
      afs.initialize(async function(e) {
        console.log('WEBPLAYER: idbfs setup successful');
        setupMounts();
      });
    },
  'RetroArch'));
};

// Download all needed files and setup base filesystem
async function setupMounts() {
  setLoader('Frontend');
  let frontendData = await downloadFile('data/frontend.zip');
  var mfs = new BrowserFS.FileSystem.MountableFileSystem();
  var frontend = new BrowserFS.FileSystem.ZipFS(new Buffer(frontendData));
  console.log('WEBPLAYER: initializing filesystem');
  mfs.mount(retroArchDir + 'userdata', afs);
  mfs.mount(retroArchDir + 'bundle', frontend);
  frontendData = null;
  // Multizip support for MAME titles with chd files
  if (EJS_gameUrl.endsWith('.multizip')) {
    setLoader('Game');
    var gameFile = await downloadFile(EJS_gameUrl);
    var gamefs = new BrowserFS.FileSystem.ZipFS(new Buffer(gameFile));
    mfs.mount(retroArchDir + 'roms', gamefs);
    var dlGame = false;
  } else {
    var dlGame = true;
  }
  if (EJS_biosUrl) {
    setLoader('Bios');
    let biosFile = await downloadFile(EJS_biosUrl);
    if (EJS_biosUrl.endsWith('.zip')) {
      var biosPackage = new BrowserFS.FileSystem.ZipFS(new Buffer(biosFile));
      mfs.mount(retroArchDir + 'system/', biosPackage);
      BrowserFS.initialize(mfs);
      biosFile = null;
    } else {
      var bios = EJS_biosUrl.substr(EJS_biosUrl.lastIndexOf('/')+1);
      BrowserFS.initialize(mfs);
      fs.mkdirSync(retroArchDir + 'system');
      fs.appendFileSync(retroArchDir + 'system/' + bios, new Buffer(biosFile));
      biosFile = null;
    }
  } else {
    BrowserFS.initialize(mfs);
  };
  var BFS = new BrowserFS.EmscriptenFS();
  FS.mount(BFS, {
    root: '/home'
  }, '/home');
  if (! fs.existsSync(retroArchDir + 'userdata/retroarch.cfg')) {
    fs.writeFileSync(retroArchDir + 'userdata/retroarch.cfg', retroArchCfg);
  };
  console.log('WEBPLAYER: filesystem initialization successful');
  downloadGame(dlGame);
}

// Download assets needed for this game
async function downloadGame(dlGame) {
  if (dlGame == true) {
    fs.mkdirSync(retroArchDir + 'roms');
    setLoader('Game');
    // If this is a bin file download the cue as well (multi bin not supported)
    if (rom.split('.').pop() == 'bin') {
      var EJS_gameUrlCue = EJS_gameUrl.split('.').shift() + '.cue';
      var cue = rom.split('.').shift() + '.cue';
      var cueFile = await downloadFile(EJS_gameUrlCue);
      fs.appendFileSync(retroArchDir + 'roms/' + cue, new Buffer(cueFile));
      cueFile = null;
    };
    var headerInit = { method:'HEAD',headers:{'Access-Control-Allow-Origin':'*'},mode:'cors'};
    var response = await fetch(EJS_gameUrl, headerInit);
    var length = response.headers.get('Content-Length');
    if (length > chunkSize) {
      let rangeStart = 0;
      let rangeEnd = chunkSize -1;
      let chunkCount = Math.ceil(length / chunkSize);
      let lengthEnd = length -1;
      for (let i = 0; i < chunkCount; i++) {
        let chunkInit = { method:'GET',headers:{'Access-Control-Allow-Origin':'*', 'Range': 'bytes=' + rangeStart + '-' + rangeEnd},mode:'cors'};
        let response = await fetch(EJS_gameUrl, chunkInit);
        let at = 0;
        let array = await response.arrayBuffer();
        $('#progress').text((i + 1) + '/' + chunkCount);
        let fileChunk = new Buffer(array);
        array = null;
        fs.appendFileSync(retroArchDir + 'roms/' + rom, fileChunk);
        fileChunk = null;
        // Set chunk range for next download
        rangeStart = rangeEnd + 1;
        if ((rangeEnd + chunkSize) > lengthEnd) {
          rangeEnd = lengthEnd;
        } else {
          rangeEnd = rangeEnd + chunkSize;
        };
      };
    } else {
      var romFile = await downloadFile(EJS_gameUrl);
      fs.appendFileSync(retroArchDir + 'roms/' + rom, new Buffer(romFile));
      romFile = null;
    };
  };
  $('#loading').empty();
  // Call main run of emu
  Module['callMain'](Module['arguments']);
  document.getElementById('canvas').focus();
  // Run user scipts
  if (EJS_onGameStart) {
    EJS_onGameStart();
  };
};

// When the browser has loaded everything.
async function run() {
  var rom = EJS_gameUrl.substr(EJS_gameUrl.lastIndexOf('/')+1);
  $(EJS_player).empty().append('<div id="loading"></div><canvas id="canvas" tabindex="1"></canvas><button alt="FullScreen" title="FullScreen" class="full-button" onclick="Module.requestFullscreen(false)">\u26F6</button>');
  if (EJS_gameUrl.endsWith('.multizip')) {
    var rom = rom.replace('multizip','zip');
  } else if (rom.slice(0, -1).endsWith('disk')) {
    var rom = rom.split('.').shift() + '.chd'
  }
  if (rom.split('.').pop() == 'bin') {
    var rom = rom.split('.').shift() + '.cue';
  };
  // Retroarch run logic
  Module = {
    noInitialRun: true,
    arguments: ['-v', retroArchDir + 'roms/' + rom],
    preRun: [],
    postRun: [],
    print: function(text) {
      console.log(text);
    },
    printErr: function(text) {
      console.log(text);
    },
    canvas: document.getElementById('canvas'),
    totalDependencies: 0,
    monitorRunDependencies: function(left) {
      this.totalDependencies = Math.max(this.totalDependencies, left);
    }
  };
  // Load core script
  $.getScript('data/' + EJS_core + '_libretro.js', async function() {
    setupFileSystem();
  });
};

// Keypress event capture
function keyPress(k) {
  kp(k, 'keydown');
  setTimeout(function() {
    kp(k, 'keyup')
  }, 50);
};
kp = function(k, event) {
  var oEvent = new KeyboardEvent(event, {
    code: k
  });
  document.dispatchEvent(oEvent);
  document.getElementById('canvas').focus();
};

run();
