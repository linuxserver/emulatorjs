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
localStorage.setItem('retroArch',true);
var gamePadType;
var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
               navigator.userAgent &&
               navigator.userAgent.indexOf('CriOS') == -1 &&
               navigator.userAgent.indexOf('FxiOS') == -1;

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
      var EJSemu = false;
      EJS_onGameStart = function() {
        gameStarted = true;
        let gps = navigator.getGamepads();
        if (gps) {
          for (let gp of gps) {
            if (gp) {
              let gpEvt = new GamepadEvent("gamepadconnected",{gamepad: gp});
              window.dispatchEvent(gpEvt);
            }
          }
        }
      }
    } else {
      var script = 'data/loader.js'
      var EJSemu = true;
      EJS_onGameStart = function() {
        gameStarted = true;
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
    EJS_gameUrl = encodeURI(rom_path + name + rom_extension);
    EJS_core = emulator;
    EJS_pathtodata = 'data/';
    // Load touch screen interface
    if ((! EJSemu) && (window.orientation !== undefined) && localStorage.getItem('touchpad') !== 'false' && !navigator.getGamepads()?.[0]) {
      // Determine type to render
      if (localStorage.getItem('touchpad') !== null) {
        if (localStorage.getItem('touchpad') == 'simple') {
          gamePadType = 'simple';
        } else if (localStorage.getItem('touchpad') == 'modern') {
          gamePadType = 'modern';
        }
      } else {
        if ((emulator == 'gearboy') || (emulator == 'fceumm') || (emulator == 'mednafen_vb') || (emulator == 'gambatte') || (emulator == 'stella2014') || (emulator == 'prosystem') || (emulator == 'mednafen_pce_fast')) {
          gamePadType = 'simple';
        } else if ((emulator == 'prboom') || (emulator == 'mednafen_psx') || (emulator == 'tyrquake') || (emulator == 'melonds') || (emulator == 'melonds_threaded')) {
          gamePadType = 'modern';
	} else if (emulator == 'mupen64plus_next') {
          gamePadType = 'n64';
        }
      }
      var touchDiv = $('<div>').attr('id','gamepad');
      $('body').append(touchDiv);
      var touchscript = document.createElement('script');
      touchscript.src = 'js/touchpad.js';
      document.head.append(touchscript);
    }
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
  var jumpIndex = {};
  var letters = "abcdefghijklmnopqrstuvwxyz".split("");
  for await (var name of Object.keys(items)) {
    // Generate an index table based on alphabetical order ignoring numbers
    if (count == 0) {
      jumpIndex['0'] = count;
    } else {
      letterLoop:
      for (let letter of letters) {
        let startLetter = name.charAt(0).toLowerCase();
        if ((! jumpIndex.hasOwnProperty(startLetter)) && (letter == startLetter)) {
          jumpIndex[letter] = count;
          break letterLoop;
        }
      }
    }
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
      logo_html = '<img class="menu-img" alt="'+ romName +'" title="'+ romName +'">';
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
    if (! isSafari) {
      $('#bgvid').prop('muted', false);
      $('#bgvid').prop('volume', 0.5);
    }
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
    if (! isSafari) {
      $('#bgvid').prop('muted', false);
      $('#bgvid').prop('volume', 0.5);
    }
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
  // Jump items up
  async function indexUp() {
    for await (index of Object.keys(jumpIndex).reverse()) {
      if (active_item > jumpIndex[index]) {
        let jumpNum = (active_item - jumpIndex[index]);
        moveUp(jumpNum);
        break;
      }
    }
  }
  // Jump items down
  async function indexDown() {
    for await (index of Object.keys(jumpIndex)) {
      if (jumpIndex[index] > active_item) {
        let jumpNum = (jumpIndex[index] - active_item);
        moveDown(jumpNum);
        break;
      }
    }
  }
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
    // Jump Down
    if (event.key == 'PageDown') {
      indexDown();
    }
    // Jump Up
    if (event.key == 'PageUp') {
      indexUp();
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
      moveDown();
    } else {
      moveUp();
    };
    return false;
  });
  $('#menu').bind('mousewheel', function(e){
    if(e.originalEvent.wheelDelta < 0) {
      moveDown();
    } else {
      moveUp();
    };
    return false;
  });
  //// GamePad controls ////
  let scrollDelay
  let animReq
  let homeTimer;
  let home = 0;
  let homePressed = false;
  let gpUpdate;
  function gameLoop() {
    // Handle if buttons are missing
    function buttonsMissing(axes,buttons) {
      var missing = true;
      axes.forEach(function(i) {
        if (typeof gp.axes[i] === 'undefined') {
          missing = false;
        }
      });
      buttons.forEach(function(i) {
        if (typeof gp.buttons[i] === 'undefined') {
          missing = false;
        }
      });
      return missing;
    }
    let gamePads = navigator.getGamepads();
    if (!gamePads?.[0]) return;
    let gp = gamePads[0];
    if (window.location.hash != "#game") {
      gameStarted = false;
      if (!scrollDelay) {
        // Analog down
        if ((buttonsMissing([1,3],[])) && (gp.axes[1] > .5 || gp.axes[3] > .5)) {
          scrollDelay = setTimeout(() => scrollDelay = undefined, 200);
          moveDown();
        // Analog up
        } else if ((buttonsMissing([1,3],[])) && (gp.axes[1] < -.5 || gp.axes[3] < -.5)) {
          scrollDelay = setTimeout(() => scrollDelay = undefined, 200);
          moveUp();
        // D-pad down
        } else if ((buttonsMissing([],[13])) && (gp.buttons[13].pressed)) {
          scrollDelay = setTimeout(() => scrollDelay = undefined, 200);
          moveDown();
        // D-pad up
        } else if ((buttonsMissing([],[12])) && (gp.buttons[12].pressed)) {
          scrollDelay = setTimeout(() => scrollDelay = undefined, 200);
          moveUp();
        // R1 index down
        } else if ((buttonsMissing([],[5])) && (gp.buttons[5].pressed)) {
          scrollDelay = setTimeout(() => scrollDelay = undefined, 200);
          indexDown();
        // L1 index up
        } else if ((buttonsMissing([],[4])) && (gp.buttons[4].pressed)) {
          scrollDelay = setTimeout(() => scrollDelay = undefined, 200);
          indexUp();
        // Analog L2 scroll up by strength
        } else if ((buttonsMissing([],[6])) && (gp.buttons[6].pressed)) {
          if (gp.buttons[6].value) {
            scrollDelay = setTimeout(() => scrollDelay = undefined, (Math.abs(gp.buttons[6].value - 1) * 200) + 40);
          } else {
            scrollDelay = setTimeout(() => scrollDelay = undefined, 40);
	  }
	  moveUp();
        // Analog R2 scroll down by strength
        } else if ((buttonsMissing([],[7])) && (gp.buttons[7].pressed)) {
          if (gp.buttons[7].value) {
            scrollDelay = setTimeout(() => scrollDelay = undefined, (Math.abs(gp.buttons[7].value - 1) * 200) + 40);
          } else {
            scrollDelay = setTimeout(() => scrollDelay = undefined, 40);
          }
          moveDown();
        }
      }
      if (gp.timestamp == gpUpdate) {
        animReq = requestAnimationFrame(gameLoop);
        return;
      }
      gpUpdate = gp.timestamp
      if (gp.buttons[0].pressed) {
        if ($('#i' + active_item.toString()).data('type') == "game") {
          cancelAnimationFrame(animReq);
        }
        $('#i' + active_item).click();
        return;
      } else if (gp.buttons[1].pressed && parent && '#' + parent != window.location.hash) {
        window.location.href = '#' + parent;
        return;
      } else if ((buttonsMissing([],[16])) && (gp.buttons[16].pressed && window.location.hash != '#main')) {
        window.location.href = '#main';
        return;
      }
    } else {
      if (gp.timestamp == gpUpdate) {
        animReq = requestAnimationFrame(gameLoop);
        return;
      }
      gpUpdate = gp.timestamp
      try {
        if (!gameStarted && gp.buttons[1].pressed && parent) {
          window.location.href = '#' + parent;
          return;
        }
      } catch (e) {
        console.log(e);
      }
      // Press home button 3 times to exit game
      if ((buttonsMissing([],[16])) && (!gp.buttons[16].pressed && homePressed)) {
        home++;
        homePressed = false;
      }
      if ((buttonsMissing([],[16])) && (gp.buttons[16].pressed)) {
        clearTimeout(homeTimer)
        homeTimer = setTimeout(() => home = 0, 500)
        homePressed = true
      }
      if ((buttonsMissing([],[16])) && (gp.buttons[16].pressed && home >= 2)) {
        window.location.href = '#' + parent;
      }
    }
    animReq = requestAnimationFrame(gameLoop);
  }
  window.addEventListener("gamepadconnected", gameLoop)
  window.addEventListener("gamepaddisconnected", cancelAnimationFrame(animReq))
  window.addEventListener("load", () => {
    var gameStarted = false;
    let gps = navigator.getGamepads();
    if (gps) {
      for (let gp of gps) {
        let gpEvt = new GamepadEvent("gamepadconnected", {
          gamepad: gp
        })
        window.dispatchEvent(gpEvt)
      }
    }
  });
  window.addEventListener("hashchange", gameLoop);
}

// Go fullscreen
function fullscreen() {
  let page = document.documentElement;
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    if (page.requestFullscreen) {
      page.requestFullscreen();
    } else if (page.webkitRequestFullscreen) {
      page.webkitRequestFullscreen();
    } else if (page.msRequestFullscreen) {
      page.msRequestFullscreen();
    }
  }
}

// Load the json profile selected
async function loadjson(name, active_item) {
  if (name == 'preview') {
    var url = 'user/hashes/preview.json';
  } else {
    var url = 'user/config/' + name + '.json';
  }
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
