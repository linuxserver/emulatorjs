//Default vars
var afs;
BrowserFS.install(window);
var fs = require('fs');
var mfs = new BrowserFS.FileSystem.MountableFileSystem();

// Render file list
async function renderFiles(directory) {
  directory = directory.replace("|","'");
  let directoryClean = directory.replace("'","|");
  if ((directory !== '/') && (directory.endsWith('/'))) {
    directory = directory.slice(0, -1);
  }
  $('#filebrowser').empty();
  $('#filebrowser').data('directory', directory);
  let items = await fs.readdirSync(directory);
  let baseName = directory.split('/').at(-1); 
  let parentFolder = directory.replace(baseName,'');
  let parentLink = $('<div>').addClass('directory').attr('onclick', 'renderFiles(\'' + parentFolder + '\');').text('..');
  if (directory == '/') {
    directory = '';
  }
  $('#filebrowser').append(parentLink);
  if (items.length > 0) {
    for await (let item of items) {
      let itemClean = item.replace("'","|");
      if (fs.lstatSync(directory + '/' + item).isDirectory()) {
        let link = $('<div>').addClass('directory').attr('onclick', 'renderFiles(\'' + directoryClean + '/' + itemClean + '\');').text(item);
        $('#filebrowser').append(link);
      } else {
        let link = $('<div>').addClass('file').attr('onclick', 'downloadFile(\'' + directoryClean + '/' + itemClean + '\');').text(item);
        $('#filebrowser').append(link);
      }
    }
  }
}

// Download file when clicked
async function downloadFile(file) {
  file = file.replace("|","'");
  let fileName = file.split('/').at(-1);
  let data = fs.readFileSync(file);
  let blob = new Blob([data], { type: "application/octetstream" });
  let url = window.URL || window.webkitURL;
  link = url.createObjectURL(blob);
  let a = $("<a />");
  a.attr("download", fileName);
  a.attr("href", link);
  $("body").append(a);
  a[0].click();
  $("body").remove(a);
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
