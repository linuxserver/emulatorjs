//// Default vars ////
var Init = { method:'GET',headers:{'Access-Control-Allow-Origin':'*'},mode:'cors'};
var defaultKeys = [
  'emulator',
  'bios',
  'path',
  'rom_extension',
  'video_position',
  'type',
  'has_back',
  'has_corner',
  'has_logo',
  'has_video'
];

//// Helper functions ////
// Debounce calls to functions that run heavy
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};
// Load and play video
var loadvideo = debounce(function(active_item) {
//function loadvideo(active_item) {
  var name = $('#i' + active_item.toString()).data('name');
  var has_video = $('#i' + active_item.toString()).data('has_video');
  if (has_video) {
    var video_position = $('#i' + active_item.toString()).data('video_position');
    var video_path = 'user/' + $('#i' + active_item.toString()).data('path') + '/videos/';
    var video_src = video_path + name + '.mp4';
    // Set video position
    $('#bgvid').attr('style', 'position:fixed;object-fit:fill;' + video_position);
    // Stop old video if exists and load new
    var oldvid = $('#vid').attr('src');
    if (typeof oldvid !== 'undefined' && oldvid !== false) {
      $('#bgvid').trigger('pause');
    }
    $('#vid').attr('src', video_src);
    $('#bgvid').trigger('load');
    $('#bgvid').trigger('play');
  } else {
    $('#vid').attr('src', '');
    $('#bgvid').trigger('load');
  }
}, 200);
// Apply background art
var loadart = debounce(function(active_item) {
  var name = $('#i' + active_item.toString()).data('name');
  var has_back = $('#i' + active_item.toString()).data('has_back');
  var has_corner = $('#i' + active_item.toString()).data('has_corner');
  var back_name = name;
  var corner_name = name;
  if (has_back !== true) {
    var back_name = 'default';
  };
  if (has_corner !== true) {
    var corner_name = 'default';
  };
  var path = 'user/' + $('#i' + active_item.toString()).data('path') + '/';
  var back_src = path + 'backgrounds/' + back_name + '.png'
  var corner_src = path + 'corners/' + corner_name + '.png'
  $('#background').attr("src", back_src);
  $('#corner').attr("src", corner_src);
}, 200);
// Load logo list
function loadlogos(logo_load_start, display_items, items_length, active_item) {
  for (var i = 0; i < display_items; i++) {
    // Negative numbers
    if (logo_load_start < 0) {
      item_num = logo_load_start + items_length + 1;
    // Positive numbers
    } else {
      if (logo_load_start > items_length){
        item_num = logo_load_start - items_length - 1;
      } else {
        item_num = logo_load_start;
      };
    };
    var has_logo = $('#i' + item_num.toString()).data('has_logo');
    var name = $('#i' + item_num.toString()).data('name');
    if (has_logo) {
      var path = 'user/' + $('#i' + item_num.toString()).data('path') + '/logos/';
      var logo_src = path + name + '.png';
      $($('#i' + item_num.toString()).children()[0]).prop('src',logo_src);
      $('#active' + i).empty();
      $('#active' + i).append($('#m' + item_num).html());
    } else {
      $('#active' + i).empty();
      $('#active' + i).append($('#m' + item_num).html());
    }
    logo_load_start++
  };
};
// Launcher
function launch(active_item) {
  var name = $('#i' + active_item.toString()).data('name');
  var type = $('#i' + active_item.toString()).data('type');
  $(document).attr('title', name);
  if (type == 'menu') {
    window.location.href = '#' + name
    window.location.reload();
  } else if (type == 'game') {
    window.location.href = '#game';
    $(document).off('keydown');
    var emulator = $('#i' + active_item.toString()).data('emulator');
    var path =  $('#i' + active_item.toString()).data('path');
    var rom_path = 'user/' + path + '/roms/';
    var rom_extension = $('#i' + active_item.toString()).data('rom_extension');
    var bios = 'user/' + path + '/bios/' + $('#i' + active_item.toString()).data('bios');
    $('#menu').css('visibility', 'hidden');
    $('#menu').empty();
    $('#game').css('visibility', 'visible');
    if (bios !== 'user/' + path + '/bios/') {
      EJS_biosUrl = bios;
    }
    EJS_player = '#game';
    EJS_gameUrl = rom_path + name + rom_extension;
    EJS_core = emulator;
    EJS_pathtodata = 'data/';
    EJS_onGameStart = function() {
      document.querySelectorAll('[data-btn="fullscreen"]')[0].click();
    }
    var loaderscript = document.createElement('script');
    loaderscript.src = 'data/loader.js';
    document.head.append(loaderscript);
    var clickplay = setInterval(() => {
      if (typeof document.getElementsByClassName('ejs--73f9b4e94a7a1fe74e11107d5ab2ef')[0] !== 'undefined') {
        clearInterval(clickplay);
        document.getElementsByClassName('ejs--73f9b4e94a7a1fe74e11107d5ab2ef')[0].click();
      }
    }, 100);
    // Reload window if user clicks back
    $(window).on('hashchange', function() {
      if (window.location.hash !== '#game') {
        window.location.reload();
      }
    });
  }
}

//// Page rendering logic ////
async function rendermenu(data, active_item) {
  var root = data.root;
  var parent = data.parent;
  var items = data.items;
  var items_length = Object.keys(items).length - 1;
  // Determine counts and style based on menu items
  var display_items = data.display_items;
  if (typeof active_item == 'undefined'){
    var active_item = Math.floor(display_items/2);
  };
  var logo_load_start = active_item - Math.floor(display_items/2);
  var image_height = Math.floor(100/display_items).toString() + 'vh';
  // Set default hash
  window.location.href = '#' + root + '---' + active_item
  // Render zoom effect on active item
  function highlight(active_item) {
    $('#h' + active_item).addClass('grow')
  }
  // Set page title
  $(document).attr('title', data.title);
  // Empty any existing
  $('#games-list').empty();
  $('#active-list').empty();
  // Loop items loaded from json to build the game menu divs
  var count = 0;
  for await (var name of Object.keys(items)) {
    var item = data.items[name];
    // Use text or image tag based on logo
    if (item.hasOwnProperty('has_logo')) {
      var has_logo = item.has_logo;
    } else {
      var has_logo = data.defaults.has_logo;
    };
    if (has_logo == true) {
      logo_html = '<img class="menu-img">';
    } else {
      logo_html = '<p class="menu-img">' + name + '</p>';
    };
    // Set varibles to default if not set in item
    var jsdata = '';
    jsdata += 'data-name="' + name + '" ';
    for await (var key of defaultKeys) {
      if (item.hasOwnProperty(key)) {
        jsdata += 'data-' + key + '="' + item[key] + '" ';
      } else {
        jsdata += 'data-' + key + '="' + data.defaults[key] + '" ';
      };
    };
    $('#games-list').append('\
      <div id="m' + count + '">\
        <div id="h' + count + '" class="menu-wrap shrink">\
          <a onclick="launch(\'' + count + '\')" id="i' + count + '" ' + jsdata + '>\
            ' + logo_html + '\
          </a>\
        </div>\
      </div>');
    count++
  }; 
  // Render active list
  for await (var active_num of [...Array(display_items).keys()]) {
    $('#active-list').append('<div id="active' + active_num + '" class="menu-div"></div>');
  }
  // Render initial
  // Logos
  loadart(active_item);
  loadvideo(active_item);
  loadlogos(logo_load_start, display_items, items_length, active_item);
  $('.menu-div').css({'height': image_height});
  $('.menu-img').css({'max-height': image_height});
  highlight(active_item);
  // Capture key events for menu navigation
  $(document).keydown(function(event) {
    $('#bgvid').prop('muted', false);
    if (event.key == 'ArrowDown') {
      active_item++
      if (active_item > items_length) {
        active_item = 0;
      }
      var logo_load_start = active_item - Math.floor(display_items/2);
      loadlogos(logo_load_start, display_items, items_length, active_item);
      // Background art and video
      loadart(active_item);
      loadvideo(active_item);
      highlight(active_item);
      window.location.href = '#' + root + '---' + active_item
    }
    if (event.key == 'ArrowUp') {
      active_item--
      if (active_item < 0) {
        active_item = items_length;
      }
      var logo_load_start = active_item - Math.floor(display_items/2);
      loadlogos(logo_load_start, display_items, items_length, active_item);
      // Background art and video
      loadart(active_item);
      loadvideo(active_item);
      highlight(active_item);
      window.location.href = '#' + root + '---' + active_item
    }
    // Load item
    if ((event.key == 'ArrowRight') || (event.key == 'Enter')) {
      $('#i' + active_item).click();
    }
    // Go to Parent
    if (event.key == 'ArrowLeft') {
      window.location.href = '#' + parent;
      window.location.reload();
    }
  });
};
// Load the json profile selected
function loadjson(name, active) {
  var url = 'user/config/' + name + '.json';
  fetch(url,Init)
  .then((resp) => resp.json())
  .then((data) => {
    rendermenu(data, active)
  });
}

window.onload = function() {
  if (! window.location.hash) {
    loadjson('main');
  } else {
    var hash = window.location.hash.replace('#','');
    var name = hash.split('---')[0];
    var active = hash.split('---')[1];
    loadjson(name, active);
  }
};
