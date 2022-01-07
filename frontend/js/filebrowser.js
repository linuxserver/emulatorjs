//Default vars
var afs;
BrowserFS.install(window);
var fs = require('fs');
var mfs = new BrowserFS.FileSystem.MountableFileSystem();

// Render file list
async function renderFiles(directory) {
  $('#filebrowser').empty();
  $('#filebrowser').data('directory', directory);
  let items = await fs.readdirSync(directory);
  if (items.length > 0) {
    for await (let item of items) {
      let link = $('<div>').addClass('directory').attr('onclick', 'renderFiles(\'' + item + '\');').text(item);
      $('#filebrowser').append(link);
    }
  }
}


// Create IndexDB filestore
async function setupFileSystem() {
  var imfs = new BrowserFS.FileSystem.InMemory();
  afs = new BrowserFS.FileSystem.AsyncMirror(imfs,
    new BrowserFS.FileSystem.IndexedDB(async function(e, fs) {
      afs.initialize(async function(e) {
        console.log('IndexedDB setup successful');
        setupMounts();
      });
    },
  'RetroArch'));
};

// Setup mounts
async function setupMounts() {
  mfs.mount('/', afs);
  BrowserFS.initialize(mfs);
  renderFiles('/');
}

// On page load
window.onload = function() {
  setupFileSystem();
}
