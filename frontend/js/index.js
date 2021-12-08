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
  'has_video',
  'multi_disc'
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
  var multi = $('#i' + active_item.toString()).data('multi_disc');
  var root = $('#menu').data('root');
  $(document).attr('title', name);
  if (type == 'menu') {
    window.location.href = '#' + name
  } else if (multi > 1) {
    var config = $('#menu').data('config');
    config.display_items = multi;
    config.parent = config.root + '---' + active_item.toString();
    config.multi_name = name;
    var baseItem = config.items[name];
    config.items = {};
    for (let count = 1; count <= multi; count++) {
      config.items['Disc ' + count.toString()] = {};
      Object.assign(config.items['Disc ' + count.toString()], baseItem);
      config.items['Disc ' + count.toString()].rom_extension = '.disk' + count.toString();
      config.items['Disc ' + count.toString()].has_logo = false;
      config.items['Disc ' + count.toString()].has_video = false;
      config.items['Disc ' + count.toString()].multi_disc = 0;
    };
    rendermenu([config, 0]);
  } else if (type == 'game') {
    // Disable keyevents and hash watching
    window.exit = false;
    $(window).off('hashchange');
    $(window).off('orientationchange');
    window.location.href = '#game';
    $(document).off('keydown');
    // Default variables for emulator
    var emulator = $('#i' + active_item.toString()).data('emulator');
    if (emulator.startsWith('libretro-')) {
      var emulator = emulator.replace('libretro-','');
      var script = 'js/libretro.js'
      EJS_onGameStart = function() {
        Module.requestFullscreen(false);
      }
    } else {
      var script = 'data/loader.js'
      var EJSemu = true;
      EJS_onGameStart = function() {
        document.querySelectorAll('[data-btn="fullscreen"]')[0].click();
      }
    };
    var path =  $('#i' + active_item.toString()).data('path');
    var rom_path = 'user/' + path + '/roms/';
    var rom_extension = $('#i' + active_item.toString()).data('rom_extension');
    var bios = 'user/' + path + '/bios/' + $('#i' + active_item.toString()).data('bios');
    // Clear screen
    $('body').empty();
    // Add game window
    var gameDiv = $('<div>').attr('id','game');
    $('body').append(gameDiv);
    // Set emulator variables
    if (bios !== 'user/' + path + '/bios/') {
      EJS_biosUrl = bios;
    }
    EJS_player = '#game';
    EJS_gameUrl = rom_path + name + rom_extension;
    EJS_core = emulator;
    EJS_pathtodata = 'data/';
    // Load in EJS loader
    var loaderscript = document.createElement('script');
    loaderscript.src = script;
    document.head.append(loaderscript);
    // Click play button as soon as it appears
    if (EJSemu) {
      var clickplay = setInterval(() => {
        if (typeof document.getElementsByClassName('ejs--73f9b4e94a7a1fe74e11107d5ab2ef')[0] !== 'undefined') {
          clearInterval(clickplay);
          document.getElementsByClassName('ejs--73f9b4e94a7a1fe74e11107d5ab2ef')[0].click();
        }
      }, 100);
    };
    // Reload window if user clicks back
    $(window).on('hashchange', async function() {
      if (window.location.hash !== '#game') {
        // Make sure games are saved by sleeping for a second before reloading
        window.exit = true;
        if (Module) {
          try {
            Module._cmd_savefiles();
          } catch(e) {
            console.log(e);
          }
        };
        window.dispatchEvent(new Event('beforeunload'));
        setTimeout(function(){
          window.location.href = '#' + root + '---' + active_item;
          window.location.reload();
	}, 1000);
      }
    });
  }
}

//// Page rendering logic ////
async function rendermenu(datas) {
  var data = datas[0];
  var active_item = datas[1];
  // Set default variables
  var portrait = window.orientation;
  $('#menu').data('config', data);
  var root = data.root;
  $('#menu').data('root', root);
  var parent = data.parent;
  var items = data.items;
  if (Object.keys(items).length == 0) {
    alert('No items to load, please add some games');
    return '';
  };
  for await (var name of Object.keys(items)) {
    var item = data.items[name];
    if ((item.hasOwnProperty('cloneof')) && (items.hasOwnProperty(item.cloneof))) {
      delete items[name];
    }
  };
  var items_length = Object.keys(items).length - 1;
  // Determine counts and style based on menu items
  var display_items = data.display_items;
  if (typeof active_item == 'undefined'){
    var active_item = Math.floor(display_items/2);
  };
  var logo_load_start = active_item - Math.floor(display_items/2);
  var image_height = Math.floor(100/display_items).toString() + 'vh';
  // Render zoom effect on active item
  function highlight(active_item) {
    if (portrait !== 0) {
      $('#h' + active_item).addClass('grow')
    } else {
      $('#h' + active_item).addClass('grow-mobile')
    };
  }
  // Set page title
  $(document).attr('title', data.title);
  // Empty any existing
  $('#games-list').empty();
  $('#active-list').empty();
  // Determine CSS to use
  if (portrait !== 0) {
    var shrink = 'shrink';
  } else {
    var shrink = 'shrink-mobile';
  };
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
    // Render differently for multi disc menus
    if (data.hasOwnProperty('multi_name')) {
      var romName = data.multi_name;
    } else {
      var romName = name;
    };
    if (has_logo == true) {
      logo_html = '<img class="menu-img">';
    } else {
      logo_html = '<p class="menu-img">' + name + '</p>';
    };
    // Set varibles to default if not set in item
    var jsdata = '';
    jsdata += 'data-name="' + romName + '" ';
    for await (var key of defaultKeys) {
      if (item.hasOwnProperty(key)) {
        jsdata += 'data-' + key + '="' + item[key] + '" ';
      } else {
        jsdata += 'data-' + key + '="' + data.defaults[key] + '" ';
      };
    };
    $('#games-list').append('\
      <div id="m' + count + '">\
        <div id="h' + count + '" class="menu-wrap ' + shrink + '">\
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
  if (portrait !== 0) {
    $('.menu-img').css({'max-width': '30vw'});
    $('.games-list').css({'width': '40vw'});
    loadart(active_item);
    loadvideo(active_item);
  } else {
    $('.menu-img').css({'max-width': '90vw'});
    $('.games-list').css({'width': '100vw'});
  }
  loadlogos(logo_load_start, display_items, items_length, active_item);
  $('.menu-div').css({'height': image_height});
  $('.menu-img').css({'max-height': image_height});
  highlight(active_item);
  // Move items up
  function moveUp(num) {
    $('#bgvid').prop('muted', false);
    $('#bgvid').prop('volume', 0.5);
    if (typeof num == 'number') {
      active_item = (active_item - num);
    } else {
      active_item--
    }
    if (active_item < 0) {
      active_item = items_length;
    }
    var logo_load_start = active_item - Math.floor(display_items/2);
    loadlogos(logo_load_start, display_items, items_length, active_item);
    // Background art and video
    if (portrait !== 0) {
      loadart(active_item);
      loadvideo(active_item);
    }
    highlight(active_item);
  };
  // Move items down
  function moveDown(num) {
    $('#bgvid').prop('muted', false);
    $('#bgvid').prop('volume', 0.5);
    if (typeof num == 'number') {
      active_item = (active_item + num);
    } else {
      active_item++
    }
    if (active_item > items_length) {
      active_item = 0;
    }
    var logo_load_start = active_item - Math.floor(display_items/2);
    loadlogos(logo_load_start, display_items, items_length, active_item);
    // Background art and video
    if (portrait !== 0) {
      loadart(active_item);
      loadvideo(active_item);
    }
    highlight(active_item);
  };
  // Capture key events for menu navigation
  let upPressed = false;
  let downPressed = false;
  $(document).keydown(function(event) {
    // Scroll on keypress
    if (event.key == 'ArrowDown') {
      downPressed = true;
      moveDown();
    }
    if (event.key == 'ArrowUp') {
      upPressed = true;
      moveUp();
    }
    // Scroll faster with diagnols
    if ((event.key == 'ArrowRight') && ((upPressed == false) && (downPressed == true))) {
      moveDown(10);
    }
    if ((event.key == 'ArrowRight') && ((upPressed == true) && (downPressed == false))) {
      moveUp(10);
    }
    // Load item
    if (((event.key == 'ArrowRight') || (event.key == 'Enter')) && ((upPressed == false) && (downPressed == false))) {
      $('#i' + active_item).click();
    }
    // Go to Parent
    if (event.key == 'ArrowLeft') {
      window.location.href = '#' + parent;
    }
  });
  // Remove events for multi key presses
  $(document).keyup(function(event) {
    if (event.key == 'ArrowDown') {
      downPressed = false;
    }
    if (event.key == 'ArrowUp') {
      upPressed = false;
    }
  });
  //// Touch controls ////
  // Scroll wheel
  async function scroll(ev) {
    window.scrollKill = false;
    var scrolling = setInterval(() => {
      if (window.scrollKill == false) {
        if (ev.additionalEvent == 'panup') {
          moveDown(5);
	} else if (ev.additionalEvent == 'pandown') {
          moveUp(5);
	} else {
          clearInterval(scrolling);
        };
      } else {
        clearInterval(scrolling);
      };
    }, 50);
  };
  // Stop scrolling 
  function killScroll(ev) {
    window.scrollKill = true;
  };
  var mc = new Hammer(document.getElementById('menu'));
  mc.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
  mc.get('pan').set({ direction: Hammer.DIRECTION_ALL, threshold: 180 });
  mc.on("swipeup", moveDown);
  mc.on("swipedown", moveUp);
  mc.on("panstart", scroll);
  mc.on("panend", killScroll);
  // Render menu on orientation change
  $(window).on('orientationchange',function(){
    window.location.href = '#' + root + '---' + active_item;
    window.location.reload();
  });
  //// Mouse Scrolling ////
  $('#menu').bind('DOMMouseScroll', function(e){
    if(e.originalEvent.detail > 0) {
      moveDown(10);
    } else {
      moveUp(10);
    };
    return false;
  });
  $('#menu').bind('mousewheel', function(e){
    if(e.originalEvent.wheelDelta < 0) {
      moveDown(10);
    } else {
      moveUp(10);
    };
    return false;
  });
};

// Load the json profile selected
async function loadjson(name, active_item) {
  let url = 'user/config/' + name + '.json';
  let response = await fetch(url,Init);
  let data = await response.json();
  rendermenu([data, active_item]);
}

window.onload = function() {
  if (! window.location.hash) {
    loadjson('main');
  } else {
    var hash = window.location.hash.replace('#','');
    var name = hash.split('---')[0];
    let active_item = hash.split('---')[1];
    loadjson(name, active_item);
  }
  $(window).on('hashchange', function() {
    window.location.reload();
  });
};
