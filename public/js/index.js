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
// Render in rom data
socket.on('romdata', renderRomData);
// Render in custom metadata page
socket.on('rendermeta', renderMetaPage);
// Render meta JSON
socket.on('rendermetajson', renderMetaJSON);

//// Functions ////
// Grab a json file from the server
function getConfig(file) {
  $('#main').empty();
  $('#main').append('<div class="loader"></div>');
  $('#main').data('name', file);
  socket.emit('getconfig', file);
}

// Grab a json file from the server
function getMeta(file) {
  $('#main').empty();
  $('#main').append('<div class="loader"></div>');
  $('#main').data('name', file);
  socket.emit('getmeta', file);
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

// Render meta page
function renderMeta() {
  socket.emit('rendermeta');
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
  socket.emit('scanroms', [folder, true]);
  $('#modal').toggle(100);
}

// Scan in a roms directory
function newScan(folder) {
  socket.emit('scanroms', [folder, false]);
  $('#modal').toggle(100);
}

// Link metadata for selected rom
function setMeta() {
  var linkHash = $('#gameselection').val();
  var hash = $('#modal').data('hash');
  var dir = $('#main').data('name');
  closeModal();
  $('#main').empty();
  $('#main').append('<div class="loader"></div>');
  socket.emit('usermeta', [hash, linkHash, dir]);
}

// Send output to modal
function modalData(data) {
  $('#modal-content').prepend('<p>' + data + '</p>'); 
}

// Empty modal
function emptyModal() {
  $('#modal-content').empty();
}

// Close modal
function closeModal() {
  emptyModal();
  $('#modal').toggle(100)
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

// Render meta file list
function renderMetaPage(files) {
  $('#main').empty();
  $('#main').append($('#metainfo').html());
  $('#side').empty();
  $('#nav-buttons').empty();
  $.each(files, function(index, file) {
    var file = file.replace('.json','');
    var sideLink = $('<div>').addClass('sideitem hover').attr('onclick', "getMeta('" + file + "')").text(file);
    $('#side').append(sideLink);
  });
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
  $('#modal').toggle(100);
  socket.emit('downloadart', name);
}

// Tell server to download the default file set
function dlDefaultFiles() {
  $('#main').empty();
  $('#main').append('<div class="loader"></div>');
  $('#modal').toggle(100);
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

// Render in a config file
async function renderMetaJSON(meta) {
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
  var json = JSON.stringify(meta, null, 2);
  editor.setValue(json, -1);
}

// Render in roms data
async function renderRom(data) {
  $('#main').empty();
  $('#main').data('unidentified', data[1]);
  $('#main').data('metadata', data[2]);
  $('#side').empty();
  // Render Legend
  let container = $('<div>').addClass('wrapper');
  $('#main').append(container);
  let identified = $('<div>').attr('id','left').append('<h3>Identified Roms:</h3>');
  let unidentified = $('<div>').attr('id','right').append('<h3>Unidentified Roms:</h3>');
  container.append(identified,unidentified);
  // Process buttons
  let folderName = $('#main').data('name');
  let downloadArtButton = $('<button>').addClass('button hover').attr('onclick', 'downloadArt(\'' + folderName + '\');').text('Download All Available Art');
  $('#side').append($('<p>').text('Step 1:'));
  $('#side').append(downloadArtButton);
  let configButton = $('<button>').addClass('button hover').attr('onclick', 'addToConfig(\'' + folderName + '\');').text('Add All Roms to Config');
  $('#side').append($('<p>').text('Step 2:'));
  $('#side').append(configButton);
  $('#side').append($('<p>').text('Optional:'));
  let noArtButton = $('<button>').addClass('button hover').attr('onclick', 'purgeNoArt(\'' + folderName + '\');').text('Remove Roms with No Art');
  $('#side').append(noArtButton);
  let newScanButton = $('<button>').addClass('button hover').attr('onclick', 'newScan(\'' + folderName + '\');').text('Scan for New Items');
  $('#side').append(newScanButton);
  // Render items
  for await (var idItem of Object.keys(data[0])) {
    if (data[0][idItem].has_art == true) {
      var color = 'green';
    } else if (data[0][idItem].has_art == false) {
      var color = 'red';
    } else if (data[0][idItem].has_art == 'none') {
      var color = 'gray';
    };
    var item = $('<div>').addClass('itemwrapper').css('background-color', color).html($('<p>').addClass('item').text(idItem)).attr('onclick', 'romMenu(\'' + idItem.replaceAll("'","|") + '\')');
    identified.append(item)
  };
  for await (var noIdItem of Object.keys(data[1])) {
    var item = $('<div>').addClass('itemwrapper').css('background-color', 'gray').html($('<p>').addClass('item').text(noIdItem)).attr('onclick', 'romMenu(\'' + noIdItem.replaceAll("'","|") + '\')');
    unidentified.append(item)
  };
}

// Render rom menu modal
function romMenu(cleanName) {
  let dir = $('#main').data('name');
  name = cleanName.replaceAll("|","'");
  $('#modal').data('name', name);
  emptyModal();
  $('#modal-content').append('<div class="loader"></div>');
  $('#modal').toggle(100);
  socket.emit('getromdata', [dir, name]);
}

// Render rom data we get
async function renderRomData(data) {
  $('#modal').data('hash', data.hash);
  let metaVars = ['back','corner','logo','vid'];
  let dir = $('#main').data('name');
  let basePath = 'frontend/user/';
  emptyModal();
  previewFrame = $('<iframe>').attr({src: 'frontend/index.html#preview', id: 'preview-iframe'});
  $('#modal-content').append(previewFrame);
  let manage = $('<div>').attr('id', 'rom-manage');
  let fileLink = $('<a>').attr('href', basePath + dir + '/roms/' + data.file).text(data.file);
  let fileName = $('<p>').text('Rom File: ').append(fileLink);
  manage.append(fileName);
  if (data.metadata.hasOwnProperty('name')) {
    let name = $('<p>').text('Meta Name: ' + data.metadata.name);
    manage.append(name);
  } else {
    let name = $('<p>').text('Meta Name: Unidentified or NA');
    manage.append(name);
  }
  let hash = $('<p>').text('Scanned Hash: ' + data.hash);
  manage.append(hash);
  for await (let asset of metaVars) {
    if (data[asset]) {
      let link = $('<a>').attr('href', basePath + data[asset]).text(data[asset]);
      let text = $('<p>').text(asset + ': ').append(link);
      manage.append(text);
    } else {
      let text = $('<p>').text(asset + ': Default or not found');
      manage.append(text);
    }
  }
  if (data.metadata.hasOwnProperty('video_position')) {
    var vidPos = data.metadata.video_position;
  } else {
    var vidPos = '';
  }
  if (data.vid) {
    let vidInput = $('<p>').text('Video Position: ');
    let posInput = $('<input>').attr({id: 'vidPos', type: 'text', value: vidPos});
    let posButton = $('<button>').addClass('button hover').text('Update').attr('onclick', 'updateVidPos()');
    vidInput.append(posInput,posButton);
    manage.append(vidInput);
  }
  let buttonWrapper = $('<div>').attr('id', 'manage-buttons');
  if (data.metadata) {
    for await (let upload of metaVars) {
      let uploadButton = $('<button>').addClass('manage-button').text('Upload ' + upload);
      uploadButton.attr('onclick',"$('#" + upload + "').trigger('click')");
      let uploadInput = $('<input>').addClass('hidden').attr({id: upload, type: 'file', onchange: 'upload(this)'});
      buttonWrapper.append(uploadButton,uploadInput);
    }
    let unIdentifyButton = $('<button>').addClass('manage-button').text('Purge Art/Metadata');
    buttonWrapper.append(unIdentifyButton.attr('onclick','unIdentify(false)'));
  } else {
    let identifyButton = $('<button>').addClass('manage-button').text('Identify Rom');
    buttonWrapper.append(identifyButton.attr('onclick','identify()'));
  }
  let deleteButton = $('<button>').addClass('manage-button').text('Delete Everything');
  buttonWrapper.append(deleteButton.attr('onclick','unIdentify(true)'));
  manage.append(buttonWrapper);
  $('#modal-content').append(manage);
}

// Prompt user to identify rom
async function identify() {
  let file = $('#modal').data('name');
  $('#rom-manage').empty();
  $('#rom-manage').append('<p>Identify: ' + file + '</p>');
  var metaData = $('#main').data('metadata');
  var options = [];
  for await (sha of Object.keys(metaData)) {
    if (metaData[sha].hasOwnProperty('name')) {
      options.push({'sha': sha, 'name': metaData[sha].name});
    }
  };

  var sel = $('<select>').attr('id', 'gameselection');

  // Bump an exact match on the filename to the top of the list
  var mostLikely = options.filter(opt => file.startsWith(opt.name))
  for await (var option of mostLikely) {
    sel.append($("<option>").attr('value',option.sha).text(option.name));
  }

  var sorted = options.sort((a,b) => (a.name > b.name) ? 1 : -1)
  for await (var option of sorted) {
    sel.append($("<option>").attr('value',option.sha).text(option.name));
  };
  $('#rom-manage').append(sel);
  var setMetaButton = $('<button>').addClass('button hover').attr('onclick', 'setMeta()').text('Link Item');
  $('#rom-manage').append(setMetaButton);
  $('#rom-manage').append($('<h3>').text('Rom not found?:'));
  let idInput = $('<p>').text('Custom Rom: ');
  let nameInput = $('<input>').attr({id: 'customName', type: 'text', placeholder: 'Enter a custom name'});
  let idButton = $('<button>').addClass('button hover').text('Identify').attr('onclick', 'setCustomMeta()');
  idInput.append(nameInput,idButton);
  $('#rom-manage').append(idInput);
}

// Remove identified roms link if it exists
function unIdentify(purge) {
  let hash = $('#modal').data('hash');
  let dir = $('#main').data('name');
  let file = $('#modal').data('name');
  closeModal();
  $('#main').empty();
  $('#main').append('<div class="loader"></div>');
  socket.emit('removemeta', [hash, dir, file, purge]); 
}

// Set custom metadata for a rom
function setCustomMeta() {
  let hash = $('#modal').data('hash');
  let dir = $('#main').data('name');
  let name = $('#customName').val();
  closeModal();
  $('#main').empty();
  $('#main').append('<div class="loader"></div>');
  socket.emit('custommeta', [hash, dir, name]);
}

// Handle art uploads
async function upload(input) {
  let fileType = $(input).attr('id');
  let dir = $('#main').data('name');
  let file = $('#modal').data('name');
  let hash = $('#modal').data('hash');
  if (input.files && input.files[0]) {
    emptyModal();
    $('#modal-content').append('<div class="loader"></div>');
    let reader = new FileReader();
    reader.onload = async function(e) {
      if (e.total < 100000000) {
        let data = e.target.result;
        socket.emit('uploadart', [fileType, dir, file, hash, data]);
      } else {
        emptyModal();
        $('#modal-content').append($('<h2>').text('File too big'));
        await new Promise(resolve => setTimeout(resolve, 2000));
        socket.emit('getromdata', [dir, name]);
      }
    }
    reader.readAsArrayBuffer(input.files[0]);
  }
}

// Handle request to change video position
function updateVidPos() {
  let dir = $('#main').data('name');
  let file = $('#modal').data('name');
  let hash = $('#modal').data('hash');
  let position = $('#vidPos').val();
  emptyModal();
  $('#modal-content').append('<div class="loader"></div>');
  socket.emit('updatevidposition', [dir, file, hash, position]);
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

