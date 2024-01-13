(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.screenGamepad = {}));
}(this, (function(exports) {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
      ({
          __proto__: []
        }
        instanceof Array && function(d, b) {
          d.__proto__ = b;
        }) ||
      function(d, b) {
        for (var p in b)
          if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
      };
    return extendStatics(d, b);
  };

  function __extends(d, b) {
    extendStatics(d, b);

    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  var EventDispatcher = (function() {
    function EventDispatcher() {
      this._listeners = {};
    }
    EventDispatcher.prototype.addEventListener = function(type, listener) {
      var listeners = this._listeners;
      if (listeners[type] === undefined)
        listeners[type] = [];
      if (listeners[type].indexOf(listener) === -1)
        listeners[type].push(listener);
    };
    EventDispatcher.prototype.removeEventListener = function(type, listener) {
      var listeners = this._listeners;
      var listenerArray = listeners[type];
      if (listenerArray !== undefined) {
        var index = listenerArray.indexOf(listener);
        if (index !== -1)
          listenerArray.splice(index, 1);
      }
    };
    EventDispatcher.prototype.removeAllEventListeners = function(type) {
      if (!type) {
        this._listeners = {};
        return;
      }
      if (Array.isArray(this._listeners[type]))
        this._listeners[type].length = 0;
    };
    EventDispatcher.prototype.dispatchEvent = function(event) {
      var listeners = this._listeners;
      var listenerArray = listeners[event.type];
      if (listenerArray !== undefined) {
        event.target = this;
        var array = listenerArray.slice(0);
        for (var i = 0, l = array.length; i < l; i++) {
          array[i].call(this, event);
        }
      }
    };
    return EventDispatcher;
  }());

  function findTouchEventById(event, identifier) {
    for (var i = 0, l = event.changedTouches.length; i < l; i++) {
      if (identifier === event.changedTouches[i].identifier) {
        return event.changedTouches[i];
      }
    }
    return null;
  }

  function isTouchEvent(event) {
    return 'TouchEvent' in window && event instanceof TouchEvent;
  }

  var $style = document.createElement('style');
  $style.innerHTML = `
    .screenGamepad-Joystick {
      cursor: pointer;
      -ms-touch-action : none;
      touch-action : none;
      -webkit-user-select: none;
      -ms-user-select: none;
      user-select: none;
      position: absolute;
      z-index: 2147483647;
    }
    .screenGamepad-Joystick__Button {
      pointer-events: none;
      position: absolute;
      top: 20%;
      left: 20%;
      box-sizing: border-box;
      width: 60%;
      height: 60%;
      border-radius: 50%;
      border: 1px solid #333;
      background: rgba( 255, 255, 255, .5 );
      z-index: 2147483647;
    }`;
  document.head.insertBefore($style, document.head.firstChild);
  var Joystick = (function(_super) {
    __extends(Joystick, _super);

    function Joystick(options) {
      if (options === void 0) {
        options = {};
      }
      var _this = _super.call(this) || this;
      _this.domElement = document.createElement('div');
      _this._size = 128;
      _this._x = 0;
      _this._y = 0;
      _this._angle = 0;
      _this._isActive = false;
      _this._pointerId = -1;
      _this._elRect = new DOMRect();
      _this._$button = document.createElement('div');
      if (options.size)
        _this._size = options.size;
      _this.domElement.classList.add('screenGamepad-Joystick');
      _this.domElement.style.width = _this._size + "px";
      _this.domElement.style.height = _this._size + "px";
      _this._$button.classList.add('screenGamepad-Joystick__Button');
      _this.domElement.appendChild(_this._$button);
      var computePosition = function(offsetX, offsetY) {
        var x = offsetX / _this._size * 2 - 1;
        var y = -offsetY / _this._size * 2 + 1;
        if (x === 0 && y === 0) {
          _this._angle = 0;
          _this._x = 0;
          _this._y = 0;
          return;
        }
        _this._angle = Math.atan2(-y, -x) + Math.PI;
        var length = Math.min(Math.sqrt(x * x + y * y), 1);
        _this._x = Math.cos(_this._angle) * length;
        _this._y = Math.sin(_this._angle) * length;
      };
      var onButtonMove = function(event) {
        event.preventDefault();
        var _isTouchEvent = isTouchEvent(event);
        var _event = _isTouchEvent ?
          findTouchEventById(event, _this._pointerId) :
          event;
        if (!_event)
          return;
        var lastX = _this._x;
        var lastY = _this._y;
        var offsetX = (_event.clientX - window.pageXOffset - _this._elRect.left);
        var offsetY = (_event.clientY - window.pageYOffset - _this._elRect.top);
        computePosition(offsetX, offsetY);
        if (_this._x === lastX && _this._y === lastY)
          return;
        _this._update();
        _this.dispatchEvent({
          type: 'change'
        });
      };
      var onButtonMoveEnd = function(event) {
        event.preventDefault();
        var _isTouchEvent = isTouchEvent(event);
        var _event = _isTouchEvent ?
          event.changedTouches[0] :
          event;
        if (_isTouchEvent && _event.identifier !== _this._pointerId)
          return;
        document.removeEventListener('mousemove', onButtonMove);
        document.removeEventListener('touchmove', onButtonMove, {
          passive: false
        });
        document.removeEventListener('mouseup', onButtonMoveEnd);
        document.removeEventListener('touchend', onButtonMoveEnd);
        _this._pointerId = -1;
        _this._isActive = false;
        _this._angle = 0;
        _this._x = 0;
        _this._y = 0;
        _this._update();
        _this.dispatchEvent({
          type: 'change'
        });
        _this.dispatchEvent({
          type: 'inactive'
        });
      };
      var onButtonMoveStart = function(event) {
        event.preventDefault();
        var _isTouchEvent = isTouchEvent(event);
        var _event = _isTouchEvent ?
          event.changedTouches[0] :
          event;
        if (_isTouchEvent) {
          _this._pointerId = _event.identifier;
        }
        _this._elRect = _this.domElement.getBoundingClientRect();
        _this._isActive = true;
        var offsetX = (_event.clientX - window.pageXOffset - _this._elRect.left);
        var offsetY = (_event.clientY - window.pageYOffset - _this._elRect.top);
        computePosition(offsetX, offsetY);
        _this._update();
        document.addEventListener('mousemove', onButtonMove);
        document.addEventListener('touchmove', onButtonMove, {
          passive: false
        });
        document.addEventListener('mouseup', onButtonMoveEnd);
        document.addEventListener('touchend', onButtonMoveEnd);
        _this.dispatchEvent({
          type: 'active'
        });
        _this.dispatchEvent({
          type: 'change'
        });
      };
      _this.domElement.addEventListener('mousedown', onButtonMoveStart);
      _this.domElement.addEventListener('touchstart', onButtonMoveStart);
      return _this;
    }
    Object.defineProperty(Joystick.prototype, "x", {
      get: function() {
        return this._x;
      },
      set: function(x) {
        this._x = x;
        this._update();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Joystick.prototype, "y", {
      get: function() {
        return this._y;
      },
      set: function(y) {
        this._y = y;
        this._update();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Joystick.prototype, "angle", {
      get: function() {
        return this._angle;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Joystick.prototype, "isActive", {
      get: function() {
        return this._isActive;
      },
      enumerable: false,
      configurable: true
    });
    Joystick.prototype._update = function() {
      this._$button.style.transition = this._isActive ? '' : 'transform .1s';
      if (this._x === 0 && this._y === 0) {
        this._$button.style.transform = "translate( 0px, 0px )";
        return;
      }
      var radius = this._size / 2;
      var x = this._x * radius;
      var y = -this._y * radius;
      this._$button.style.transform = "translate( " + x + "px, " + y + "px )";
    };
    return Joystick;
  }(EventDispatcher));

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var $style$1 = document.createElement('style');
  $style$1.innerHTML = `
    .screenGamepad-Button {
      cursor: pointer;
      -ms-touch-action : none;
      touch-action : none;
      -webkit-user-select: none;
      -ms-user-select: none;
      user-select: none;
      position: absolute;
      z-index: 2147483647;
    }
    .screenGamepad-Button__HitArea {
      color: rgba( 255, 255, 255, .5 );
      z-index: 2147483647;
    }`;
  document.head.insertBefore($style$1, document.head.firstChild);
  var Button = (function(_super) {
    __extends(Button, _super);

    function Button(options) {
      if (options === void 0) {
        options = {};
      }
      var _this = _super.call(this) || this;
      _this.domElement = document.createElementNS(SVG_NS, 'svg');
      _this._size = 48;
      _this._isActive = false;
      _this._pointerId = -1;
      _this._$hitArea = document.createElementNS(SVG_NS, 'a');
      if (options.size)
        _this._size = options.size;
      _this._$hitArea.innerHTML = options.shape || Button.BUTTON_SHAPE_CIRCLE;
      _this.domElement.classList.add('screenGamepad-Button');
      _this.domElement.setAttribute('viewBox', '0 0 1 1');
      _this.domElement.style.width = _this._size + "px";
      _this.domElement.style.height = _this._size + "px";
      _this._$hitArea.classList.add('screenGamepad-Button__HitArea');
      _this.domElement.appendChild(_this._$hitArea);
      var hitRect = _this.domElement.createSVGRect();
      hitRect.width = 1;
      hitRect.height = 1;
      var onButtonMove = function(event) {
        event.preventDefault();
        var _isTouchEvent = isTouchEvent(event);
        var _event = _isTouchEvent ?
          findTouchEventById(event, _this._pointerId) :
          event;
        if (!_event)
          return;
        var x = _event.clientX;
        var y = _event.clientY;
        var $intersectedElement = document.elementFromPoint(x, y);
        var isIntersected = _this._$hitArea.contains($intersectedElement);
        if (isIntersected && !_this._isActive) {
          _this._isActive = true;
          _this._update();
          _this.dispatchEvent({
            type: 'active'
          });
          _this.dispatchEvent({
            type: 'change'
          });
          return;
        }
        if (!isIntersected && _this._isActive) {
          _this._isActive = false;
          _this._update();
          _this.dispatchEvent({
            type: 'inactive'
          });
          _this.dispatchEvent({
            type: 'change'
          });
          return;
        }
      };
      var onButtonUp = function(event) {
        event.preventDefault();
        document.removeEventListener('mousemove', onButtonMove);
        document.removeEventListener('touchmove', onButtonMove, {
          passive: false
        });
        document.removeEventListener('mouseup', onButtonUp);
        document.removeEventListener('touchend', onButtonUp);
        _this._pointerId = -1;
        if (!_this._isActive)
          return;
        _this._isActive = false;
        _this._update();
        _this.dispatchEvent({
          type: 'change'
        });
        _this.dispatchEvent({
          type: 'inactive'
        });
      };
      var onButtonDown = function(event) {
        document.removeEventListener('mousemove', onButtonMove);
        document.removeEventListener('touchmove', onButtonMove, {
          passive: false
        });
        document.removeEventListener('mouseup', onButtonUp);
        document.removeEventListener('touchend', onButtonUp);
        event.preventDefault();
        var _isTouchEvent = isTouchEvent(event);
        if (_isTouchEvent) {
          var changedTouches = event.changedTouches;
          _this._pointerId = changedTouches[changedTouches.length - 1].identifier;
        }
        _this._isActive = true;
        _this._update();
        document.addEventListener('mousemove', onButtonMove);
        document.addEventListener('touchmove', onButtonMove, {
          passive: false
        });
        document.addEventListener('mouseup', onButtonUp);
        document.addEventListener('touchend', onButtonUp);
        _this.dispatchEvent({
          type: 'active'
        });
        _this.dispatchEvent({
          type: 'change'
        });
      };
      _this.domElement.addEventListener('mousedown', onButtonDown);
      _this.domElement.addEventListener('touchstart', onButtonDown);
      return _this;
    }
    Object.defineProperty(Button, "BUTTON_SHAPE_CIRCLE", {
      get: function() {
        return '<circle cx="0.5" cy="0.5" r="0.5" fill="currentColor" />';
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(Button.prototype, "isActive", {
      get: function() {
        return this._isActive;
      },
      enumerable: false,
      configurable: true
    });
    Button.prototype._update = function() {};
    return Button;
  }(EventDispatcher));

  var utils = {
    roundToStep: function(number, step) {
      return step * Math.round(number / step);
    },
  };

  exports.Button = Button;
  exports.Joystick = Joystick;
  exports.utils = utils;

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

})));

//// Fake touch controller ////
var touchController = {
  axes: [0, 0, 0, 0],
  buttons: [],
  connected: false,
  id: "HTML5 Touch GamePad",
  index: 0,
  mapping: "standard",
  timestamp: Math.floor(Date.now() / 1000),
};
for (let i of Array(18).keys()) {
  touchController.buttons.push({
    pressed: false,
    touched: false,
    value: 0,
  });
}

//// GamePads ////
var directionStore;

//// Standard default D-pad snes style
if (typeof gamePadType == 'undefined') {
  // Buttons
  var buttons = [
    [0, 'bottom', '40px', 'right', '80px', 'a'],
    [1, 'bottom', '70px', 'right', '30px', 'b'],
    [2, 'bottom', '90px', 'right', '110px', 'x'],
    [3, 'bottom', '120px', 'right', '60px', 'y'],
    [4, 'bottom', '210px', 'left', '30px', 'L1'],
    [5, 'bottom', '210px', 'right', '30px', 'R1'],
    [8, 'bottom', '50px', 'left', '42%', 'select'],
    [9, 'bottom', '50px', 'right', '42%', 'start']  
  ]
  // Joystick
  var joystick = new screenGamepad.Joystick();
  joystick.domElement.style.position = 'absolute';
  joystick.domElement.style.bottom = '40px';
  joystick.domElement.style.left = '20px';
  document.getElementById("gamepad").appendChild(joystick.domElement);
  joystick.addEventListener('change', function() {
    axesToDpad();
  });
//// Basic controller type with no L+R and two buttons
} else if (gamePadType == 'simple') {
  // Buttons
  var buttons = [
    [0, 'bottom', '40px', 'right', '80px', 'a'],
    [1, 'bottom', '70px', 'right', '30px', 'b'],
    [8, 'bottom', '50px', 'left', '42%', 'select'],
    [9, 'bottom', '50px', 'right', '42%', 'start']
  ]
  // Joystick
  var joystick = new screenGamepad.Joystick();
  joystick.domElement.style.position = 'absolute';
  joystick.domElement.style.bottom = '40px';
  joystick.domElement.style.left = '20px';
  document.getElementById("gamepad").appendChild(joystick.domElement);
  joystick.addEventListener('change', function() {
    axesToDpad();
  });
//// Dual Analog modern contoller
} else if (gamePadType == 'modern') {
  // Buttons
  var buttons = [
    [0, 'bottom', '40px', 'right', '80px', 'a'],
    [1, 'bottom', '70px', 'right', '30px', 'b'],
    [2, 'bottom', '90px', 'right', '110px', 'x'],
    [3, 'bottom', '120px', 'right', '60px', 'y'],
    [4, 'bottom', '210px', 'left', '30px', 'L1'],
    [5, 'bottom', '210px', 'right', '30px', 'R1'],
    [6, 'bottom', '270px', 'left', '30px', 'L2'],
    [7, 'bottom', '270px', 'right', '30px', 'R2'],
    [8, 'bottom', '50px', 'left', '42%', 'select'],
    [9, 'bottom', '50px', 'right', '42%', 'start']
  ]
  // Joystick
  var joystick = new screenGamepad.Joystick();
  joystick.domElement.style.position = 'absolute';
  joystick.domElement.style.bottom = '40px';
  joystick.domElement.style.left = '20px';
  document.getElementById("gamepad").appendChild(joystick.domElement);
  joystick.addEventListener('change', function() {
    axesToDpad();
  });
  // Analogs
  var left = new screenGamepad.Joystick();
  left.domElement.style.position = 'absolute';
  left.domElement.style.bottom = '40px';
  left.domElement.style.left = '200px';
  document.getElementById("gamepad").appendChild(left.domElement);
  left.addEventListener('change', function() {
    touchController.axes[0] = screenGamepad.utils.roundToStep(left.x, 0.1);
    touchController.axes[1] = screenGamepad.utils.roundToStep(left.x, 0.1);
  });
  var right = new screenGamepad.Joystick();
  right.domElement.style.position = 'absolute';
  right.domElement.style.bottom = '40px';
  right.domElement.style.right = '200px';
  document.getElementById("gamepad").appendChild(right.domElement);
  right.addEventListener('change', function() {
    touchController.axes[2] = screenGamepad.utils.roundToStep(right.x, 0.1);
    touchController.axes[3] = screenGamepad.utils.roundToStep(right.x, 0.1);
  });
} else if (gamePadType == 'n64') {
  // Buttons
  var buttons = [
    [0, 'bottom', '40px', 'right', '110px', 'a'],
    [2, 'bottom', '90px', 'right', '140px', 'x'],
    [6, 'bottom', '60px', 'right', '200px', 'z'],
    [5, 'bottom', '230px', 'right', '30px', 'R1'],
    [4, 'bottom', '230px', 'left', '30px', 'L1'],
    [9, 'bottom', '50px', 'right', '50%', 'start']

  ]
  // Joystick
  var joystick = new screenGamepad.Joystick();
  joystick.domElement.style.position = 'absolute';
  joystick.domElement.style.bottom = '130px';
  joystick.domElement.style.left = '30px';
  document.getElementById("gamepad").appendChild(joystick.domElement);
  joystick.addEventListener('change', function() {
    axesToDpad();
  });
  // Analogs
  var left = new screenGamepad.Joystick();
  left.domElement.style.position = 'absolute';
  left.domElement.style.bottom = '30px';
  left.domElement.style.left = '30px';
  document.getElementById("gamepad").appendChild(left.domElement);
  left.addEventListener('change', function() {
    touchController.axes[0] = screenGamepad.utils.roundToStep(left.x, 0.1);
    touchController.axes[1] = screenGamepad.utils.roundToStep(left.x, 0.1);
  });
  // Default Retroarch uses the R analogue for the C buttons
  var right = new screenGamepad.Joystick();
  right.domElement.style.position = 'absolute';
  right.domElement.style.bottom = '120px';
  right.domElement.style.right = '30px';
  document.getElementById("gamepad").appendChild(right.domElement);
  right.addEventListener('change', function() {
    touchController.axes[2] = screenGamepad.utils.roundToStep(right.x, 0.1);
    touchController.axes[3] = screenGamepad.utils.roundToStep(right.x, 0.1);
  });
}
//// Render Buttons ////
var vars = {};
for (let button of buttons) {
  vars[button[0]] = new screenGamepad.Button();
  vars[button[0]].domElement.style.position = 'absolute';
  vars[button[0]].domElement.style[button[1]] = button[2];
  vars[button[0]].domElement.style[button[3]] = button[4];
  document.getElementById("gamepad").appendChild(vars[button[0]].domElement);
  vars[button[0]].addEventListener('change', function() {
    touchController.buttons[button[0]].pressed = vars[button[0]].isActive;
    connectGamePad();
  });
}
// Retroarch menu button
if (localStorage.getItem('retroArch') == 'true') {
  menuButton = new screenGamepad.Button();
  menuButton.domElement.style.position = 'absolute';
  menuButton.domElement.style.top = '10px';
  menuButton.domElement.style.left = '10px';
  document.getElementById("gamepad").appendChild(menuButton.domElement);
  menuButton.addEventListener('change', function() {
    touchController.buttons[4].pressed = menuButton.isActive;
    touchController.buttons[5].pressed = menuButton.isActive;
    touchController.buttons[8].pressed = menuButton.isActive;
    touchController.buttons[9].pressed = menuButton.isActive;
    connectGamePad();
  });
}
//// Logic to convert an axes joystick to dpad
function axesToDpad() {
  // 8 way direction with .24 deadzone
  let direction = axesToDirection({
    x: screenGamepad.utils.roundToStep(joystick.x, 0.1),
    y: screenGamepad.utils.roundToStep(joystick.y, 0.1)
  }, 0.24, 4);
  if (directionStore !== direction) {
    directionStore = direction;
    // Clear d-pad press
    touchController.buttons[12].pressed = false;
    touchController.buttons[13].pressed = false;
    touchController.buttons[14].pressed = false;
    touchController.buttons[15].pressed = false;
    // Press d-pad
    if (direction == 'up') {
      touchController.buttons[12].pressed = true;
    } else if (direction == 'down') {
      touchController.buttons[13].pressed = true;
    } else if (direction == 'left') {
      touchController.buttons[14].pressed = true;
    } else if (direction == 'right') {
      touchController.buttons[15].pressed = true;
    } else if (direction == 'upleft') {
      touchController.buttons[12].pressed = true;
      touchController.buttons[14].pressed = true;
    } else if (direction == 'upright') {
      touchController.buttons[12].pressed = true;
      touchController.buttons[15].pressed = true;
    } else if (direction == 'downright') {
      touchController.buttons[13].pressed = true;
      touchController.buttons[15].pressed = true;
    } else if (direction == 'downleft') {
      touchController.buttons[13].pressed = true;
      touchController.buttons[14].pressed = true;
    }
  }
}
function axesToDirection(coord, deadzone, axes) {
  const angle = Math.atan2(coord.y, coord.x);
  const snapRadians = Math.PI / axes;
  const newAngle = snapRadians * Math.round(angle / snapRadians);
  let magnitude = Math.sqrt(coord.x * coord.x + coord.y * coord.y);
  if (magnitude <= deadzone) {
    return 'center';
  }
  if (magnitude > 1) {
    magnitude = 1;
  }
  let x = Math.cos(newAngle).toFixed(2);
  let y = Math.sin(newAngle).toFixed(2);
  if ((x == '0.00') && (y == '1.00')) {
    return 'up';
  } else if ((x == '0.00') && (y == '-1.00')) {
    return 'down';
  } else if (((x == '-1.00') && (y == '-0.00')) || ((x == '-1.00') && (y == '0.00'))) {
    return 'left';
  } else if ((x == '1.00') && (y == '0.00')) {
    return 'right';
  } else if ((x == '-0.71') && (y == '0.71')) {
    return 'upleft';
  } else if ((x == '0.71') && (y == '0.71')) {
    return 'upright';
  } else if ((x == '0.71') && (y == '-0.71')) {
    return 'downright';
  } else if ((x == '-0.71') && (y == '-0.71')) {
    return 'downleft';
  }
}

//// Replace default contoller logic with ours ////
navigator.getGamepads = function() {
  return {
    0: touchController,
  };
};
function connectGamePad() {
  let event = new Event("gamepadconnected");
  touchController.connected = true;
  touchController.timestamp = Math.floor(Date.now() / 1000);
  event.gamepad = touchController;
  window.dispatchEvent(event);
}
function disconnectGamePad() {
  let event = new Event("gamepaddisconnected");
  touchController.connected = false;
  touchController.timestamp = Math.floor(Date.now() / 1000);
  event.gamepad = touchController;
  window.dispatchEvent(event);
}
