// Game vars
var Module;
var EJS_biosUrl;
var EJS_onGameStart;
var rom = EJS_gameUrl.substr(EJS_gameUrl.lastIndexOf('/')+1)
if (EJS_gameUrl.endsWith('.multizip')) {
  var rom = rom.replace('multizip','zip');
} else if (rom.slice(0, -1).endsWith('disk')) {
  var rom = rom.split('.').shift() + '.chd'
}
// Function vars
var dlProgress = 0;
var afs;
BrowserFS.install(window);
var fs = require('fs');
var retroArchCfg = `
input_menu_toggle_gamepad_combo = 3
system_directory = /home/web_user/retroarch/system/`
var retroArchDir = '/home/web_user/retroarch/'

// Update loading div
function setLoader(name) {
  $('#loading').empty();
  var message = $('<p>').text('Loading ' + name + ': ');
  var progress = $('<span>').attr('id','progress');
  message.append(progress);
  $('#loading').append(message);
};

// File downloads with progress
async function downloadFile(url) {
  var Init = { method:'GET',headers:{'Access-Control-Allow-Origin':'*'},mode:'cors'};
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
  return array;
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
  var frontendData = await downloadFile('data/frontend.zip');
  var mfs = new BrowserFS.FileSystem.MountableFileSystem();
  var memfs = new BrowserFS.FileSystem.InMemory();
  var frontend = new BrowserFS.FileSystem.ZipFS(new Buffer(frontendData));
  console.log('WEBPLAYER: initializing filesystem');
  mfs.mount(retroArchDir + 'userdata', afs);
  mfs.mount(retroArchDir + 'bundle', frontend);
  if (EJS_gameUrl.endsWith('.multizip')) {
    setLoader('Game');
    var gameFile = await downloadFile(EJS_gameUrl);
    var gamefs = new BrowserFS.FileSystem.ZipFS(new Buffer(gameFile));
    mfs.mount(retroArchDir + 'roms', gamefs);
    var dlGame = false;
  } else {
    mfs.mount(retroArchDir + 'roms', memfs);
    var dlGame = true;
  }
  if (EJS_biosUrl) {
    setLoader('Bios');
    var biosFile = await downloadFile(EJS_biosUrl);
    if (EJS_biosUrl.endsWith('.zip')) {
      var biosPackage = new BrowserFS.FileSystem.ZipFS(new Buffer(biosFile));
      mfs.mount(retroArchDir + 'system/', biosPackage);
      BrowserFS.initialize(mfs);
    } else {
      var bios = EJS_biosUrl.substr(EJS_biosUrl.lastIndexOf('/')+1);
      BrowserFS.initialize(mfs);
      fs.mkdirSync(retroArchDir + 'system');
      fs.appendFileSync(retroArchDir + 'system/' + bios, new Buffer(biosFile));
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
    setLoader('Game');
    var romFile = await downloadFile(EJS_gameUrl);
    fs.appendFileSync(retroArchDir + 'roms/' + rom, new Buffer(romFile));
  };
  $('#loading').empty();
  Module['callMain'](Module['arguments']);
  document.getElementById('canvas').focus();
  if (EJS_onGameStart) {
    EJS_onGameStart();
  };
};

// When the browser has loaded everything.
async function run() {
  $(EJS_player).empty().append('<div id="loading"></div><canvas id="canvas" tabindex="1"></canvas><button alt="FullScreen" title="FullScreen" class="full-button" onclick="Module.requestFullscreen(false)">\u26F6</button>');
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
