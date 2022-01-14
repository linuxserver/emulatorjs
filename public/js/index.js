var host = window.location.hostname; 
var port = window.location.port;
var protocol = window.location.protocol;
var path = window.location.pathname;
var socket = io(protocol + '//' + host + ':' + port, { path: path + 'socket.io'});

//// Socket recieves ////
// Render config
socket.on('renderconfig', renderConfig);
// Render rom
socket.on('renderrom', renderRom);
// Render configs
socket.on('renderconfigs', renderConfigs);
// Render roms directories
socket.on('renderromsdir', renderRomsDir);
// Render roms scanners
socket.on('renderromslanding', renderRomsLanding);
// Render Landing
socket.on('renderlanding', renderLanding);
// Render modal data
socket.on('modaldata', modalData);
// Empty modal
socket.on('emptymodal', emptyModal);
// Render file directories
socket.on('renderfiledirs', renderFileDirs);
// Render file directories
socket.on('renderprofiles', renderProfiles);

//// Functions ////
// Grab a json file from the server
function getConfig(file) {
  $('#main').empty();
  $('#main').append('<div class="loader"></div>');
  $('#main').data('name', file);
  socket.emit('getconfig', file);
}

// Get list of rom shas to process
function getRomShas(dir) {
  $('#main').empty();
  $('#main').append('<div class="loader"></div>');
  $('#main').data('name', dir);
  socket.emit('getroms', dir);
}

// Render configs page
function renderConfigss() {
  socket.emit('renderconfigs');
}

// Render profiles page
function renderProfile() {
  socket.emit('renderprofiles');
}

// Render roms landing page
async function renderRomsLanding(counts) {
  $('#main').empty();
  var scanRendered = false;
  var cardContainer = $('<div>').addClass('cardcontainer');
  for await (var emu of Object.keys(counts)) {
    if (counts[emu].roms > 0) {
      var card = $('<div>').addClass('card');
      card.append($('<h2>').text(emu));
      card.append($('<p>').text('Roms: ' + counts[emu].roms));
      card.append($('<p>').text('Scanned: ' + counts[emu].hashes));
      var button = $('<button>').addClass('scanbutton hover').attr('onclick', 'scanRoms(\'' + emu + '\');').text('Scan');
      card.append(button);
      $(cardContainer).append(card);
      var scanRendered = true;
    } else if (emu == 'default') {
      var card = $('<div>').addClass('card');
      card.append($('<h2>').text('Default'));
      card.append($('<p>').text('Available: ' + counts[emu].available));
      card.append($('<p>').text('Downloaded: ' + counts[emu].downloaded));
      var button = $('<button>').addClass('scanbutton hover').attr('onclick', 'dlDefaultFiles()').text('DL/Update');
      card.append(button);
      $(cardContainer).append(card);
    };
  };
  if (! scanRendered) {
    var scanWarning = $('<h1>').text('No roms found please add some to continue');
    $(cardContainer).append(scanWarning);
  };
  $('#main').append(cardContainer, $('#rominfo').html());
}

// Render roms page
function renderRoms() {
  socket.emit('renderroms');
}

// Scan in a roms directory
function scanRoms(folder) {
  socket.emit('scanroms', folder);
  $('#modal').modal();
}

// Prompt user to identify rom
async function identifyRom(sha, name) {
  $('#modal').modal();
  $('#modal').empty();
  $('#modal').data('sha', sha.replace("|","'"));
  $('#modal').append('<p>Identify: ' + name.replace("|","'") + '</p>');
  var metaData = $('#main').data('metadata');
  var options = [];
  for await (sha of Object.keys(metaData)) {
    if (metaData[sha].hasOwnProperty('name')) {
      options.push({'sha': sha, 'name': metaData[sha].name});
    }
  };
  var sorted = options.sort(function(a, b){
    const name1 = a.name.toUpperCase();
    const name2 = b.name.toUpperCase();
    let comparison = 0;
    if (name1 > name2) {
        comparison = 1;
    } else if (name1 < name2) {
        comparison = -1;
    }
    return comparison;
  })
  var sel = $('<select>').attr('id', 'gameselection');
  for await (var option of sorted) {
    sel.append($("<option>").attr('value',option.sha).text(option.name));
  };
  $('#modal').append(sel);
  var setMetaButton = $('<button>').addClass('button hover').attr('onclick', 'setMeta()').text('Link Item');
  $('#modal').append(setMetaButton);
}

// Link metadata for selected rom
function setMeta() {
  var foundGameSha = $('#gameselection').val();
  var romSha = $('#modal').data('sha');
  var dir = $('#main').data('name');
  $('#main').empty();
  $('#main').append('<div class="loader"></div>');
  $.modal.close();
  socket.emit('usermeta', [romSha, foundGameSha, dir]);
}

// Send output to modal
function modalData(data) {
  $('#modal').prepend('<p>' + data + '</p>'); 
}

// Empty modal
function emptyModal() {
  $('#modal').empty();
}

// Render config file list
function renderConfigs(files) {
  $('#main').empty();
  $('#side').empty();
  $('#nav-buttons').empty();
  $.each(files, function(index, file) {
    var file = file.replace('.json','');
    var sideLink = $('<div>').addClass('sideitem hover').attr('onclick', "getConfig('" + file + "')").text(file);
    $('#side').append(sideLink);
  });
  $('#main').append($('<h1>').addClass('readme').text('Open a config to edit (main for landing page)'));
}

// Render Roms file list
function renderRomsDir(dirs) {
  $('#side').empty();
  $('#nav-buttons').empty();
  $.each(dirs, function(index, dir) {
    var sideLink = $('<div>').addClass('sideitem hover').attr('onclick', "getRomShas('" + dir + "')").text(dir);
    $('#side').append(sideLink);
  });
}

// Save modified config
async function saveConfig() {
  var name = $('#main').data('name');
  var editor = ace.edit("editor");
  var json = editor.getValue();
  var config = JSON.parse(json);
  socket.emit('saveconfig', {'config': config, 'name': name});
  socket.emit('renderconfigs');
}

// Save romlist to config file
function addToConfig(name) {
  $('#main').empty();
  $('#main').append('<div class="loader"></div>'); 
  socket.emit('addtoconfig', name);
}

// Remove roms with no art from config
function purgeNoArt(name) {
  $('#main').empty();
  $('#main').append('<div class="loader"></div>');
  socket.emit('purgenoart', name);
}

// Download art for all identified roms
function downloadArt(name) {
  $('#main').empty();
  $('#main').append('<div class="loader"></div>');
  $('#modal').modal();
  socket.emit('downloadart', name);
}

// Tell server to download the default file set
function dlDefaultFiles() {
  $('#main').empty();
  $('#main').append('<div class="loader"></div>');
  $('#modal').modal();
  socket.emit('dldefaultfiles');
}

// Render in a config file
async function renderConfig(config) {
  // Save button
  $('#nav-buttons').empty();
  var save = $('<button>').addClass('button hover').attr('onclick', 'saveConfig()').text('Save');
  $('#nav-buttons').append(save);
  // Main edit window
  $('#main').empty();
  $('#main').append($('<div>').attr('id', 'editor'));
  editor = ace.edit('editor');
  editor.setTheme('ace/theme/chrome');
  editor.session.setMode('ace/mode/json');
  editor.$blockScrolling = Infinity;
  editor.setOptions({
    readOnly: false,
  });
  var json = JSON.stringify(config, null, 2);
  editor.setValue(json, -1);
}

// Render in roms data
async function renderRom(data) {
  $('#main').empty();
  $('#main').data('unidentified', data[1]);
  $('#main').data('metadata', data[2]);
  $('#side').empty();
  // Render Legend
  var keys = [['All Art Downloaded', 'green'], ['Art Available for Download', 'red'], ['No Art Available', 'gray']]
  var header = $('<div>').attr('id', 'header');
  for await (var key of keys) {
    var item = $('<div>').css('background-color',key[1]).text(key[0]);
    header.append(item);
  }
  var container = $('<div>').addClass('wrapper');
  container.append(header);
  $('#main').append(container);
  var identified = $('<div>').attr('id','left').append('<p>Identified Roms:</p>');
  var unidentified = $('<div>').attr('id','right').append('<p>Unidentified Roms:</p>');
  container.append(identified,unidentified);
  // Process buttons
  var folderName = $('#main').data('name');
  var downloadArtButton = $('<button>').addClass('button hover').attr('onclick', 'downloadArt(\'' + folderName + '\');').text('Download All Available Art');
  $('#side').append($('<p>').text('Step 1:'));
  $('#side').append(downloadArtButton);
  var configButton = $('<button>').addClass('button hover').attr('onclick', 'addToConfig(\'' + folderName + '\');').text('Add All Roms to Config');
  $('#side').append($('<p>').text('Step 2:'));
  $('#side').append(configButton);
  $('#side').append($('<p>').text('Optional:'));
  var noArtButton = $('<button>').addClass('button hover').attr('onclick', 'purgeNoArt(\'' + folderName + '\');').text('Remove Roms with No Art');
  $('#side').append(noArtButton);
  // Render items
  for await (var idItem of Object.keys(data[0])) {
    if (data[0][idItem].has_art == true) {
      var color = 'green';
    } else if (data[0][idItem].has_art == false) {
      var color = 'red';
    } else if (data[0][idItem].has_art == 'none') {
      var color = 'gray';
    };
    var deleteButton = $('<button>').addClass('rombutton item').attr('onclick', 'deleteRom(\'' + idItem.replace("'","|") + '\')').text('delete');
    var item = $('<div>').addClass('itemwrapper').css('background-color', color).html($('<p>').addClass('item').text(idItem));
    item.append(deleteButton);
    identified.append(item)
  };
  for await (var noIdItem of Object.keys(data[1])) {
    var identifyButton = $('<button>').addClass('identifybutton').attr('onclick', 'identifyRom(\'' + data[1][noIdItem].replace("'","|") + '\',\'' + noIdItem.replace("'","|") + '\');').text('identify');
    var deleteButton = $('<button>').addClass('rombutton item').attr('onclick', 'deleteRom(\'' + noIdItem.replace("'","|") + '\')').text('delete');
    var item = $('<div>').addClass('itemwrapper').html($('<p>').addClass('item').text(noIdItem).append(identifyButton));
    item.append(deleteButton);
    unidentified.append(item)
  };
}

// Render confirm delete rom
function deleteRom(name) {
  $('#modal').modal();
  $('#modal').empty();
  var dir = $('#main').data('name');
  var realName = name.replace("|","'");
  $('#modal').data('delete', [name, dir]);
  var message = $('<p>').text('Really delete ' + realName + ' ?');
  var deletebutton = $('<button>').attr('onclick', 'deleteRomReal()').addClass('button hover').text('delete');
  $('#modal').append(message, deletebutton);
}

// Delete rom
function deleteRomReal(data) {
  socket.emit('deleterom', $('#modal').data('delete'));
  $.modal.close();
}

// Render in landing
function renderLanding() {
  // Clear page
  $('#main').empty();
  $('#side').empty();
  $('#main').append($('#landing').html());
}

// Render file management
function renderFiles() {
  $('#main').empty();
  $('#side').empty();
  $('#main').append('<div class="loader"></div>');
  socket.emit('renderfiles');
}

// Render file directories
function renderFileDirs(dirs) {
  $('#side').empty();
  $('#main').empty();
  $('#main').append($('#filelanding').html());
  $('#nav-buttons').empty();
  $.each(dirs, function(index, dir) {
    var sideLink = $('<div>').addClass('sideitem hover').attr('onclick', "renderFileBrowser('" + dir + "')").text(dir);
    $('#side').append(sideLink);
  });
}

// Tell server to configure a file browser
function renderFileBrowser(dir) {
  $('#main').empty();
  var url = window.location.href;
  if (! url.endsWith('/')) {
    var url = url + '/';
  };
  var browser = $('<iframe>').attr('src', url + 'files/fs/' + dir).addClass('browser');
  $('#main').append(browser);
}

// Render profiles
function renderProfiles(profiles) {
  $('#side').empty();
  $('#main').empty();
  $('#nav-buttons').empty();
  $('#main').append($('<h1>').addClass('readme').text('Choose a Profile or Create one:'));
  let userForm = $('<span>').addClass('readme');
  userForm.append($('<input>').attr({id:'user',type:'text',placeholder:'username'}));
  userForm.append($('<input>').attr({id:'pass',type:'password',placeholder:'password'}));
  userForm.append($('<button>').addClass('button hover').attr('onclick','createProfile()').text('Create Profile'));
  $('#main').append(userForm);
  profiles.push('default');
  profiles.sort();
  $.each(profiles, function(index, profile) {
    var sideLink = $('<div>').addClass('sideitem hover').attr('onclick', "renderUserProfile('" + profile + "')").text(profile);
    $('#side').append(sideLink);
  });
}

// Render a profile
function renderUserProfile(dir) {
  $('#main').empty();
  $('#nav-buttons').empty();
  var url = window.location.href;
  if (! url.endsWith('/')) {
    var url = url + '/';
  };
  var browser = $('<iframe>').attr('src', url + 'profile/fs/' + dir).addClass('browser');
  $('#main').append(browser);
  // Delete Button
  if (dir !== 'default') {
    var deleteButton = $('<button>').addClass('button hover').attr('onclick', 'deleteProfile(\'' + dir + '\')').text('Delete ' + dir);
    $('#nav-buttons').append(deleteButton);
  }
}

// Create a blank profile
function createProfile() {
  let user = $('#user').val();
  let pass = $('#pass').val();
  $('#main').empty();
  $('#side').empty();
  $('#main').append('<div class="loader"></div>');
  socket.emit('createprofile', [user,pass]);
}

// Delete a profile
function deleteProfile(user) {
  $('#main').empty();
  $('#side').empty();
  $('#main').append('<div class="loader"></div>');
  socket.emit('deleteprofile', user);
}

