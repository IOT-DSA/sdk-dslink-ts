// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"DPC0":[function(require,module,exports) {
'use strict';
/**
 * Custom implementation of a double ended queue.
 */

function Denque(array) {
  this._head = 0;
  this._tail = 0;
  this._capacityMask = 0x3;
  this._list = new Array(4);

  if (Array.isArray(array)) {
    this._fromArray(array);
  }
}
/**
 * -------------
 *  PUBLIC API
 * -------------
 */

/**
 * Returns the item at the specified index from the list.
 * 0 is the first element, 1 is the second, and so on...
 * Elements at negative values are that many from the end: -1 is one before the end
 * (the last element), -2 is two before the end (one before last), etc.
 * @param index
 * @returns {*}
 */


Denque.prototype.peekAt = function peekAt(index) {
  var i = index; // expect a number or return undefined

  if (i !== (i | 0)) {
    return void 0;
  }

  var len = this.size();
  if (i >= len || i < -len) return undefined;
  if (i < 0) i += len;
  i = this._head + i & this._capacityMask;
  return this._list[i];
};
/**
 * Alias for peakAt()
 * @param i
 * @returns {*}
 */


Denque.prototype.get = function get(i) {
  return this.peekAt(i);
};
/**
 * Returns the first item in the list without removing it.
 * @returns {*}
 */


Denque.prototype.peek = function peek() {
  if (this._head === this._tail) return undefined;
  return this._list[this._head];
};
/**
 * Alias for peek()
 * @returns {*}
 */


Denque.prototype.peekFront = function peekFront() {
  return this.peek();
};
/**
 * Returns the item that is at the back of the queue without removing it.
 * Uses peekAt(-1)
 */


Denque.prototype.peekBack = function peekBack() {
  return this.peekAt(-1);
};
/**
 * Returns the current length of the queue
 * @return {Number}
 */


Object.defineProperty(Denque.prototype, 'length', {
  get: function length() {
    return this.size();
  }
});
/**
 * Return the number of items on the list, or 0 if empty.
 * @returns {number}
 */

Denque.prototype.size = function size() {
  if (this._head === this._tail) return 0;
  if (this._head < this._tail) return this._tail - this._head;else return this._capacityMask + 1 - (this._head - this._tail);
};
/**
 * Add an item at the beginning of the list.
 * @param item
 */


Denque.prototype.unshift = function unshift(item) {
  if (item === undefined) return this.size();
  var len = this._list.length;
  this._head = this._head - 1 + len & this._capacityMask;
  this._list[this._head] = item;
  if (this._tail === this._head) this._growArray();
  if (this._head < this._tail) return this._tail - this._head;else return this._capacityMask + 1 - (this._head - this._tail);
};
/**
 * Remove and return the first item on the list,
 * Returns undefined if the list is empty.
 * @returns {*}
 */


Denque.prototype.shift = function shift() {
  var head = this._head;
  if (head === this._tail) return undefined;
  var item = this._list[head];
  this._list[head] = undefined;
  this._head = head + 1 & this._capacityMask;
  if (head < 2 && this._tail > 10000 && this._tail <= this._list.length >>> 2) this._shrinkArray();
  return item;
};
/**
 * Add an item to the bottom of the list.
 * @param item
 */


Denque.prototype.push = function push(item) {
  if (item === undefined) return this.size();
  var tail = this._tail;
  this._list[tail] = item;
  this._tail = tail + 1 & this._capacityMask;

  if (this._tail === this._head) {
    this._growArray();
  }

  if (this._head < this._tail) return this._tail - this._head;else return this._capacityMask + 1 - (this._head - this._tail);
};
/**
 * Remove and return the last item on the list.
 * Returns undefined if the list is empty.
 * @returns {*}
 */


Denque.prototype.pop = function pop() {
  var tail = this._tail;
  if (tail === this._head) return undefined;
  var len = this._list.length;
  this._tail = tail - 1 + len & this._capacityMask;
  var item = this._list[this._tail];
  this._list[this._tail] = undefined;
  if (this._head < 2 && tail > 10000 && tail <= len >>> 2) this._shrinkArray();
  return item;
};
/**
 * Remove and return the item at the specified index from the list.
 * Returns undefined if the list is empty.
 * @param index
 * @returns {*}
 */


Denque.prototype.removeOne = function removeOne(index) {
  var i = index; // expect a number or return undefined

  if (i !== (i | 0)) {
    return void 0;
  }

  if (this._head === this._tail) return void 0;
  var size = this.size();
  var len = this._list.length;
  if (i >= size || i < -size) return void 0;
  if (i < 0) i += size;
  i = this._head + i & this._capacityMask;
  var item = this._list[i];
  var k;

  if (index < size / 2) {
    for (k = index; k > 0; k--) {
      this._list[i] = this._list[i = i - 1 + len & this._capacityMask];
    }

    this._list[i] = void 0;
    this._head = this._head + 1 + len & this._capacityMask;
  } else {
    for (k = size - 1 - index; k > 0; k--) {
      this._list[i] = this._list[i = i + 1 + len & this._capacityMask];
    }

    this._list[i] = void 0;
    this._tail = this._tail - 1 + len & this._capacityMask;
  }

  return item;
};
/**
 * Remove number of items from the specified index from the list.
 * Returns array of removed items.
 * Returns undefined if the list is empty.
 * @param index
 * @param count
 * @returns {array}
 */


Denque.prototype.remove = function remove(index, count) {
  var i = index;
  var removed;
  var del_count = count; // expect a number or return undefined

  if (i !== (i | 0)) {
    return void 0;
  }

  if (this._head === this._tail) return void 0;
  var size = this.size();
  var len = this._list.length;
  if (i >= size || i < -size || count < 1) return void 0;
  if (i < 0) i += size;

  if (count === 1 || !count) {
    removed = new Array(1);
    removed[0] = this.removeOne(i);
    return removed;
  }

  if (i === 0 && i + count >= size) {
    removed = this.toArray();
    this.clear();
    return removed;
  }

  if (i + count > size) count = size - i;
  var k;
  removed = new Array(count);

  for (k = 0; k < count; k++) {
    removed[k] = this._list[this._head + i + k & this._capacityMask];
  }

  i = this._head + i & this._capacityMask;

  if (index + count === size) {
    this._tail = this._tail - count + len & this._capacityMask;

    for (k = count; k > 0; k--) {
      this._list[i = i + 1 + len & this._capacityMask] = void 0;
    }

    return removed;
  }

  if (index === 0) {
    this._head = this._head + count + len & this._capacityMask;

    for (k = count - 1; k > 0; k--) {
      this._list[i = i + 1 + len & this._capacityMask] = void 0;
    }

    return removed;
  }

  if (index < size / 2) {
    this._head = this._head + index + count + len & this._capacityMask;

    for (k = index; k > 0; k--) {
      this.unshift(this._list[i = i - 1 + len & this._capacityMask]);
    }

    i = this._head - 1 + len & this._capacityMask;

    while (del_count > 0) {
      this._list[i = i - 1 + len & this._capacityMask] = void 0;
      del_count--;
    }
  } else {
    this._tail = i;
    i = i + count + len & this._capacityMask;

    for (k = size - (count + index); k > 0; k--) {
      this.push(this._list[i++]);
    }

    i = this._tail;

    while (del_count > 0) {
      this._list[i = i + 1 + len & this._capacityMask] = void 0;
      del_count--;
    }
  }

  if (this._head < 2 && this._tail > 10000 && this._tail <= len >>> 2) this._shrinkArray();
  return removed;
};
/**
 * Native splice implementation.
 * Remove number of items from the specified index from the list and/or add new elements.
 * Returns array of removed items or empty array if count == 0.
 * Returns undefined if the list is empty.
 *
 * @param index
 * @param count
 * @param {...*} [elements]
 * @returns {array}
 */


Denque.prototype.splice = function splice(index, count) {
  var i = index; // expect a number or return undefined

  if (i !== (i | 0)) {
    return void 0;
  }

  var size = this.size();
  if (i < 0) i += size;
  if (i > size) return void 0;

  if (arguments.length > 2) {
    var k;
    var temp;
    var removed;
    var arg_len = arguments.length;
    var len = this._list.length;
    var arguments_index = 2;

    if (!size || i < size / 2) {
      temp = new Array(i);

      for (k = 0; k < i; k++) {
        temp[k] = this._list[this._head + k & this._capacityMask];
      }

      if (count === 0) {
        removed = [];

        if (i > 0) {
          this._head = this._head + i + len & this._capacityMask;
        }
      } else {
        removed = this.remove(i, count);
        this._head = this._head + i + len & this._capacityMask;
      }

      while (arg_len > arguments_index) {
        this.unshift(arguments[--arg_len]);
      }

      for (k = i; k > 0; k--) {
        this.unshift(temp[k - 1]);
      }
    } else {
      temp = new Array(size - (i + count));
      var leng = temp.length;

      for (k = 0; k < leng; k++) {
        temp[k] = this._list[this._head + i + count + k & this._capacityMask];
      }

      if (count === 0) {
        removed = [];

        if (i != size) {
          this._tail = this._head + i + len & this._capacityMask;
        }
      } else {
        removed = this.remove(i, count);
        this._tail = this._tail - leng + len & this._capacityMask;
      }

      while (arguments_index < arg_len) {
        this.push(arguments[arguments_index++]);
      }

      for (k = 0; k < leng; k++) {
        this.push(temp[k]);
      }
    }

    return removed;
  } else {
    return this.remove(i, count);
  }
};
/**
 * Soft clear - does not reset capacity.
 */


Denque.prototype.clear = function clear() {
  this._head = 0;
  this._tail = 0;
};
/**
 * Returns true or false whether the list is empty.
 * @returns {boolean}
 */


Denque.prototype.isEmpty = function isEmpty() {
  return this._head === this._tail;
};
/**
 * Returns an array of all queue items.
 * @returns {Array}
 */


Denque.prototype.toArray = function toArray() {
  return this._copyArray(false);
};
/**
 * -------------
 *   INTERNALS
 * -------------
 */

/**
 * Fills the queue with items from an array
 * For use in the constructor
 * @param array
 * @private
 */


Denque.prototype._fromArray = function _fromArray(array) {
  for (var i = 0; i < array.length; i++) this.push(array[i]);
};
/**
 *
 * @param fullCopy
 * @returns {Array}
 * @private
 */


Denque.prototype._copyArray = function _copyArray(fullCopy) {
  var newArray = [];
  var list = this._list;
  var len = list.length;
  var i;

  if (fullCopy || this._head > this._tail) {
    for (i = this._head; i < len; i++) newArray.push(list[i]);

    for (i = 0; i < this._tail; i++) newArray.push(list[i]);
  } else {
    for (i = this._head; i < this._tail; i++) newArray.push(list[i]);
  }

  return newArray;
};
/**
 * Grows the internal list array.
 * @private
 */


Denque.prototype._growArray = function _growArray() {
  if (this._head) {
    // copy existing data, head to end, then beginning to tail.
    this._list = this._copyArray(true);
    this._head = 0;
  } // head is at 0 and array is now full, safe to extend


  this._tail = this._list.length;
  this._list.length *= 2;
  this._capacityMask = this._capacityMask << 1 | 1;
};
/**
 * Shrinks the internal list array.
 * @private
 */


Denque.prototype._shrinkArray = function _shrinkArray() {
  this._list.length >>>= 1;
  this._capacityMask >>>= 1;
};

module.exports = Denque;
},{}],"yh9p":[function(require,module,exports) {
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],"JgNJ":[function(require,module,exports) {
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],"REa7":[function(require,module,exports) {
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],"dskh":[function(require,module,exports) {

var global = arguments[3];
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

},{"base64-js":"yh9p","ieee754":"JgNJ","isarray":"REa7","buffer":"dskh"}],"mM7N":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
/* globals Buffer */

module.exports =
  c(("undefined" !== typeof Buffer) && Buffer) ||
  c(this.Buffer) ||
  c(("undefined" !== typeof window) && window.Buffer) ||
  this.Buffer;

function c(B) {
  return B && B.isBuffer && B;
}
},{"buffer":"dskh"}],"n6gU":[function(require,module,exports) {
// bufferish-array.js

var Bufferish = require("./bufferish");

var exports = module.exports = alloc(0);

exports.alloc = alloc;
exports.concat = Bufferish.concat;
exports.from = from;

/**
 * @param size {Number}
 * @returns {Buffer|Uint8Array|Array}
 */

function alloc(size) {
  return new Array(size);
}

/**
 * @param value {Array|ArrayBuffer|Buffer|String}
 * @returns {Array}
 */

function from(value) {
  if (!Bufferish.isBuffer(value) && Bufferish.isView(value)) {
    // TypedArray to Uint8Array
    value = Bufferish.Uint8Array.from(value);
  } else if (Bufferish.isArrayBuffer(value)) {
    // ArrayBuffer to Uint8Array
    value = new Uint8Array(value);
  } else if (typeof value === "string") {
    // String to Array
    return Bufferish.from.call(exports, value);
  } else if (typeof value === "number") {
    throw new TypeError('"value" argument must not be a number');
  }

  // Array-like to Array
  return Array.prototype.slice.call(value);
}

},{"./bufferish":"/pso"}],"JxGr":[function(require,module,exports) {

// bufferish-buffer.js

var Bufferish = require("./bufferish");
var Buffer = Bufferish.global;

var exports = module.exports = Bufferish.hasBuffer ? alloc(0) : [];

exports.alloc = Bufferish.hasBuffer && Buffer.alloc || alloc;
exports.concat = Bufferish.concat;
exports.from = from;

/**
 * @param size {Number}
 * @returns {Buffer|Uint8Array|Array}
 */

function alloc(size) {
  return new Buffer(size);
}

/**
 * @param value {Array|ArrayBuffer|Buffer|String}
 * @returns {Buffer}
 */

function from(value) {
  if (!Bufferish.isBuffer(value) && Bufferish.isView(value)) {
    // TypedArray to Uint8Array
    value = Bufferish.Uint8Array.from(value);
  } else if (Bufferish.isArrayBuffer(value)) {
    // ArrayBuffer to Uint8Array
    value = new Uint8Array(value);
  } else if (typeof value === "string") {
    // String to Buffer
    return Bufferish.from.call(exports, value);
  } else if (typeof value === "number") {
    throw new TypeError('"value" argument must not be a number');
  }

  // Array-like to Buffer
  if (Buffer.from && Buffer.from.length !== 1) {
    return Buffer.from(value); // node v6+
  } else {
    return new Buffer(value); // node v4
  }
}

},{"./bufferish":"/pso"}],"v8cf":[function(require,module,exports) {
// bufferish-uint8array.js

var Bufferish = require("./bufferish");

var exports = module.exports = Bufferish.hasArrayBuffer ? alloc(0) : [];

exports.alloc = alloc;
exports.concat = Bufferish.concat;
exports.from = from;

/**
 * @param size {Number}
 * @returns {Buffer|Uint8Array|Array}
 */

function alloc(size) {
  return new Uint8Array(size);
}

/**
 * @param value {Array|ArrayBuffer|Buffer|String}
 * @returns {Uint8Array}
 */

function from(value) {
  if (Bufferish.isView(value)) {
    // TypedArray to ArrayBuffer
    var byteOffset = value.byteOffset;
    var byteLength = value.byteLength;
    value = value.buffer;
    if (value.byteLength !== byteLength) {
      if (value.slice) {
        value = value.slice(byteOffset, byteOffset + byteLength);
      } else {
        // Android 4.1 does not have ArrayBuffer.prototype.slice
        value = new Uint8Array(value);
        if (value.byteLength !== byteLength) {
          // TypedArray to ArrayBuffer to Uint8Array to Array
          value = Array.prototype.slice.call(value, byteOffset, byteOffset + byteLength);
        }
      }
    }
  } else if (typeof value === "string") {
    // String to Uint8Array
    return Bufferish.from.call(exports, value);
  } else if (typeof value === "number") {
    throw new TypeError('"value" argument must not be a number');
  }

  return new Uint8Array(value);
}

},{"./bufferish":"/pso"}],"wZ7Y":[function(require,module,exports) {
// buffer-lite.js

var MAXBUFLEN = 8192;

exports.copy = copy;
exports.toString = toString;
exports.write = write;

/**
 * Buffer.prototype.write()
 *
 * @param string {String}
 * @param [offset] {Number}
 * @returns {Number}
 */

function write(string, offset) {
  var buffer = this;
  var index = offset || (offset |= 0);
  var length = string.length;
  var chr = 0;
  var i = 0;
  while (i < length) {
    chr = string.charCodeAt(i++);

    if (chr < 128) {
      buffer[index++] = chr;
    } else if (chr < 0x800) {
      // 2 bytes
      buffer[index++] = 0xC0 | (chr >>> 6);
      buffer[index++] = 0x80 | (chr & 0x3F);
    } else if (chr < 0xD800 || chr > 0xDFFF) {
      // 3 bytes
      buffer[index++] = 0xE0 | (chr  >>> 12);
      buffer[index++] = 0x80 | ((chr >>> 6)  & 0x3F);
      buffer[index++] = 0x80 | (chr          & 0x3F);
    } else {
      // 4 bytes - surrogate pair
      chr = (((chr - 0xD800) << 10) | (string.charCodeAt(i++) - 0xDC00)) + 0x10000;
      buffer[index++] = 0xF0 | (chr >>> 18);
      buffer[index++] = 0x80 | ((chr >>> 12) & 0x3F);
      buffer[index++] = 0x80 | ((chr >>> 6)  & 0x3F);
      buffer[index++] = 0x80 | (chr          & 0x3F);
    }
  }
  return index - offset;
}

/**
 * Buffer.prototype.toString()
 *
 * @param [encoding] {String} ignored
 * @param [start] {Number}
 * @param [end] {Number}
 * @returns {String}
 */

function toString(encoding, start, end) {
  var buffer = this;
  var index = start|0;
  if (!end) end = buffer.length;
  var string = '';
  var chr = 0;

  while (index < end) {
    chr = buffer[index++];
    if (chr < 128) {
      string += String.fromCharCode(chr);
      continue;
    }

    if ((chr & 0xE0) === 0xC0) {
      // 2 bytes
      chr = (chr & 0x1F) << 6 |
            (buffer[index++] & 0x3F);

    } else if ((chr & 0xF0) === 0xE0) {
      // 3 bytes
      chr = (chr & 0x0F)             << 12 |
            (buffer[index++] & 0x3F) << 6  |
            (buffer[index++] & 0x3F);

    } else if ((chr & 0xF8) === 0xF0) {
      // 4 bytes
      chr = (chr & 0x07)             << 18 |
            (buffer[index++] & 0x3F) << 12 |
            (buffer[index++] & 0x3F) << 6  |
            (buffer[index++] & 0x3F);
    }

    if (chr >= 0x010000) {
      // A surrogate pair
      chr -= 0x010000;

      string += String.fromCharCode((chr >>> 10) + 0xD800, (chr & 0x3FF) + 0xDC00);
    } else {
      string += String.fromCharCode(chr);
    }
  }

  return string;
}

/**
 * Buffer.prototype.copy()
 *
 * @param target {Buffer}
 * @param [targetStart] {Number}
 * @param [start] {Number}
 * @param [end] {Number}
 * @returns {number}
 */

function copy(target, targetStart, start, end) {
  var i;
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (!targetStart) targetStart = 0;
  var len = end - start;

  if (target === this && start < targetStart && targetStart < end) {
    // descending
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    // ascending
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start];
    }
  }

  return len;
}

},{}],"GNC6":[function(require,module,exports) {

// bufferish-proto.js

/* jshint eqnull:true */

var BufferLite = require("./buffer-lite");

exports.copy = copy;
exports.slice = slice;
exports.toString = toString;
exports.write = gen("write");

var Bufferish = require("./bufferish");
var Buffer = Bufferish.global;

var isBufferShim = Bufferish.hasBuffer && ("TYPED_ARRAY_SUPPORT" in Buffer);
var brokenTypedArray = isBufferShim && !Buffer.TYPED_ARRAY_SUPPORT;

/**
 * @param target {Buffer|Uint8Array|Array}
 * @param [targetStart] {Number}
 * @param [start] {Number}
 * @param [end] {Number}
 * @returns {Buffer|Uint8Array|Array}
 */

function copy(target, targetStart, start, end) {
  var thisIsBuffer = Bufferish.isBuffer(this);
  var targetIsBuffer = Bufferish.isBuffer(target);
  if (thisIsBuffer && targetIsBuffer) {
    // Buffer to Buffer
    return this.copy(target, targetStart, start, end);
  } else if (!brokenTypedArray && !thisIsBuffer && !targetIsBuffer &&
    Bufferish.isView(this) && Bufferish.isView(target)) {
    // Uint8Array to Uint8Array (except for minor some browsers)
    var buffer = (start || end != null) ? slice.call(this, start, end) : this;
    target.set(buffer, targetStart);
    return buffer.length;
  } else {
    // other cases
    return BufferLite.copy.call(this, target, targetStart, start, end);
  }
}

/**
 * @param [start] {Number}
 * @param [end] {Number}
 * @returns {Buffer|Uint8Array|Array}
 */

function slice(start, end) {
  // for Buffer, Uint8Array (except for minor some browsers) and Array
  var f = this.slice || (!brokenTypedArray && this.subarray);
  if (f) return f.call(this, start, end);

  // Uint8Array (for minor some browsers)
  var target = Bufferish.alloc.call(this, end - start);
  copy.call(this, target, 0, start, end);
  return target;
}

/**
 * Buffer.prototype.toString()
 *
 * @param [encoding] {String} ignored
 * @param [start] {Number}
 * @param [end] {Number}
 * @returns {String}
 */

function toString(encoding, start, end) {
  var f = (!isBufferShim && Bufferish.isBuffer(this)) ? this.toString : BufferLite.toString;
  return f.apply(this, arguments);
}

/**
 * @private
 */

function gen(method) {
  return wrap;

  function wrap() {
    var f = this[method] || BufferLite[method];
    return f.apply(this, arguments);
  }
}

},{"./buffer-lite":"wZ7Y","./bufferish":"/pso"}],"/pso":[function(require,module,exports) {

// bufferish.js

var Buffer = exports.global = require("./buffer-global");
var hasBuffer = exports.hasBuffer = Buffer && !!Buffer.isBuffer;
var hasArrayBuffer = exports.hasArrayBuffer = ("undefined" !== typeof ArrayBuffer);

var isArray = exports.isArray = require("isarray");
exports.isArrayBuffer = hasArrayBuffer ? isArrayBuffer : _false;
var isBuffer = exports.isBuffer = hasBuffer ? Buffer.isBuffer : _false;
var isView = exports.isView = hasArrayBuffer ? (ArrayBuffer.isView || _is("ArrayBuffer", "buffer")) : _false;

exports.alloc = alloc;
exports.concat = concat;
exports.from = from;

var BufferArray = exports.Array = require("./bufferish-array");
var BufferBuffer = exports.Buffer = require("./bufferish-buffer");
var BufferUint8Array = exports.Uint8Array = require("./bufferish-uint8array");
var BufferProto = exports.prototype = require("./bufferish-proto");

/**
 * @param value {Array|ArrayBuffer|Buffer|String}
 * @returns {Buffer|Uint8Array|Array}
 */

function from(value) {
  if (typeof value === "string") {
    return fromString.call(this, value);
  } else {
    return auto(this).from(value);
  }
}

/**
 * @param size {Number}
 * @returns {Buffer|Uint8Array|Array}
 */

function alloc(size) {
  return auto(this).alloc(size);
}

/**
 * @param list {Array} array of (Buffer|Uint8Array|Array)s
 * @param [length]
 * @returns {Buffer|Uint8Array|Array}
 */

function concat(list, length) {
  if (!length) {
    length = 0;
    Array.prototype.forEach.call(list, dryrun);
  }
  var ref = (this !== exports) && this || list[0];
  var result = alloc.call(ref, length);
  var offset = 0;
  Array.prototype.forEach.call(list, append);
  return result;

  function dryrun(buffer) {
    length += buffer.length;
  }

  function append(buffer) {
    offset += BufferProto.copy.call(buffer, result, offset);
  }
}

var _isArrayBuffer = _is("ArrayBuffer");

function isArrayBuffer(value) {
  return (value instanceof ArrayBuffer) || _isArrayBuffer(value);
}

/**
 * @private
 */

function fromString(value) {
  var expected = value.length * 3;
  var that = alloc.call(this, expected);
  var actual = BufferProto.write.call(that, value);
  if (expected !== actual) {
    that = BufferProto.slice.call(that, 0, actual);
  }
  return that;
}

function auto(that) {
  return isBuffer(that) ? BufferBuffer
    : isView(that) ? BufferUint8Array
    : isArray(that) ? BufferArray
    : hasBuffer ? BufferBuffer
    : hasArrayBuffer ? BufferUint8Array
    : BufferArray;
}

function _false() {
  return false;
}

function _is(name, key) {
  /* jshint eqnull:true */
  name = "[object " + name + "]";
  return function(value) {
    return (value != null) && {}.toString.call(key ? value[key] : value) === name;
  };
}
},{"./buffer-global":"mM7N","isarray":"REa7","./bufferish-array":"n6gU","./bufferish-buffer":"JxGr","./bufferish-uint8array":"v8cf","./bufferish-proto":"GNC6"}],"tfA6":[function(require,module,exports) {
// ext-buffer.js

exports.ExtBuffer = ExtBuffer;

var Bufferish = require("./bufferish");

function ExtBuffer(buffer, type) {
  if (!(this instanceof ExtBuffer)) return new ExtBuffer(buffer, type);
  this.buffer = Bufferish.from(buffer);
  this.type = type;
}

},{"./bufferish":"/pso"}],"83P4":[function(require,module,exports) {

// ext-packer.js

exports.setExtPackers = setExtPackers;

var Bufferish = require("./bufferish");
var Buffer = Bufferish.global;
var packTypedArray = Bufferish.Uint8Array.from;
var _encode;

var ERROR_COLUMNS = {name: 1, message: 1, stack: 1, columnNumber: 1, fileName: 1, lineNumber: 1};

function setExtPackers(codec) {
  codec.addExtPacker(0x0E, Error, [packError, encode]);
  codec.addExtPacker(0x01, EvalError, [packError, encode]);
  codec.addExtPacker(0x02, RangeError, [packError, encode]);
  codec.addExtPacker(0x03, ReferenceError, [packError, encode]);
  codec.addExtPacker(0x04, SyntaxError, [packError, encode]);
  codec.addExtPacker(0x05, TypeError, [packError, encode]);
  codec.addExtPacker(0x06, URIError, [packError, encode]);

  codec.addExtPacker(0x0A, RegExp, [packRegExp, encode]);
  codec.addExtPacker(0x0B, Boolean, [packValueOf, encode]);
  codec.addExtPacker(0x0C, String, [packValueOf, encode]);
  codec.addExtPacker(0x0D, Date, [Number, encode]);
  codec.addExtPacker(0x0F, Number, [packValueOf, encode]);

  if ("undefined" !== typeof Uint8Array) {
    codec.addExtPacker(0x11, Int8Array, packTypedArray);
    codec.addExtPacker(0x12, Uint8Array, packTypedArray);
    codec.addExtPacker(0x13, Int16Array, packTypedArray);
    codec.addExtPacker(0x14, Uint16Array, packTypedArray);
    codec.addExtPacker(0x15, Int32Array, packTypedArray);
    codec.addExtPacker(0x16, Uint32Array, packTypedArray);
    codec.addExtPacker(0x17, Float32Array, packTypedArray);

    // PhantomJS/1.9.7 doesn't have Float64Array
    if ("undefined" !== typeof Float64Array) {
      codec.addExtPacker(0x18, Float64Array, packTypedArray);
    }

    // IE10 doesn't have Uint8ClampedArray
    if ("undefined" !== typeof Uint8ClampedArray) {
      codec.addExtPacker(0x19, Uint8ClampedArray, packTypedArray);
    }

    codec.addExtPacker(0x1A, ArrayBuffer, packTypedArray);
    codec.addExtPacker(0x1D, DataView, packTypedArray);
  }

  if (Bufferish.hasBuffer) {
    codec.addExtPacker(0x1B, Buffer, Bufferish.from);
  }
}

function encode(input) {
  if (!_encode) _encode = require("./encode").encode; // lazy load
  return _encode(input);
}

function packValueOf(value) {
  return (value).valueOf();
}

function packRegExp(value) {
  value = RegExp.prototype.toString.call(value).split("/");
  value.shift();
  var out = [value.pop()];
  out.unshift(value.join("/"));
  return out;
}

function packError(value) {
  var out = {};
  for (var key in ERROR_COLUMNS) {
    out[key] = value[key];
  }
  return out;
}

},{"./bufferish":"/pso","./encode":"bz2C"}],"dpz9":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
// int64-buffer.js

/*jshint -W018 */ // Confusing use of '!'.
/*jshint -W030 */ // Expected an assignment or function call and instead saw an expression.
/*jshint -W093 */ // Did you mean to return a conditional instead of an assignment?

var Uint64BE, Int64BE, Uint64LE, Int64LE;

!function(exports) {
  // constants

  var UNDEFINED = "undefined";
  var BUFFER = (UNDEFINED !== typeof Buffer) && Buffer;
  var UINT8ARRAY = (UNDEFINED !== typeof Uint8Array) && Uint8Array;
  var ARRAYBUFFER = (UNDEFINED !== typeof ArrayBuffer) && ArrayBuffer;
  var ZERO = [0, 0, 0, 0, 0, 0, 0, 0];
  var isArray = Array.isArray || _isArray;
  var BIT32 = 4294967296;
  var BIT24 = 16777216;

  // storage class

  var storage; // Array;

  // generate classes

  Uint64BE = factory("Uint64BE", true, true);
  Int64BE = factory("Int64BE", true, false);
  Uint64LE = factory("Uint64LE", false, true);
  Int64LE = factory("Int64LE", false, false);

  // class factory

  function factory(name, bigendian, unsigned) {
    var posH = bigendian ? 0 : 4;
    var posL = bigendian ? 4 : 0;
    var pos0 = bigendian ? 0 : 3;
    var pos1 = bigendian ? 1 : 2;
    var pos2 = bigendian ? 2 : 1;
    var pos3 = bigendian ? 3 : 0;
    var fromPositive = bigendian ? fromPositiveBE : fromPositiveLE;
    var fromNegative = bigendian ? fromNegativeBE : fromNegativeLE;
    var proto = Int64.prototype;
    var isName = "is" + name;
    var _isInt64 = "_" + isName;

    // properties
    proto.buffer = void 0;
    proto.offset = 0;
    proto[_isInt64] = true;

    // methods
    proto.toNumber = toNumber;
    proto.toString = toString;
    proto.toJSON = toNumber;
    proto.toArray = toArray;

    // add .toBuffer() method only when Buffer available
    if (BUFFER) proto.toBuffer = toBuffer;

    // add .toArrayBuffer() method only when Uint8Array available
    if (UINT8ARRAY) proto.toArrayBuffer = toArrayBuffer;

    // isUint64BE, isInt64BE
    Int64[isName] = isInt64;

    // CommonJS
    exports[name] = Int64;

    return Int64;

    // constructor
    function Int64(buffer, offset, value, raddix) {
      if (!(this instanceof Int64)) return new Int64(buffer, offset, value, raddix);
      return init(this, buffer, offset, value, raddix);
    }

    // isUint64BE, isInt64BE
    function isInt64(b) {
      return !!(b && b[_isInt64]);
    }

    // initializer
    function init(that, buffer, offset, value, raddix) {
      if (UINT8ARRAY && ARRAYBUFFER) {
        if (buffer instanceof ARRAYBUFFER) buffer = new UINT8ARRAY(buffer);
        if (value instanceof ARRAYBUFFER) value = new UINT8ARRAY(value);
      }

      // Int64BE() style
      if (!buffer && !offset && !value && !storage) {
        // shortcut to initialize with zero
        that.buffer = newArray(ZERO, 0);
        return;
      }

      // Int64BE(value, raddix) style
      if (!isValidBuffer(buffer, offset)) {
        var _storage = storage || Array;
        raddix = offset;
        value = buffer;
        offset = 0;
        buffer = new _storage(8);
      }

      that.buffer = buffer;
      that.offset = offset |= 0;

      // Int64BE(buffer, offset) style
      if (UNDEFINED === typeof value) return;

      // Int64BE(buffer, offset, value, raddix) style
      if ("string" === typeof value) {
        fromString(buffer, offset, value, raddix || 10);
      } else if (isValidBuffer(value, raddix)) {
        fromArray(buffer, offset, value, raddix);
      } else if ("number" === typeof raddix) {
        writeInt32(buffer, offset + posH, value); // high
        writeInt32(buffer, offset + posL, raddix); // low
      } else if (value > 0) {
        fromPositive(buffer, offset, value); // positive
      } else if (value < 0) {
        fromNegative(buffer, offset, value); // negative
      } else {
        fromArray(buffer, offset, ZERO, 0); // zero, NaN and others
      }
    }

    function fromString(buffer, offset, str, raddix) {
      var pos = 0;
      var len = str.length;
      var high = 0;
      var low = 0;
      if (str[0] === "-") pos++;
      var sign = pos;
      while (pos < len) {
        var chr = parseInt(str[pos++], raddix);
        if (!(chr >= 0)) break; // NaN
        low = low * raddix + chr;
        high = high * raddix + Math.floor(low / BIT32);
        low %= BIT32;
      }
      if (sign) {
        high = ~high;
        if (low) {
          low = BIT32 - low;
        } else {
          high++;
        }
      }
      writeInt32(buffer, offset + posH, high);
      writeInt32(buffer, offset + posL, low);
    }

    function toNumber() {
      var buffer = this.buffer;
      var offset = this.offset;
      var high = readInt32(buffer, offset + posH);
      var low = readInt32(buffer, offset + posL);
      if (!unsigned) high |= 0; // a trick to get signed
      return high ? (high * BIT32 + low) : low;
    }

    function toString(radix) {
      var buffer = this.buffer;
      var offset = this.offset;
      var high = readInt32(buffer, offset + posH);
      var low = readInt32(buffer, offset + posL);
      var str = "";
      var sign = !unsigned && (high & 0x80000000);
      if (sign) {
        high = ~high;
        low = BIT32 - low;
      }
      radix = radix || 10;
      while (1) {
        var mod = (high % radix) * BIT32 + low;
        high = Math.floor(high / radix);
        low = Math.floor(mod / radix);
        str = (mod % radix).toString(radix) + str;
        if (!high && !low) break;
      }
      if (sign) {
        str = "-" + str;
      }
      return str;
    }

    function writeInt32(buffer, offset, value) {
      buffer[offset + pos3] = value & 255;
      value = value >> 8;
      buffer[offset + pos2] = value & 255;
      value = value >> 8;
      buffer[offset + pos1] = value & 255;
      value = value >> 8;
      buffer[offset + pos0] = value & 255;
    }

    function readInt32(buffer, offset) {
      return (buffer[offset + pos0] * BIT24) +
        (buffer[offset + pos1] << 16) +
        (buffer[offset + pos2] << 8) +
        buffer[offset + pos3];
    }
  }

  function toArray(raw) {
    var buffer = this.buffer;
    var offset = this.offset;
    storage = null; // Array
    if (raw !== false && offset === 0 && buffer.length === 8 && isArray(buffer)) return buffer;
    return newArray(buffer, offset);
  }

  function toBuffer(raw) {
    var buffer = this.buffer;
    var offset = this.offset;
    storage = BUFFER;
    if (raw !== false && offset === 0 && buffer.length === 8 && Buffer.isBuffer(buffer)) return buffer;
    var dest = new BUFFER(8);
    fromArray(dest, 0, buffer, offset);
    return dest;
  }

  function toArrayBuffer(raw) {
    var buffer = this.buffer;
    var offset = this.offset;
    var arrbuf = buffer.buffer;
    storage = UINT8ARRAY;
    if (raw !== false && offset === 0 && (arrbuf instanceof ARRAYBUFFER) && arrbuf.byteLength === 8) return arrbuf;
    var dest = new UINT8ARRAY(8);
    fromArray(dest, 0, buffer, offset);
    return dest.buffer;
  }

  function isValidBuffer(buffer, offset) {
    var len = buffer && buffer.length;
    offset |= 0;
    return len && (offset + 8 <= len) && ("string" !== typeof buffer[offset]);
  }

  function fromArray(destbuf, destoff, srcbuf, srcoff) {
    destoff |= 0;
    srcoff |= 0;
    for (var i = 0; i < 8; i++) {
      destbuf[destoff++] = srcbuf[srcoff++] & 255;
    }
  }

  function newArray(buffer, offset) {
    return Array.prototype.slice.call(buffer, offset, offset + 8);
  }

  function fromPositiveBE(buffer, offset, value) {
    var pos = offset + 8;
    while (pos > offset) {
      buffer[--pos] = value & 255;
      value /= 256;
    }
  }

  function fromNegativeBE(buffer, offset, value) {
    var pos = offset + 8;
    value++;
    while (pos > offset) {
      buffer[--pos] = ((-value) & 255) ^ 255;
      value /= 256;
    }
  }

  function fromPositiveLE(buffer, offset, value) {
    var end = offset + 8;
    while (offset < end) {
      buffer[offset++] = value & 255;
      value /= 256;
    }
  }

  function fromNegativeLE(buffer, offset, value) {
    var end = offset + 8;
    value++;
    while (offset < end) {
      buffer[offset++] = ((-value) & 255) ^ 255;
      value /= 256;
    }
  }

  // https://github.com/retrofox/is-array
  function _isArray(val) {
    return !!val && "[object Array]" == Object.prototype.toString.call(val);
  }

}(typeof exports === 'object' && typeof exports.nodeName !== 'string' ? exports : (this || {}));

},{"buffer":"dskh"}],"fpjG":[function(require,module,exports) {
// write-unit8.js

var constant = exports.uint8 = new Array(256);

for (var i = 0x00; i <= 0xFF; i++) {
  constant[i] = write0(i);
}

function write0(type) {
  return function(encoder) {
    var offset = encoder.reserve(1);
    encoder.buffer[offset] = type;
  };
}

},{}],"k6wB":[function(require,module,exports) {

// write-token.js

var ieee754 = require("ieee754");
var Int64Buffer = require("int64-buffer");
var Uint64BE = Int64Buffer.Uint64BE;
var Int64BE = Int64Buffer.Int64BE;

var uint8 = require("./write-uint8").uint8;
var Bufferish = require("./bufferish");
var Buffer = Bufferish.global;
var IS_BUFFER_SHIM = Bufferish.hasBuffer && ("TYPED_ARRAY_SUPPORT" in Buffer);
var NO_TYPED_ARRAY = IS_BUFFER_SHIM && !Buffer.TYPED_ARRAY_SUPPORT;
var Buffer_prototype = Bufferish.hasBuffer && Buffer.prototype || {};

exports.getWriteToken = getWriteToken;

function getWriteToken(options) {
  if (options && options.uint8array) {
    return init_uint8array();
  } else if (NO_TYPED_ARRAY || (Bufferish.hasBuffer && options && options.safe)) {
    return init_safe();
  } else {
    return init_token();
  }
}

function init_uint8array() {
  var token = init_token();

  // float 32 -- 0xca
  // float 64 -- 0xcb
  token[0xca] = writeN(0xca, 4, writeFloatBE);
  token[0xcb] = writeN(0xcb, 8, writeDoubleBE);

  return token;
}

// Node.js and browsers with TypedArray

function init_token() {
  // (immediate values)
  // positive fixint -- 0x00 - 0x7f
  // nil -- 0xc0
  // false -- 0xc2
  // true -- 0xc3
  // negative fixint -- 0xe0 - 0xff
  var token = uint8.slice();

  // bin 8 -- 0xc4
  // bin 16 -- 0xc5
  // bin 32 -- 0xc6
  token[0xc4] = write1(0xc4);
  token[0xc5] = write2(0xc5);
  token[0xc6] = write4(0xc6);

  // ext 8 -- 0xc7
  // ext 16 -- 0xc8
  // ext 32 -- 0xc9
  token[0xc7] = write1(0xc7);
  token[0xc8] = write2(0xc8);
  token[0xc9] = write4(0xc9);

  // float 32 -- 0xca
  // float 64 -- 0xcb
  token[0xca] = writeN(0xca, 4, (Buffer_prototype.writeFloatBE || writeFloatBE), true);
  token[0xcb] = writeN(0xcb, 8, (Buffer_prototype.writeDoubleBE || writeDoubleBE), true);

  // uint 8 -- 0xcc
  // uint 16 -- 0xcd
  // uint 32 -- 0xce
  // uint 64 -- 0xcf
  token[0xcc] = write1(0xcc);
  token[0xcd] = write2(0xcd);
  token[0xce] = write4(0xce);
  token[0xcf] = writeN(0xcf, 8, writeUInt64BE);

  // int 8 -- 0xd0
  // int 16 -- 0xd1
  // int 32 -- 0xd2
  // int 64 -- 0xd3
  token[0xd0] = write1(0xd0);
  token[0xd1] = write2(0xd1);
  token[0xd2] = write4(0xd2);
  token[0xd3] = writeN(0xd3, 8, writeInt64BE);

  // str 8 -- 0xd9
  // str 16 -- 0xda
  // str 32 -- 0xdb
  token[0xd9] = write1(0xd9);
  token[0xda] = write2(0xda);
  token[0xdb] = write4(0xdb);

  // array 16 -- 0xdc
  // array 32 -- 0xdd
  token[0xdc] = write2(0xdc);
  token[0xdd] = write4(0xdd);

  // map 16 -- 0xde
  // map 32 -- 0xdf
  token[0xde] = write2(0xde);
  token[0xdf] = write4(0xdf);

  return token;
}

// safe mode: for old browsers and who needs asserts

function init_safe() {
  // (immediate values)
  // positive fixint -- 0x00 - 0x7f
  // nil -- 0xc0
  // false -- 0xc2
  // true -- 0xc3
  // negative fixint -- 0xe0 - 0xff
  var token = uint8.slice();

  // bin 8 -- 0xc4
  // bin 16 -- 0xc5
  // bin 32 -- 0xc6
  token[0xc4] = writeN(0xc4, 1, Buffer.prototype.writeUInt8);
  token[0xc5] = writeN(0xc5, 2, Buffer.prototype.writeUInt16BE);
  token[0xc6] = writeN(0xc6, 4, Buffer.prototype.writeUInt32BE);

  // ext 8 -- 0xc7
  // ext 16 -- 0xc8
  // ext 32 -- 0xc9
  token[0xc7] = writeN(0xc7, 1, Buffer.prototype.writeUInt8);
  token[0xc8] = writeN(0xc8, 2, Buffer.prototype.writeUInt16BE);
  token[0xc9] = writeN(0xc9, 4, Buffer.prototype.writeUInt32BE);

  // float 32 -- 0xca
  // float 64 -- 0xcb
  token[0xca] = writeN(0xca, 4, Buffer.prototype.writeFloatBE);
  token[0xcb] = writeN(0xcb, 8, Buffer.prototype.writeDoubleBE);

  // uint 8 -- 0xcc
  // uint 16 -- 0xcd
  // uint 32 -- 0xce
  // uint 64 -- 0xcf
  token[0xcc] = writeN(0xcc, 1, Buffer.prototype.writeUInt8);
  token[0xcd] = writeN(0xcd, 2, Buffer.prototype.writeUInt16BE);
  token[0xce] = writeN(0xce, 4, Buffer.prototype.writeUInt32BE);
  token[0xcf] = writeN(0xcf, 8, writeUInt64BE);

  // int 8 -- 0xd0
  // int 16 -- 0xd1
  // int 32 -- 0xd2
  // int 64 -- 0xd3
  token[0xd0] = writeN(0xd0, 1, Buffer.prototype.writeInt8);
  token[0xd1] = writeN(0xd1, 2, Buffer.prototype.writeInt16BE);
  token[0xd2] = writeN(0xd2, 4, Buffer.prototype.writeInt32BE);
  token[0xd3] = writeN(0xd3, 8, writeInt64BE);

  // str 8 -- 0xd9
  // str 16 -- 0xda
  // str 32 -- 0xdb
  token[0xd9] = writeN(0xd9, 1, Buffer.prototype.writeUInt8);
  token[0xda] = writeN(0xda, 2, Buffer.prototype.writeUInt16BE);
  token[0xdb] = writeN(0xdb, 4, Buffer.prototype.writeUInt32BE);

  // array 16 -- 0xdc
  // array 32 -- 0xdd
  token[0xdc] = writeN(0xdc, 2, Buffer.prototype.writeUInt16BE);
  token[0xdd] = writeN(0xdd, 4, Buffer.prototype.writeUInt32BE);

  // map 16 -- 0xde
  // map 32 -- 0xdf
  token[0xde] = writeN(0xde, 2, Buffer.prototype.writeUInt16BE);
  token[0xdf] = writeN(0xdf, 4, Buffer.prototype.writeUInt32BE);

  return token;
}

function write1(type) {
  return function(encoder, value) {
    var offset = encoder.reserve(2);
    var buffer = encoder.buffer;
    buffer[offset++] = type;
    buffer[offset] = value;
  };
}

function write2(type) {
  return function(encoder, value) {
    var offset = encoder.reserve(3);
    var buffer = encoder.buffer;
    buffer[offset++] = type;
    buffer[offset++] = value >>> 8;
    buffer[offset] = value;
  };
}

function write4(type) {
  return function(encoder, value) {
    var offset = encoder.reserve(5);
    var buffer = encoder.buffer;
    buffer[offset++] = type;
    buffer[offset++] = value >>> 24;
    buffer[offset++] = value >>> 16;
    buffer[offset++] = value >>> 8;
    buffer[offset] = value;
  };
}

function writeN(type, len, method, noAssert) {
  return function(encoder, value) {
    var offset = encoder.reserve(len + 1);
    encoder.buffer[offset++] = type;
    method.call(encoder.buffer, value, offset, noAssert);
  };
}

function writeUInt64BE(value, offset) {
  new Uint64BE(this, offset, value);
}

function writeInt64BE(value, offset) {
  new Int64BE(this, offset, value);
}

function writeFloatBE(value, offset) {
  ieee754.write(this, value, offset, false, 23, 4);
}

function writeDoubleBE(value, offset) {
  ieee754.write(this, value, offset, false, 52, 8);
}

},{"ieee754":"JgNJ","int64-buffer":"dpz9","./write-uint8":"fpjG","./bufferish":"/pso"}],"tNhd":[function(require,module,exports) {
// write-type.js

var IS_ARRAY = require("isarray");
var Int64Buffer = require("int64-buffer");
var Uint64BE = Int64Buffer.Uint64BE;
var Int64BE = Int64Buffer.Int64BE;

var Bufferish = require("./bufferish");
var BufferProto = require("./bufferish-proto");
var WriteToken = require("./write-token");
var uint8 = require("./write-uint8").uint8;
var ExtBuffer = require("./ext-buffer").ExtBuffer;

var HAS_UINT8ARRAY = ("undefined" !== typeof Uint8Array);
var HAS_MAP = ("undefined" !== typeof Map);

var extmap = [];
extmap[1] = 0xd4;
extmap[2] = 0xd5;
extmap[4] = 0xd6;
extmap[8] = 0xd7;
extmap[16] = 0xd8;

exports.getWriteType = getWriteType;

function getWriteType(options) {
  var token = WriteToken.getWriteToken(options);
  var useraw = options && options.useraw;
  var binarraybuffer = HAS_UINT8ARRAY && options && options.binarraybuffer;
  var isBuffer = binarraybuffer ? Bufferish.isArrayBuffer : Bufferish.isBuffer;
  var bin = binarraybuffer ? bin_arraybuffer : bin_buffer;
  var usemap = HAS_MAP && options && options.usemap;
  var map = usemap ? map_to_map : obj_to_map;

  var writeType = {
    "boolean": bool,
    "function": nil,
    "number": number,
    "object": (useraw ? object_raw : object),
    "string": _string(useraw ? raw_head_size : str_head_size),
    "symbol": nil,
    "undefined": nil
  };

  return writeType;

  // false -- 0xc2
  // true -- 0xc3
  function bool(encoder, value) {
    var type = value ? 0xc3 : 0xc2;
    token[type](encoder, value);
  }

  function number(encoder, value) {
    var ivalue = value | 0;
    var type;
    if (value !== ivalue) {
      // float 64 -- 0xcb
      type = 0xcb;
      token[type](encoder, value);
      return;
    } else if (-0x20 <= ivalue && ivalue <= 0x7F) {
      // positive fixint -- 0x00 - 0x7f
      // negative fixint -- 0xe0 - 0xff
      type = ivalue & 0xFF;
    } else if (0 <= ivalue) {
      // uint 8 -- 0xcc
      // uint 16 -- 0xcd
      // uint 32 -- 0xce
      type = (ivalue <= 0xFF) ? 0xcc : (ivalue <= 0xFFFF) ? 0xcd : 0xce;
    } else {
      // int 8 -- 0xd0
      // int 16 -- 0xd1
      // int 32 -- 0xd2
      type = (-0x80 <= ivalue) ? 0xd0 : (-0x8000 <= ivalue) ? 0xd1 : 0xd2;
    }
    token[type](encoder, ivalue);
  }

  // uint 64 -- 0xcf
  function uint64(encoder, value) {
    var type = 0xcf;
    token[type](encoder, value.toArray());
  }

  // int 64 -- 0xd3
  function int64(encoder, value) {
    var type = 0xd3;
    token[type](encoder, value.toArray());
  }

  // str 8 -- 0xd9
  // str 16 -- 0xda
  // str 32 -- 0xdb
  // fixstr -- 0xa0 - 0xbf
  function str_head_size(length) {
    return (length < 32) ? 1 : (length <= 0xFF) ? 2 : (length <= 0xFFFF) ? 3 : 5;
  }

  // raw 16 -- 0xda
  // raw 32 -- 0xdb
  // fixraw -- 0xa0 - 0xbf
  function raw_head_size(length) {
    return (length < 32) ? 1 : (length <= 0xFFFF) ? 3 : 5;
  }

  function _string(head_size) {
    return string;

    function string(encoder, value) {
      // prepare buffer
      var length = value.length;
      var maxsize = 5 + length * 3;
      encoder.offset = encoder.reserve(maxsize);
      var buffer = encoder.buffer;

      // expected header size
      var expected = head_size(length);

      // expected start point
      var start = encoder.offset + expected;

      // write string
      length = BufferProto.write.call(buffer, value, start);

      // actual header size
      var actual = head_size(length);

      // move content when needed
      if (expected !== actual) {
        var targetStart = start + actual - expected;
        var end = start + length;
        BufferProto.copy.call(buffer, buffer, targetStart, start, end);
      }

      // write header
      var type = (actual === 1) ? (0xa0 + length) : (actual <= 3) ? (0xd7 + actual) : 0xdb;
      token[type](encoder, length);

      // move cursor
      encoder.offset += length;
    }
  }

  function object(encoder, value) {
    // null
    if (value === null) return nil(encoder, value);

    // Buffer
    if (isBuffer(value)) return bin(encoder, value);

    // Array
    if (IS_ARRAY(value)) return array(encoder, value);

    // int64-buffer objects
    if (Uint64BE.isUint64BE(value)) return uint64(encoder, value);
    if (Int64BE.isInt64BE(value)) return int64(encoder, value);

    // ext formats
    var packer = encoder.codec.getExtPacker(value);
    if (packer) value = packer(value);
    if (value instanceof ExtBuffer) return ext(encoder, value);

    // plain old Objects or Map
    map(encoder, value);
  }

  function object_raw(encoder, value) {
    // Buffer
    if (isBuffer(value)) return raw(encoder, value);

    // others
    object(encoder, value);
  }

  // nil -- 0xc0
  function nil(encoder, value) {
    var type = 0xc0;
    token[type](encoder, value);
  }

  // fixarray -- 0x90 - 0x9f
  // array 16 -- 0xdc
  // array 32 -- 0xdd
  function array(encoder, value) {
    var length = value.length;
    var type = (length < 16) ? (0x90 + length) : (length <= 0xFFFF) ? 0xdc : 0xdd;
    token[type](encoder, length);

    var encode = encoder.codec.encode;
    for (var i = 0; i < length; i++) {
      encode(encoder, value[i]);
    }
  }

  // bin 8 -- 0xc4
  // bin 16 -- 0xc5
  // bin 32 -- 0xc6
  function bin_buffer(encoder, value) {
    var length = value.length;
    var type = (length < 0xFF) ? 0xc4 : (length <= 0xFFFF) ? 0xc5 : 0xc6;
    token[type](encoder, length);
    encoder.send(value);
  }

  function bin_arraybuffer(encoder, value) {
    bin_buffer(encoder, new Uint8Array(value));
  }

  // fixext 1 -- 0xd4
  // fixext 2 -- 0xd5
  // fixext 4 -- 0xd6
  // fixext 8 -- 0xd7
  // fixext 16 -- 0xd8
  // ext 8 -- 0xc7
  // ext 16 -- 0xc8
  // ext 32 -- 0xc9
  function ext(encoder, value) {
    var buffer = value.buffer;
    var length = buffer.length;
    var type = extmap[length] || ((length < 0xFF) ? 0xc7 : (length <= 0xFFFF) ? 0xc8 : 0xc9);
    token[type](encoder, length);
    uint8[value.type](encoder);
    encoder.send(buffer);
  }

  // fixmap -- 0x80 - 0x8f
  // map 16 -- 0xde
  // map 32 -- 0xdf
  function obj_to_map(encoder, value) {
    var keys = Object.keys(value);
    var length = keys.length;
    var type = (length < 16) ? (0x80 + length) : (length <= 0xFFFF) ? 0xde : 0xdf;
    token[type](encoder, length);

    var encode = encoder.codec.encode;
    keys.forEach(function(key) {
      encode(encoder, key);
      encode(encoder, value[key]);
    });
  }

  // fixmap -- 0x80 - 0x8f
  // map 16 -- 0xde
  // map 32 -- 0xdf
  function map_to_map(encoder, value) {
    if (!(value instanceof Map)) return obj_to_map(encoder, value);

    var length = value.size;
    var type = (length < 16) ? (0x80 + length) : (length <= 0xFFFF) ? 0xde : 0xdf;
    token[type](encoder, length);

    var encode = encoder.codec.encode;
    value.forEach(function(val, key, m) {
      encode(encoder, key);
      encode(encoder, val);
    });
  }

  // raw 16 -- 0xda
  // raw 32 -- 0xdb
  // fixraw -- 0xa0 - 0xbf
  function raw(encoder, value) {
    var length = value.length;
    var type = (length < 32) ? (0xa0 + length) : (length <= 0xFFFF) ? 0xda : 0xdb;
    token[type](encoder, length);
    encoder.send(value);
  }
}

},{"isarray":"REa7","int64-buffer":"dpz9","./bufferish":"/pso","./bufferish-proto":"GNC6","./write-token":"k6wB","./write-uint8":"fpjG","./ext-buffer":"tfA6"}],"69st":[function(require,module,exports) {
// codec-base.js

var IS_ARRAY = require("isarray");

exports.createCodec = createCodec;
exports.install = install;
exports.filter = filter;

var Bufferish = require("./bufferish");

function Codec(options) {
  if (!(this instanceof Codec)) return new Codec(options);
  this.options = options;
  this.init();
}

Codec.prototype.init = function() {
  var options = this.options;

  if (options && options.uint8array) {
    this.bufferish = Bufferish.Uint8Array;
  }

  return this;
};

function install(props) {
  for (var key in props) {
    Codec.prototype[key] = add(Codec.prototype[key], props[key]);
  }
}

function add(a, b) {
  return (a && b) ? ab : (a || b);

  function ab() {
    a.apply(this, arguments);
    return b.apply(this, arguments);
  }
}

function join(filters) {
  filters = filters.slice();

  return function(value) {
    return filters.reduce(iterator, value);
  };

  function iterator(value, filter) {
    return filter(value);
  }
}

function filter(filter) {
  return IS_ARRAY(filter) ? join(filter) : filter;
}

// @public
// msgpack.createCodec()

function createCodec(options) {
  return new Codec(options);
}

// default shared codec

exports.preset = createCodec({preset: true});

},{"isarray":"REa7","./bufferish":"/pso"}],"K4KL":[function(require,module,exports) {
// write-core.js

var ExtBuffer = require("./ext-buffer").ExtBuffer;
var ExtPacker = require("./ext-packer");
var WriteType = require("./write-type");
var CodecBase = require("./codec-base");

CodecBase.install({
  addExtPacker: addExtPacker,
  getExtPacker: getExtPacker,
  init: init
});

exports.preset = init.call(CodecBase.preset);

function getEncoder(options) {
  var writeType = WriteType.getWriteType(options);
  return encode;

  function encode(encoder, value) {
    var func = writeType[typeof value];
    if (!func) throw new Error("Unsupported type \"" + (typeof value) + "\": " + value);
    func(encoder, value);
  }
}

function init() {
  var options = this.options;
  this.encode = getEncoder(options);

  if (options && options.preset) {
    ExtPacker.setExtPackers(this);
  }

  return this;
}

function addExtPacker(etype, Class, packer) {
  packer = CodecBase.filter(packer);
  var name = Class.name;
  if (name && name !== "Object") {
    var packers = this.extPackers || (this.extPackers = {});
    packers[name] = extPacker;
  } else {
    // fallback for IE
    var list = this.extEncoderList || (this.extEncoderList = []);
    list.unshift([Class, extPacker]);
  }

  function extPacker(value) {
    if (packer) value = packer(value);
    return new ExtBuffer(value, etype);
  }
}

function getExtPacker(value) {
  var packers = this.extPackers || (this.extPackers = {});
  var c = value.constructor;
  var e = c && c.name && packers[c.name];
  if (e) return e;

  // fallback for IE
  var list = this.extEncoderList || (this.extEncoderList = []);
  var len = list.length;
  for (var i = 0; i < len; i++) {
    var pair = list[i];
    if (c === pair[0]) return pair[1];
  }
}

},{"./ext-buffer":"tfA6","./ext-packer":"83P4","./write-type":"tNhd","./codec-base":"69st"}],"knv5":[function(require,module,exports) {
// flex-buffer.js

exports.FlexDecoder = FlexDecoder;
exports.FlexEncoder = FlexEncoder;

var Bufferish = require("./bufferish");

var MIN_BUFFER_SIZE = 2048;
var MAX_BUFFER_SIZE = 65536;
var BUFFER_SHORTAGE = "BUFFER_SHORTAGE";

function FlexDecoder() {
  if (!(this instanceof FlexDecoder)) return new FlexDecoder();
}

function FlexEncoder() {
  if (!(this instanceof FlexEncoder)) return new FlexEncoder();
}

FlexDecoder.mixin = mixinFactory(getDecoderMethods());
FlexDecoder.mixin(FlexDecoder.prototype);

FlexEncoder.mixin = mixinFactory(getEncoderMethods());
FlexEncoder.mixin(FlexEncoder.prototype);

function getDecoderMethods() {
  return {
    bufferish: Bufferish,
    write: write,
    fetch: fetch,
    flush: flush,
    push: push,
    pull: pull,
    read: read,
    reserve: reserve,
    offset: 0
  };

  function write(chunk) {
    var prev = this.offset ? Bufferish.prototype.slice.call(this.buffer, this.offset) : this.buffer;
    this.buffer = prev ? (chunk ? this.bufferish.concat([prev, chunk]) : prev) : chunk;
    this.offset = 0;
  }

  function flush() {
    while (this.offset < this.buffer.length) {
      var start = this.offset;
      var value;
      try {
        value = this.fetch();
      } catch (e) {
        if (e && e.message != BUFFER_SHORTAGE) throw e;
        // rollback
        this.offset = start;
        break;
      }
      this.push(value);
    }
  }

  function reserve(length) {
    var start = this.offset;
    var end = start + length;
    if (end > this.buffer.length) throw new Error(BUFFER_SHORTAGE);
    this.offset = end;
    return start;
  }
}

function getEncoderMethods() {
  return {
    bufferish: Bufferish,
    write: write,
    fetch: fetch,
    flush: flush,
    push: push,
    pull: pull,
    read: read,
    reserve: reserve,
    send: send,
    maxBufferSize: MAX_BUFFER_SIZE,
    minBufferSize: MIN_BUFFER_SIZE,
    offset: 0,
    start: 0
  };

  function fetch() {
    var start = this.start;
    if (start < this.offset) {
      var end = this.start = this.offset;
      return Bufferish.prototype.slice.call(this.buffer, start, end);
    }
  }

  function flush() {
    while (this.start < this.offset) {
      var value = this.fetch();
      if (value) this.push(value);
    }
  }

  function pull() {
    var buffers = this.buffers || (this.buffers = []);
    var chunk = buffers.length > 1 ? this.bufferish.concat(buffers) : buffers[0];
    buffers.length = 0; // buffer exhausted
    return chunk;
  }

  function reserve(length) {
    var req = length | 0;

    if (this.buffer) {
      var size = this.buffer.length;
      var start = this.offset | 0;
      var end = start + req;

      // is it long enough?
      if (end < size) {
        this.offset = end;
        return start;
      }

      // flush current buffer
      this.flush();

      // resize it to 2x current length
      length = Math.max(length, Math.min(size * 2, this.maxBufferSize));
    }

    // minimum buffer size
    length = Math.max(length, this.minBufferSize);

    // allocate new buffer
    this.buffer = this.bufferish.alloc(length);
    this.start = 0;
    this.offset = req;
    return 0;
  }

  function send(buffer) {
    var length = buffer.length;
    if (length > this.minBufferSize) {
      this.flush();
      this.push(buffer);
    } else {
      var offset = this.reserve(length);
      Bufferish.prototype.copy.call(buffer, this.buffer, offset);
    }
  }
}

// common methods

function write() {
  throw new Error("method not implemented: write()");
}

function fetch() {
  throw new Error("method not implemented: fetch()");
}

function read() {
  var length = this.buffers && this.buffers.length;

  // fetch the first result
  if (!length) return this.fetch();

  // flush current buffer
  this.flush();

  // read from the results
  return this.pull();
}

function push(chunk) {
  var buffers = this.buffers || (this.buffers = []);
  buffers.push(chunk);
}

function pull() {
  var buffers = this.buffers || (this.buffers = []);
  return buffers.shift();
}

function mixinFactory(source) {
  return mixin;

  function mixin(target) {
    for (var key in source) {
      target[key] = source[key];
    }
    return target;
  }
}

},{"./bufferish":"/pso"}],"2IMA":[function(require,module,exports) {
// encode-buffer.js

exports.EncodeBuffer = EncodeBuffer;

var preset = require("./write-core").preset;

var FlexEncoder = require("./flex-buffer").FlexEncoder;

FlexEncoder.mixin(EncodeBuffer.prototype);

function EncodeBuffer(options) {
  if (!(this instanceof EncodeBuffer)) return new EncodeBuffer(options);

  if (options) {
    this.options = options;
    if (options.codec) {
      var codec = this.codec = options.codec;
      if (codec.bufferish) this.bufferish = codec.bufferish;
    }
  }
}

EncodeBuffer.prototype.codec = preset;

EncodeBuffer.prototype.write = function(input) {
  this.codec.encode(this, input);
};

},{"./write-core":"K4KL","./flex-buffer":"knv5"}],"bz2C":[function(require,module,exports) {
// encode.js

exports.encode = encode;

var EncodeBuffer = require("./encode-buffer").EncodeBuffer;

function encode(input, options) {
  var encoder = new EncodeBuffer(options);
  encoder.write(input);
  return encoder.read();
}

},{"./encode-buffer":"2IMA"}],"n9cF":[function(require,module,exports) {

// ext-unpacker.js

exports.setExtUnpackers = setExtUnpackers;

var Bufferish = require("./bufferish");
var Buffer = Bufferish.global;
var _decode;

var ERROR_COLUMNS = {name: 1, message: 1, stack: 1, columnNumber: 1, fileName: 1, lineNumber: 1};

function setExtUnpackers(codec) {
  codec.addExtUnpacker(0x0E, [decode, unpackError(Error)]);
  codec.addExtUnpacker(0x01, [decode, unpackError(EvalError)]);
  codec.addExtUnpacker(0x02, [decode, unpackError(RangeError)]);
  codec.addExtUnpacker(0x03, [decode, unpackError(ReferenceError)]);
  codec.addExtUnpacker(0x04, [decode, unpackError(SyntaxError)]);
  codec.addExtUnpacker(0x05, [decode, unpackError(TypeError)]);
  codec.addExtUnpacker(0x06, [decode, unpackError(URIError)]);

  codec.addExtUnpacker(0x0A, [decode, unpackRegExp]);
  codec.addExtUnpacker(0x0B, [decode, unpackClass(Boolean)]);
  codec.addExtUnpacker(0x0C, [decode, unpackClass(String)]);
  codec.addExtUnpacker(0x0D, [decode, unpackClass(Date)]);
  codec.addExtUnpacker(0x0F, [decode, unpackClass(Number)]);

  if ("undefined" !== typeof Uint8Array) {
    codec.addExtUnpacker(0x11, unpackClass(Int8Array));
    codec.addExtUnpacker(0x12, unpackClass(Uint8Array));
    codec.addExtUnpacker(0x13, [unpackArrayBuffer, unpackClass(Int16Array)]);
    codec.addExtUnpacker(0x14, [unpackArrayBuffer, unpackClass(Uint16Array)]);
    codec.addExtUnpacker(0x15, [unpackArrayBuffer, unpackClass(Int32Array)]);
    codec.addExtUnpacker(0x16, [unpackArrayBuffer, unpackClass(Uint32Array)]);
    codec.addExtUnpacker(0x17, [unpackArrayBuffer, unpackClass(Float32Array)]);

    // PhantomJS/1.9.7 doesn't have Float64Array
    if ("undefined" !== typeof Float64Array) {
      codec.addExtUnpacker(0x18, [unpackArrayBuffer, unpackClass(Float64Array)]);
    }

    // IE10 doesn't have Uint8ClampedArray
    if ("undefined" !== typeof Uint8ClampedArray) {
      codec.addExtUnpacker(0x19, unpackClass(Uint8ClampedArray));
    }

    codec.addExtUnpacker(0x1A, unpackArrayBuffer);
    codec.addExtUnpacker(0x1D, [unpackArrayBuffer, unpackClass(DataView)]);
  }

  if (Bufferish.hasBuffer) {
    codec.addExtUnpacker(0x1B, unpackClass(Buffer));
  }
}

function decode(input) {
  if (!_decode) _decode = require("./decode").decode; // lazy load
  return _decode(input);
}

function unpackRegExp(value) {
  return RegExp.apply(null, value);
}

function unpackError(Class) {
  return function(value) {
    var out = new Class();
    for (var key in ERROR_COLUMNS) {
      out[key] = value[key];
    }
    return out;
  };
}

function unpackClass(Class) {
  return function(value) {
    return new Class(value);
  };
}

function unpackArrayBuffer(value) {
  return (new Uint8Array(value)).buffer;
}

},{"./bufferish":"/pso","./decode":"0408"}],"m9Xw":[function(require,module,exports) {
// read-format.js

var ieee754 = require("ieee754");
var Int64Buffer = require("int64-buffer");
var Uint64BE = Int64Buffer.Uint64BE;
var Int64BE = Int64Buffer.Int64BE;

exports.getReadFormat = getReadFormat;
exports.readUint8 = uint8;

var Bufferish = require("./bufferish");
var BufferProto = require("./bufferish-proto");

var HAS_MAP = ("undefined" !== typeof Map);
var NO_ASSERT = true;

function getReadFormat(options) {
  var binarraybuffer = Bufferish.hasArrayBuffer && options && options.binarraybuffer;
  var int64 = options && options.int64;
  var usemap = HAS_MAP && options && options.usemap;

  var readFormat = {
    map: (usemap ? map_to_map : map_to_obj),
    array: array,
    str: str,
    bin: (binarraybuffer ? bin_arraybuffer : bin_buffer),
    ext: ext,
    uint8: uint8,
    uint16: uint16,
    uint32: uint32,
    uint64: read(8, int64 ? readUInt64BE_int64 : readUInt64BE),
    int8: int8,
    int16: int16,
    int32: int32,
    int64: read(8, int64 ? readInt64BE_int64 : readInt64BE),
    float32: read(4, readFloatBE),
    float64: read(8, readDoubleBE)
  };

  return readFormat;
}

function map_to_obj(decoder, len) {
  var value = {};
  var i;
  var k = new Array(len);
  var v = new Array(len);

  var decode = decoder.codec.decode;
  for (i = 0; i < len; i++) {
    k[i] = decode(decoder);
    v[i] = decode(decoder);
  }
  for (i = 0; i < len; i++) {
    value[k[i]] = v[i];
  }
  return value;
}

function map_to_map(decoder, len) {
  var value = new Map();
  var i;
  var k = new Array(len);
  var v = new Array(len);

  var decode = decoder.codec.decode;
  for (i = 0; i < len; i++) {
    k[i] = decode(decoder);
    v[i] = decode(decoder);
  }
  for (i = 0; i < len; i++) {
    value.set(k[i], v[i]);
  }
  return value;
}

function array(decoder, len) {
  var value = new Array(len);
  var decode = decoder.codec.decode;
  for (var i = 0; i < len; i++) {
    value[i] = decode(decoder);
  }
  return value;
}

function str(decoder, len) {
  var start = decoder.reserve(len);
  var end = start + len;
  return BufferProto.toString.call(decoder.buffer, "utf-8", start, end);
}

function bin_buffer(decoder, len) {
  var start = decoder.reserve(len);
  var end = start + len;
  var buf = BufferProto.slice.call(decoder.buffer, start, end);
  return Bufferish.from(buf);
}

function bin_arraybuffer(decoder, len) {
  var start = decoder.reserve(len);
  var end = start + len;
  var buf = BufferProto.slice.call(decoder.buffer, start, end);
  return Bufferish.Uint8Array.from(buf).buffer;
}

function ext(decoder, len) {
  var start = decoder.reserve(len+1);
  var type = decoder.buffer[start++];
  var end = start + len;
  var unpack = decoder.codec.getExtUnpacker(type);
  if (!unpack) throw new Error("Invalid ext type: " + (type ? ("0x" + type.toString(16)) : type));
  var buf = BufferProto.slice.call(decoder.buffer, start, end);
  return unpack(buf);
}

function uint8(decoder) {
  var start = decoder.reserve(1);
  return decoder.buffer[start];
}

function int8(decoder) {
  var start = decoder.reserve(1);
  var value = decoder.buffer[start];
  return (value & 0x80) ? value - 0x100 : value;
}

function uint16(decoder) {
  var start = decoder.reserve(2);
  var buffer = decoder.buffer;
  return (buffer[start++] << 8) | buffer[start];
}

function int16(decoder) {
  var start = decoder.reserve(2);
  var buffer = decoder.buffer;
  var value = (buffer[start++] << 8) | buffer[start];
  return (value & 0x8000) ? value - 0x10000 : value;
}

function uint32(decoder) {
  var start = decoder.reserve(4);
  var buffer = decoder.buffer;
  return (buffer[start++] * 16777216) + (buffer[start++] << 16) + (buffer[start++] << 8) + buffer[start];
}

function int32(decoder) {
  var start = decoder.reserve(4);
  var buffer = decoder.buffer;
  return (buffer[start++] << 24) | (buffer[start++] << 16) | (buffer[start++] << 8) | buffer[start];
}

function read(len, method) {
  return function(decoder) {
    var start = decoder.reserve(len);
    return method.call(decoder.buffer, start, NO_ASSERT);
  };
}

function readUInt64BE(start) {
  return new Uint64BE(this, start).toNumber();
}

function readInt64BE(start) {
  return new Int64BE(this, start).toNumber();
}

function readUInt64BE_int64(start) {
  return new Uint64BE(this, start);
}

function readInt64BE_int64(start) {
  return new Int64BE(this, start);
}

function readFloatBE(start) {
  return ieee754.read(this, start, false, 23, 4);
}

function readDoubleBE(start) {
  return ieee754.read(this, start, false, 52, 8);
}
},{"ieee754":"JgNJ","int64-buffer":"dpz9","./bufferish":"/pso","./bufferish-proto":"GNC6"}],"enJ2":[function(require,module,exports) {
// read-token.js

var ReadFormat = require("./read-format");

exports.getReadToken = getReadToken;

function getReadToken(options) {
  var format = ReadFormat.getReadFormat(options);

  if (options && options.useraw) {
    return init_useraw(format);
  } else {
    return init_token(format);
  }
}

function init_token(format) {
  var i;
  var token = new Array(256);

  // positive fixint -- 0x00 - 0x7f
  for (i = 0x00; i <= 0x7f; i++) {
    token[i] = constant(i);
  }

  // fixmap -- 0x80 - 0x8f
  for (i = 0x80; i <= 0x8f; i++) {
    token[i] = fix(i - 0x80, format.map);
  }

  // fixarray -- 0x90 - 0x9f
  for (i = 0x90; i <= 0x9f; i++) {
    token[i] = fix(i - 0x90, format.array);
  }

  // fixstr -- 0xa0 - 0xbf
  for (i = 0xa0; i <= 0xbf; i++) {
    token[i] = fix(i - 0xa0, format.str);
  }

  // nil -- 0xc0
  token[0xc0] = constant(null);

  // (never used) -- 0xc1
  token[0xc1] = null;

  // false -- 0xc2
  // true -- 0xc3
  token[0xc2] = constant(false);
  token[0xc3] = constant(true);

  // bin 8 -- 0xc4
  // bin 16 -- 0xc5
  // bin 32 -- 0xc6
  token[0xc4] = flex(format.uint8, format.bin);
  token[0xc5] = flex(format.uint16, format.bin);
  token[0xc6] = flex(format.uint32, format.bin);

  // ext 8 -- 0xc7
  // ext 16 -- 0xc8
  // ext 32 -- 0xc9
  token[0xc7] = flex(format.uint8, format.ext);
  token[0xc8] = flex(format.uint16, format.ext);
  token[0xc9] = flex(format.uint32, format.ext);

  // float 32 -- 0xca
  // float 64 -- 0xcb
  token[0xca] = format.float32;
  token[0xcb] = format.float64;

  // uint 8 -- 0xcc
  // uint 16 -- 0xcd
  // uint 32 -- 0xce
  // uint 64 -- 0xcf
  token[0xcc] = format.uint8;
  token[0xcd] = format.uint16;
  token[0xce] = format.uint32;
  token[0xcf] = format.uint64;

  // int 8 -- 0xd0
  // int 16 -- 0xd1
  // int 32 -- 0xd2
  // int 64 -- 0xd3
  token[0xd0] = format.int8;
  token[0xd1] = format.int16;
  token[0xd2] = format.int32;
  token[0xd3] = format.int64;

  // fixext 1 -- 0xd4
  // fixext 2 -- 0xd5
  // fixext 4 -- 0xd6
  // fixext 8 -- 0xd7
  // fixext 16 -- 0xd8
  token[0xd4] = fix(1, format.ext);
  token[0xd5] = fix(2, format.ext);
  token[0xd6] = fix(4, format.ext);
  token[0xd7] = fix(8, format.ext);
  token[0xd8] = fix(16, format.ext);

  // str 8 -- 0xd9
  // str 16 -- 0xda
  // str 32 -- 0xdb
  token[0xd9] = flex(format.uint8, format.str);
  token[0xda] = flex(format.uint16, format.str);
  token[0xdb] = flex(format.uint32, format.str);

  // array 16 -- 0xdc
  // array 32 -- 0xdd
  token[0xdc] = flex(format.uint16, format.array);
  token[0xdd] = flex(format.uint32, format.array);

  // map 16 -- 0xde
  // map 32 -- 0xdf
  token[0xde] = flex(format.uint16, format.map);
  token[0xdf] = flex(format.uint32, format.map);

  // negative fixint -- 0xe0 - 0xff
  for (i = 0xe0; i <= 0xff; i++) {
    token[i] = constant(i - 0x100);
  }

  return token;
}

function init_useraw(format) {
  var i;
  var token = init_token(format).slice();

  // raw 8 -- 0xd9
  // raw 16 -- 0xda
  // raw 32 -- 0xdb
  token[0xd9] = token[0xc4];
  token[0xda] = token[0xc5];
  token[0xdb] = token[0xc6];

  // fixraw -- 0xa0 - 0xbf
  for (i = 0xa0; i <= 0xbf; i++) {
    token[i] = fix(i - 0xa0, format.bin);
  }

  return token;
}

function constant(value) {
  return function() {
    return value;
  };
}

function flex(lenFunc, decodeFunc) {
  return function(decoder) {
    var len = lenFunc(decoder);
    return decodeFunc(decoder, len);
  };
}

function fix(len, method) {
  return function(decoder) {
    return method(decoder, len);
  };
}

},{"./read-format":"m9Xw"}],"GUXC":[function(require,module,exports) {
// read-core.js

var ExtBuffer = require("./ext-buffer").ExtBuffer;
var ExtUnpacker = require("./ext-unpacker");
var readUint8 = require("./read-format").readUint8;
var ReadToken = require("./read-token");
var CodecBase = require("./codec-base");

CodecBase.install({
  addExtUnpacker: addExtUnpacker,
  getExtUnpacker: getExtUnpacker,
  init: init
});

exports.preset = init.call(CodecBase.preset);

function getDecoder(options) {
  var readToken = ReadToken.getReadToken(options);
  return decode;

  function decode(decoder) {
    var type = readUint8(decoder);
    var func = readToken[type];
    if (!func) throw new Error("Invalid type: " + (type ? ("0x" + type.toString(16)) : type));
    return func(decoder);
  }
}

function init() {
  var options = this.options;
  this.decode = getDecoder(options);

  if (options && options.preset) {
    ExtUnpacker.setExtUnpackers(this);
  }

  return this;
}

function addExtUnpacker(etype, unpacker) {
  var unpackers = this.extUnpackers || (this.extUnpackers = []);
  unpackers[etype] = CodecBase.filter(unpacker);
}

function getExtUnpacker(type) {
  var unpackers = this.extUnpackers || (this.extUnpackers = []);
  return unpackers[type] || extUnpacker;

  function extUnpacker(buffer) {
    return new ExtBuffer(buffer, type);
  }
}

},{"./ext-buffer":"tfA6","./ext-unpacker":"n9cF","./read-format":"m9Xw","./read-token":"enJ2","./codec-base":"69st"}],"z19W":[function(require,module,exports) {
// decode-buffer.js

exports.DecodeBuffer = DecodeBuffer;

var preset = require("./read-core").preset;

var FlexDecoder = require("./flex-buffer").FlexDecoder;

FlexDecoder.mixin(DecodeBuffer.prototype);

function DecodeBuffer(options) {
  if (!(this instanceof DecodeBuffer)) return new DecodeBuffer(options);

  if (options) {
    this.options = options;
    if (options.codec) {
      var codec = this.codec = options.codec;
      if (codec.bufferish) this.bufferish = codec.bufferish;
    }
  }
}

DecodeBuffer.prototype.codec = preset;

DecodeBuffer.prototype.fetch = function() {
  return this.codec.decode(this);
};

},{"./read-core":"GUXC","./flex-buffer":"knv5"}],"0408":[function(require,module,exports) {
// decode.js

exports.decode = decode;

var DecodeBuffer = require("./decode-buffer").DecodeBuffer;

function decode(input, options) {
  var decoder = new DecodeBuffer(options);
  decoder.write(input);
  return decoder.read();
}
},{"./decode-buffer":"z19W"}],"OX9O":[function(require,module,exports) {
/**
 * event-lite.js - Light-weight EventEmitter (less than 1KB when gzipped)
 *
 * @copyright Yusuke Kawasaki
 * @license MIT
 * @constructor
 * @see https://github.com/kawanet/event-lite
 * @see http://kawanet.github.io/event-lite/EventLite.html
 * @example
 * var EventLite = require("event-lite");
 *
 * function MyClass() {...}             // your class
 *
 * EventLite.mixin(MyClass.prototype);  // import event methods
 *
 * var obj = new MyClass();
 * obj.on("foo", function() {...});     // add event listener
 * obj.once("bar", function() {...});   // add one-time event listener
 * obj.emit("foo");                     // dispatch event
 * obj.emit("bar");                     // dispatch another event
 * obj.off("foo");                      // remove event listener
 */

function EventLite() {
  if (!(this instanceof EventLite)) return new EventLite();
}

(function(EventLite) {
  // export the class for node.js
  if ("undefined" !== typeof module) module.exports = EventLite;

  // property name to hold listeners
  var LISTENERS = "listeners";

  // methods to export
  var methods = {
    on: on,
    once: once,
    off: off,
    emit: emit
  };

  // mixin to self
  mixin(EventLite.prototype);

  // export mixin function
  EventLite.mixin = mixin;

  /**
   * Import on(), once(), off() and emit() methods into target object.
   *
   * @function EventLite.mixin
   * @param target {Prototype}
   */

  function mixin(target) {
    for (var key in methods) {
      target[key] = methods[key];
    }
    return target;
  }

  /**
   * Add an event listener.
   *
   * @function EventLite.prototype.on
   * @param type {string}
   * @param func {Function}
   * @returns {EventLite} Self for method chaining
   */

  function on(type, func) {
    getListeners(this, type).push(func);
    return this;
  }

  /**
   * Add one-time event listener.
   *
   * @function EventLite.prototype.once
   * @param type {string}
   * @param func {Function}
   * @returns {EventLite} Self for method chaining
   */

  function once(type, func) {
    var that = this;
    wrap.originalListener = func;
    getListeners(that, type).push(wrap);
    return that;

    function wrap() {
      off.call(that, type, wrap);
      func.apply(this, arguments);
    }
  }

  /**
   * Remove an event listener.
   *
   * @function EventLite.prototype.off
   * @param [type] {string}
   * @param [func] {Function}
   * @returns {EventLite} Self for method chaining
   */

  function off(type, func) {
    var that = this;
    var listners;
    if (!arguments.length) {
      delete that[LISTENERS];
    } else if (!func) {
      listners = that[LISTENERS];
      if (listners) {
        delete listners[type];
        if (!Object.keys(listners).length) return off.call(that);
      }
    } else {
      listners = getListeners(that, type, true);
      if (listners) {
        listners = listners.filter(ne);
        if (!listners.length) return off.call(that, type);
        that[LISTENERS][type] = listners;
      }
    }
    return that;

    function ne(test) {
      return test !== func && test.originalListener !== func;
    }
  }

  /**
   * Dispatch (trigger) an event.
   *
   * @function EventLite.prototype.emit
   * @param type {string}
   * @param [value] {*}
   * @returns {boolean} True when a listener received the event
   */

  function emit(type, value) {
    var that = this;
    var listeners = getListeners(that, type, true);
    if (!listeners) return false;
    var arglen = arguments.length;
    if (arglen === 1) {
      listeners.forEach(zeroarg);
    } else if (arglen === 2) {
      listeners.forEach(onearg);
    } else {
      var args = Array.prototype.slice.call(arguments, 1);
      listeners.forEach(moreargs);
    }
    return !!listeners.length;

    function zeroarg(func) {
      func.call(that);
    }

    function onearg(func) {
      func.call(that, value);
    }

    function moreargs(func) {
      func.apply(that, args);
    }
  }

  /**
   * @ignore
   */

  function getListeners(that, type, readonly) {
    if (readonly && !that[LISTENERS]) return;
    var listeners = that[LISTENERS] || (that[LISTENERS] = {});
    return listeners[type] || (listeners[type] = []);
  }

})(EventLite);

},{}],"XcL0":[function(require,module,exports) {
// encoder.js

exports.Encoder = Encoder;

var EventLite = require("event-lite");
var EncodeBuffer = require("./encode-buffer").EncodeBuffer;

function Encoder(options) {
  if (!(this instanceof Encoder)) return new Encoder(options);
  EncodeBuffer.call(this, options);
}

Encoder.prototype = new EncodeBuffer();

EventLite.mixin(Encoder.prototype);

Encoder.prototype.encode = function(chunk) {
  this.write(chunk);
  this.emit("data", this.read());
};

Encoder.prototype.end = function(chunk) {
  if (arguments.length) this.encode(chunk);
  this.flush();
  this.emit("end");
};

},{"event-lite":"OX9O","./encode-buffer":"2IMA"}],"m6p9":[function(require,module,exports) {
// decoder.js

exports.Decoder = Decoder;

var EventLite = require("event-lite");
var DecodeBuffer = require("./decode-buffer").DecodeBuffer;

function Decoder(options) {
  if (!(this instanceof Decoder)) return new Decoder(options);
  DecodeBuffer.call(this, options);
}

Decoder.prototype = new DecodeBuffer();

EventLite.mixin(Decoder.prototype);

Decoder.prototype.decode = function(chunk) {
  if (arguments.length) this.write(chunk);
  this.flush();
};

Decoder.prototype.push = function(chunk) {
  this.emit("data", chunk);
};

Decoder.prototype.end = function(chunk) {
  this.decode(chunk);
  this.emit("end");
};

},{"event-lite":"OX9O","./decode-buffer":"z19W"}],"2S1v":[function(require,module,exports) {
// ext.js

// load both interfaces
require("./read-core");
require("./write-core");

exports.createCodec = require("./codec-base").createCodec;

},{"./read-core":"GUXC","./write-core":"K4KL","./codec-base":"69st"}],"cGed":[function(require,module,exports) {
// codec.js

// load both interfaces
require("./read-core");
require("./write-core");

// @public
// msgpack.codec.preset

exports.codec = {
  preset: require("./codec-base").preset
};

},{"./read-core":"GUXC","./write-core":"K4KL","./codec-base":"69st"}],"mwm5":[function(require,module,exports) {
// browser.js

exports.encode = require("./encode").encode;
exports.decode = require("./decode").decode;

exports.Encoder = require("./encoder").Encoder;
exports.Decoder = require("./decoder").Decoder;

exports.createCodec = require("./ext").createCodec;
exports.codec = require("./codec").codec;

},{"./encode":"bz2C","./decode":"0408","./encoder":"XcL0","./decoder":"m6p9","./ext":"2S1v","./codec":"cGed"}],"ZvoB":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _base64Js = _interopRequireDefault(require("base64-js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Base64 {
  static encodeString(content) {
    return Base64.encode(new Buffer(content));
  }

  static decodeString(input) {
    return Buffer.from(Base64.decode(input)).toString();
  }

  static encode(bytes) {
    // url safe encode
    return _base64Js.default.fromByteArray(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  static decode(input) {
    if (input.length % 4 !== 0) {
      // add padding to url safe string;
      input = input.padEnd((input.length >> 2) + 1 << 2, '=');
    }

    return _base64Js.default.toByteArray(input);
  }

}

exports.default = Base64;
},{"base64-js":"yh9p","buffer":"dskh"}],"TRmg":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toBuffer = toBuffer;
exports.DsMsgPackCodecImpl = exports.DsJsonCodecImpl = exports.DsJson = exports.DsCodec = void 0;

var _msgpackLite = _interopRequireDefault(require("msgpack-lite"));

var _base = _interopRequireDefault(require("./base64"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function toBuffer(val) {
  if (val instanceof Buffer) {
    return val;
  } else {
    return Buffer.from(val);
  }
}

class DsCodec {
  static register(name, codec) {
    if (name != null && codec != null) {
      DsCodec._codecs[name] = codec;
    }
  }

  static getCodec(name) {
    let rslt = DsCodec._codecs[name];

    if (rslt == null) {
      return DsCodec.defaultCodec;
    }

    return rslt;
  }

  get blankData() {
    if (this._blankData == null) {
      this._blankData = this.encodeFrame({});
    }

    return this._blankData;
  }

}

exports.DsCodec = DsCodec;

class DsJson {
  static encode(val, pretty = false) {
    return this.instance.encodeJson(val, pretty);
  }

  static decode(str) {
    return this.instance.decodeJson(str);
  }

}

exports.DsJson = DsJson;

class DsJsonCodecImpl extends DsCodec {
  static _safeEncoder(key, value) {
    if (typeof value === 'object') {
      if (Object.isExtensible(value)) {
        return value;
      }

      return null;
    } else {
      return value;
    }
  }

  decodeJson(str) {
    return JSON.parse(str);
  }

  encodeJson(val, pretty = false) {
    return JSON.stringify(val, DsJsonCodecImpl._safeEncoder, pretty ? 1 : undefined);
  }

  decodeBinaryFrame(bytes) {
    return this.decodeStringFrame(toBuffer(bytes).toString());
  }

  static reviver(key, value) {
    if (typeof value === 'string' && value.startsWith("\u001Bbytes:")) {
      try {
        return _base.default.decode(value.substring(7));
      } catch (err) {
        return null;
      }
    }

    return value;
  }

  static replacer(key, value) {
    if (value instanceof Uint8Array) {
      return `\u001Bbytes:${_base.default.encode(value)}`;
    }

    return value;
  }

  decodeStringFrame(str) {
    return JSON.parse(str, DsJsonCodecImpl.reviver);
  }

  encodeFrame(val) {
    return JSON.stringify(val, DsJsonCodecImpl.replacer);
  }

}

exports.DsJsonCodecImpl = DsJsonCodecImpl;
DsJson.instance = new DsJsonCodecImpl();

class DsMsgPackCodecImpl extends DsCodec {
  decodeBinaryFrame(bytes) {
    let result = _msgpackLite.default.decode(bytes);

    if (typeof result === 'object') {
      return result;
    }

    return {};
  }

  decodeStringFrame(input) {
    // not supported
    return {};
  }

  encodeFrame(val) {
    return _msgpackLite.default.encode(val);
  }

}

exports.DsMsgPackCodecImpl = DsMsgPackCodecImpl;
DsMsgPackCodecImpl.instance = new DsMsgPackCodecImpl();
DsCodec._codecs = {
  "json": DsJson.instance,
  "msgpack": DsMsgPackCodecImpl.instance
};
DsCodec.defaultCodec = DsJson.instance;
},{"msgpack-lite":"mwm5","./base64":"ZvoB","buffer":"dskh"}],"N9NG":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Unspecified = exports.DSError = exports.ErrorPhase = exports.StreamStatus = exports.ClientLink = exports.ServerLink = exports.BaseLink = exports.ConnectionAckGroup = exports.ProcessorResult = exports.Connection = exports.ECDH = void 0;

var _denque = _interopRequireDefault(require("denque"));

var _codec = require("../utils/codec");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ECDH {
  verifySalt(salt, hash) {
    return this.hashSalt(salt) === hash;
  }

}

exports.ECDH = ECDH;

class Connection {
  constructor() {
    this.codec = _codec.DsCodec.defaultCodec;
    this.pendingAcks = new _denque.default();
  }

  ack(ackId) {
    let findAckGroup;

    for (let i = 0; i < this.pendingAcks.length; ++i) {
      let ackGroup = this.pendingAcks.peekAt(i);

      if (ackGroup.ackId === ackId) {
        findAckGroup = ackGroup;
        break;
      } else if (ackGroup.ackId < ackId) {
        findAckGroup = ackGroup;
      }
    }

    if (findAckGroup != null) {
      let ts = new Date().getTime();

      do {
        let ackGroup = this.pendingAcks.shift();
        ackGroup.ackAll(ackId, ts);

        if (ackGroup === findAckGroup) {
          break;
        }
      } while (findAckGroup != null);
    }
  }

} /// generate message right before sending to get the latest update
/// return messages and the processors that need ack callback


exports.Connection = Connection;

class ProcessorResult {
  constructor(messages, processors) {
    this.messages = messages;
    this.processors = processors;
  }

}

exports.ProcessorResult = ProcessorResult;

class ConnectionAckGroup {
  constructor(ackId, startTime, processors) {
    this.ackId = ackId;
    this.startTime = startTime;
    this.processors = processors;
  }

  ackAll(ackid, time) {
    for (let processor of this.processors) {
      processor.ackReceived(this.ackId, this.startTime, time);
    }
  }

} /// Base Class for Links


exports.ConnectionAckGroup = ConnectionAckGroup;

class BaseLink {} /// Base Class for Server Link implementations.


exports.BaseLink = BaseLink;

class ServerLink extends BaseLink {} /// Base Class for Client Link implementations.


exports.ServerLink = ServerLink;

class ClientLink extends BaseLink {
  /** @ignore */
  get logName() {
    return null;
  }
  /** @ignore */


  formatLogMessage(msg) {
    if (this.logName != null) {
      return `[${this.logName}] ${msg}`;
    }

    return msg;
  }

} /// DSA Stream Status


exports.ClientLink = ClientLink;

class StreamStatus {} /// Stream should be initialized.


exports.StreamStatus = StreamStatus;
StreamStatus.initialize = "initialize"; /// Stream is open.

StreamStatus.open = "open"; /// Stream is closed.

StreamStatus.closed = "closed";

class ErrorPhase {}

exports.ErrorPhase = ErrorPhase;
ErrorPhase.request = "request";
ErrorPhase.response = "response";

class DSError {
  constructor(type, options = {}) {
    this.type = type;
    this.msg = options.msg;
    this.detail = options.detail;
    this.path = options.path;

    if (options.phase) {
      this.phase = options.phase;
    } else {
      this.phase = ErrorPhase.response;
    }
  }

  static fromMap(m) {
    let error = new DSError('');

    if (typeof m["type"] === 'string') {
      error.type = m["type"];
    }

    if (typeof m["msg"] === 'string') {
      error.msg = m["msg"];
    }

    if (typeof m["path"] === 'string') {
      error.path = m["path"];
    }

    if (typeof m["phase"] === 'string') {
      error.phase = m["phase"];
    }

    if (typeof m["detail"] === 'string') {
      error.detail = m["detail"];
    }

    return error;
  }

  getMessage() {
    if (this.msg) {
      return this.msg;
    }

    if (this.type) {
      // TODO, return normal case instead of camel case
      return this.type;
    }

    return "Error";
  }

  serialize() {
    let rslt = {};

    if (this.msg != null) {
      rslt["msg"] = this.msg;
    }

    if (this.type != null) {
      rslt["type"] = this.type;
    }

    if (this.path != null) {
      rslt["path"] = this.path;
    }

    if (this.phase === ErrorPhase.request) {
      rslt["phase"] = ErrorPhase.request;
    }

    if (this.detail != null) {
      rslt["detail"] = this.detail;
    }

    return rslt;
  }

}

exports.DSError = DSError;
DSError.PERMISSION_DENIED = new DSError("permissionDenied");
DSError.INVALID_METHOD = new DSError("invalidMethod");
DSError.NOT_IMPLEMENTED = new DSError("notImplemented");
DSError.INVALID_PATH = new DSError("invalidPath");
DSError.INVALID_PATHS = new DSError("invalidPaths");
DSError.INVALID_VALUE = new DSError("invalidValue");
DSError.INVALID_PARAMETER = new DSError("invalidParameter");
DSError.DISCONNECTED = new DSError("disconnected", {
  phase: ErrorPhase.request
});
DSError.FAILED = new DSError("failed");

class Unspecified {} /// Marks something as being unspecified.


exports.Unspecified = Unspecified;
const unspecified = new Unspecified(); /// Unspecified means that something has never been set.
},{"denque":"DPC0","../utils/codec":"TRmg"}],"bajV":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Completer = exports.StreamSubscription = exports.Stream = void 0;

class Stream {
  constructor(onStartListen, onAllCancel, onListen) {
    /** @ignore */
    this._listeners = new Set();
    /** @ignore */

    this._updating = false;
    /** @ignore */

    this._cached = false;
    this.isClosed = false;
    this._onStartListen = onStartListen;
    this._onAllCancel = onAllCancel;
    this._onListen = onListen;
  }

  listen(listener) {
    this._listeners.add(listener);

    if (this._onStartListen && this._listeners.size === 1) {
      this._onStartListen();
    }

    if (this._onListen) {
      this._onListen(listener);
    }

    if (this._value !== undefined && !this._updating) {
      // skip extra update if it's already in updating iteration
      listener(this._value);
    }

    return new StreamSubscription(this, listener);
  }

  unlisten(listener) {
    this._listeners.delete(listener);

    if (this._onAllCancel && this._listeners.size === 0) {
      this._onAllCancel();
    }
  }

  add(val) {
    if (this.isClosed) {
      return false;
    }

    this._value = val;

    this._dispatch();

    return true;
  }
  /** @ignore */


  _dispatch() {
    this._updating = true;

    for (let listener of this._listeners) {
      listener(this._value);
    }

    this._updating = false;

    if (!this._cached) {
      this._value = undefined;
    }
  }

  close() {
    if (!this.isClosed) {
      this.isClosed = true;

      this._listeners.clear();

      if (this._onClose) {
        this._onClose();
      }
    }
  }

}

exports.Stream = Stream;

class StreamSubscription {
  constructor(stream, listener) {
    this._stream = stream;
    this._listener = listener;
  }

  close() {
    if (this._stream && this._listener) {
      this._stream.unlisten(this._listener);

      this._stream = null;
      this._listener = null;
    }
  }

}

exports.StreamSubscription = StreamSubscription;

class Completer {
  constructor() {
    this.isCompleted = false;
    this.future = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  complete(val) {
    if (this._resolve) {
      this._resolve(val);
    }

    this.isCompleted = true;
  }

  completeError(val) {
    if (this._reject) {
      this._reject(val);
    }
  }

}

exports.Completer = Completer;
},{}],"wg7F":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Request = void 0;

var _interfaces = require("../common/interfaces");

class Request {
  constructor(requester, rid, updater, data) {
    this._isClosed = false;
    this.streamStatus = _interfaces.StreamStatus.initialize;
    this.requester = requester;
    this.rid = rid;
    this.updater = updater;
    this.data = data;
  }

  get isClosed() {
    return this._isClosed;
  } /// resend the data if previous sending failed


  resend() {
    this.requester.addToSendList(this.data);
  }

  addReqParams(m) {
    this.requester.addToSendList({
      'rid': this.rid,
      'params': m
    });
  }

  _update(m) {
    if (typeof m["stream"] === 'string') {
      this.streamStatus = m["stream"];
    }

    let updates;
    let columns;
    let meta;

    if (Array.isArray(m["updates"])) {
      updates = m["updates"];
    }

    if (Array.isArray(m["columns"])) {
      columns = m["columns"];
    }

    if (m["meta"] instanceof Object) {
      meta = m["meta"];
    } // remove the request from global object


    if (this.streamStatus === _interfaces.StreamStatus.closed) {
      this.requester._requests.delete(this.rid);
    }

    let error;

    if (m.hasOwnProperty("error") && m["error"] instanceof Object) {
      error = _interfaces.DSError.fromMap(m["error"]);
      this.requester.onError.add(error);
    }

    this.updater.onUpdate(this.streamStatus, updates, columns, meta, error);
  } /// close the request and finish data


  _close(error) {
    if (this.streamStatus != _interfaces.StreamStatus.closed) {
      this.streamStatus = _interfaces.StreamStatus.closed;
      this.updater.onUpdate(_interfaces.StreamStatus.closed, null, null, null, error);
    }
  } /// close the request from the client side


  close() {
    // _close will also be called later from the requester;
    this.requester.closeRequest(this);
  }

}

exports.Request = Request;
},{"../common/interfaces":"N9NG"}],"lXIX":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConnectionHandler = exports.defaultCacheSize = exports.ACK_WAIT_COUNT = void 0;

var _interfaces = require("./interfaces");

const ACK_WAIT_COUNT = 16;
exports.ACK_WAIT_COUNT = ACK_WAIT_COUNT;
const defaultCacheSize = 256;
exports.defaultCacheSize = defaultCacheSize;

class ConnectionHandler {
  constructor() {
    /** @ignore */
    this._toSendList = [];
    /** @ignore */

    this._processors = [];
    /** @ignore */

    this._pendingSend = false;
  }
  /** @ignore */


  get connection() {
    return this._conn;
  }
  /** @ignore */


  set connection(conn) {
    if (this._connListener != null) {
      this._connListener.close();

      this._connListener = null;

      this._onDisconnected(this._conn);
    }

    this._conn = conn;
    this._connListener = this._conn.onReceive.listen(this.onData);

    this._conn.onDisconnected.then(conn => this._onDisconnected(conn)); // resend all requests after a connection


    if (this._conn.connected) {
      this.onReconnected();
    } else {
      this._conn.onConnected.then(conn => this.onReconnected());
    }
  }
  /** @ignore */


  _onDisconnected(conn) {
    if (this._conn === conn) {
      if (this._connListener != null) {
        this._connListener.close();

        this._connListener = null;
      }

      this.onDisconnected();
      this._conn = null;
    }
  }
  /** @ignore */


  onReconnected() {
    if (this._pendingSend) {
      this._conn.sendWhenReady(this);
    }
  }
  /** @ignore */


  addToSendList(m) {
    this._toSendList.push(m);

    if (!this._pendingSend) {
      if (this._conn != null) {
        this._conn.sendWhenReady(this);
      }

      this._pendingSend = true;
    }
  } /// a processor function that's called just before the data is sent
  /// same processor won't be added to the list twice
  /// inside processor, send() data that only need to appear once per data frame

  /** @ignore */


  addProcessor(processor) {
    this._processors.push(processor);

    if (!this._pendingSend) {
      if (this._conn != null) {
        this._conn.sendWhenReady(this);
      }

      this._pendingSend = true;
    }
  } /// gather all the changes from

  /** @ignore */


  getSendingData(currentTime, waitingAckId) {
    this._pendingSend = false;
    let processors = this._processors;
    this._processors = [];

    for (let proc of processors) {
      proc.startSendingData(currentTime, waitingAckId);
    }

    let rslt = this._toSendList;
    this._toSendList = [];
    return new _interfaces.ProcessorResult(rslt, processors);
  }
  /** @ignore */


  clearProcessors() {
    this._processors.length = 0;
    this._pendingSend = false;
  }

}

exports.ConnectionHandler = ConnectionHandler;
},{"./interfaces":"N9NG"}],"QClj":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Path = exports.Node = void 0;

/// Base Class for any and all nodes in the SDK.
/// If you are writing a link, please look at the [dslink.responder.SimpleNode] class.
class Node {
  constructor() {
    /// Node Attributes
    this.attributes = new Map(); /// Node Configs

    this.configs = new Map(); /// Node Children
    /// object of Child Name to Child Node

    this.children = new Map();
    this.configs.set('$is', 'node');
  }

  static getDisplayName(nameOrPath) {
    if (nameOrPath.includes('/')) {
      let names = nameOrPath.split('/');
      nameOrPath = names.pop();

      while (nameOrPath === '' && names.length) {
        nameOrPath = names.pop();
      }
    }

    if (nameOrPath.includes('%')) {
      nameOrPath = decodeURIComponent(nameOrPath);
    }

    return nameOrPath;
  } /// Get an Attribute


  getAttribute(name) {
    if (this.attributes.has(name)) {
      return this.attributes.get(name);
    }

    if (this.profile != null && this.profile.attributes.has(name)) {
      return this.profile.attributes.get(name);
    }

    return null;
  } /// Get a Config


  getConfig(name) {
    if (this.configs.has(name)) {
      return this.configs.get(name);
    }

    if (this.profile != null && this.profile.configs.has(name)) {
      return this.profile.configs.get(name);
    }

    return null;
  } /// Adds a child to this node.

  /** @ignore */


  addChild(name, node) {
    this.children.set(name, node);
  } /// Remove a child from this node.
  /// [input] can be either an instance of [Node] or a [string].

  /** @ignore */


  removeChild(input) {
    this.children.delete(input);
  } /// Get a Child Node


  getChild(name) {
    if (this.children.has(name)) {
      return this.children.get(name);
    }

    if (this.profile != null && this.profile.children.has(name)) {
      return this.profile.children.get(name);
    }

    return null;
  } /// Get a property of this node.
  /// If [name] starts with '$', this will fetch a config.
  /// If [name] starts with a '@', this will fetch an attribute.
  /// Otherwise this will fetch a child.


  get(name) {
    if (name.startsWith('$')) {
      return this.getConfig(name);
    }

    if (name.startsWith('@')) {
      return this.getAttribute(name);
    }

    return this.getChild(name);
  } /// Iterates over all the children of this node and passes them to the specified [callback].

  /** @ignore */


  forEachChild(callback) {
    for (let [name, node] of this.children) {
      callback(name, node);
    }

    if (this.profile != null) {
      for (let [name, node] of this.profile.children) {
        if (!this.children.has(name)) {
          callback(name, node);
        }
      }
    }
  }
  /** @ignore */


  forEachConfig(callback) {
    for (let [name, val] of this.configs) {
      callback(name, val);
    }

    if (this.profile != null) {
      for (let [name, val] of this.profile.configs) {
        if (!this.children.has(name)) {
          callback(name, val);
        }
      }
    }
  }
  /** @ignore */


  forEachAttribute(callback) {
    for (let [name, val] of this.attributes) {
      callback(name, val);
    }

    if (this.profile != null) {
      for (let [name, val] of this.profile.attributes) {
        if (!this.children.has(name)) {
          callback(name, val);
        }
      }
    }
  } /// Gets a map for the data that will be listed in the parent node's children property.

  /** @ignore */


  getSimpleMap() {
    let rslt = {};

    if (this.configs.has('$is')) {
      rslt['$is'] = this.configs.get('$is');
    }

    if (this.configs.has('$type')) {
      rslt['$type'] = this.configs.get('$type');
    }

    if (this.configs.has('$name')) {
      rslt['$name'] = this.configs.get('$name');
    }

    if (this.configs.has('$invokable')) {
      rslt['$invokable'] = this.configs.get('$invokable');
    }

    if (this.configs.has('$writable')) {
      rslt['$writable'] = this.configs.get('$writable');
    }

    if (this.configs.has('$params')) {
      rslt['$params'] = this.configs.get('$params');
    }

    if (this.configs.has('$columns')) {
      rslt['$columns'] = this.configs.get('$columns');
    }

    if (this.configs.has('$result')) {
      rslt['$result'] = this.configs.get('$result');
    }

    return rslt;
  }

} /// Utility class for node and config/attribute paths.


exports.Node = Node;

class Path {
  constructor(path) {
    /// If this path is invalid, this will be false. Otherwise this will be true.
    this.valid = true;
    this.path = path;

    this._parse();
  }
  /** @ignore */


  static escapeName(str) {
    if (Path.invalidNameChar.test(str)) {
      return encodeURIComponent(str);
    }

    return str;
  }

  static getValidPath(path, basePath) {
    if (typeof path === 'string') {
      let p = new Path(path);

      if (p.valid) {
        p.mergeBasePath(basePath);
        return p;
      }
    }

    return null;
  }

  static getValidNodePath(path, basePath) {
    if (typeof path === 'string') {
      let p = new Path(path);

      if (p.valid && p.isNode) {
        p.mergeBasePath(basePath);
        return p;
      }
    }

    return null;
  }

  static getValidAttributePath(path, basePath) {
    if (typeof path === 'string') {
      let p = new Path(path);

      if (p.valid && p.isAttribute) {
        p.mergeBasePath(basePath);
        return p;
      }
    }

    return null;
  }

  static getValidConfigPath(path, basePath) {
    if (typeof path === 'string') {
      let p = new Path(path);

      if (p.valid && p.isConfig) {
        p.mergeBasePath(basePath);
        return p;
      }
    }

    return null;
  }
  /**  Get the parent of this path. */


  get parent() {
    return new Path(this.parentPath);
  }
  /** Get a child of this path. */


  child(name) {
    return new Path((this.path.endsWith("/") ? this.path.substring(0, this.path.length - 1) : this.path) + "/" + (name.startsWith("/") ? name.substring(1) : name));
  }
  /** @ignore */


  _parse() {
    if (this.path === '' || Path.invalidChar.test(this.path) || this.path.includes('//')) {
      this.valid = false;
    }

    if (this.path === '/') {
      this.valid = true;
      this.name = '/';
      this.parentPath = '';
      return;
    }

    if (this.path.endsWith('/')) {
      this.path = this.path.substring(0, this.path.length - 1);
    }

    let pos = this.path.lastIndexOf('/');

    if (pos < 0) {
      this.name = this.path;
      this.parentPath = '';
    } else if (pos === 0) {
      this.parentPath = '/';
      this.name = this.path.substring(1);
    } else {
      this.parentPath = this.path.substring(0, pos);
      this.name = this.path.substring(pos + 1);

      if (this.parentPath.includes('/$') || this.parentPath.includes('/@')) {
        // parent path can't be attribute or config
        this.valid = false;
      }
    }
  } /// Is this an absolute path?


  get isAbsolute() {
    return this.name === '/' || this.parentPath.startsWith('/');
  } /// Is this the root path?


  get isRoot() {
    return this.name === '/';
  } /// Is this a config?


  get isConfig() {
    return this.name.startsWith('$');
  } /// Is this an attribute?


  get isAttribute() {
    return this.name.startsWith('@');
  } /// Is this a node?


  get isNode() {
    return !this.name.startsWith('@') && !this.name.startsWith('$');
  } /// Merges the [base] path with this path.

  /** @ignore */


  mergeBasePath(base, force = false) {
    if (base == null) {
      return;
    }

    if (!this.isAbsolute) {
      if (this.parentPath === '') {
        this.parentPath = base;
      } else {
        this.parentPath = '$base/$parentPath';
      }

      this.path = '$parentPath/$name';
    } else if (force) {
      // apply base path on a absolute path
      if (name === '') {
        // map the root path
        this.path = base;

        this._parse();
      } else {
        this.parentPath = '$base$parentPath';
        this.path = '$parentPath/$name';
      }
    }
  }

} /// Regular Expression for invalid characters in paths.

/** @ignore */


exports.Path = Path;
Path.invalidChar = /[\\\?\*|"<>:]/; /// Regular Expression for invalid characters in names.

/** @ignore */

Path.invalidNameChar = /[\/\\\?\*|"<>:]/;
},{}],"Re02":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ValueUpdate = void 0;

const TIME_ZONE = function () {
  let timeZoneOffset = new Date().getTimezoneOffset();
  let s = "+";

  if (timeZoneOffset < 0) {
    timeZoneOffset = -timeZoneOffset;
    s = "-";
  }

  let hhstr = `${timeZoneOffset / 60 | 0}`.padStart(2, '0');
  let mmstr = `${timeZoneOffset % 60}`.padStart(2, '0');
  return `${s}${hhstr}:${mmstr}`;
}(); /// Represents an update to a value subscription.


class ValueUpdate {
  constructor(value, ts, options) {
    /// The id of the ack we are waiting for.
    this.waitingAck = -1; /// How many updates have happened since the last response.

    this.count = 1;
    this._cloned = false;
    this.value = value;

    if (ts) {
      this.ts = ts;
    } else {
      this.ts = ValueUpdate.getTs();
    }

    if (options) {
      if (options.status) {
        this.status = options.status;
      }

      if (options.count) {
        this.count = options.count;
      }
    }

    this.created = new Date();
  } /// Generates a timestamp in the proper DSA format.


  static getTs() {
    let d = new Date();

    if (d.getTime() === this._lastTs) {
      return this._lastTsStr;
    }

    ValueUpdate._lastTs = d.getTime();
    let offsetISOStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
    ValueUpdate._lastTsStr = `${offsetISOStr.slice(0, -1)}${TIME_ZONE}`;
    return this._lastTsStr;
  } /// Gets a [DateTime] representation of the timestamp for this value.


  get timestamp() {
    if (this._timestamp == null) {
      this._timestamp = new Date(this.ts);
    }

    return this._timestamp;
  }

  static merge(oldUpdate, newUpdate) {
    let newValue = new ValueUpdate(null);
    newValue.value = newUpdate.value;
    newValue.ts = newUpdate.ts;
    newValue.status = newUpdate.status;
    newValue.count = oldUpdate.count + newUpdate.count;
    newValue.created = newUpdate.created;
    return newValue;
  } /// Calculates the latency


  get latency() {
    if (!this._latency) {
      this._latency = this.timestamp.getTime() - this.created.getTime();
    }

    return this._latency;
  } /// merge the new update into existing instance


  mergeAdd(newUpdate) {
    this.value = newUpdate.value;
    this.ts = newUpdate.ts;
    this.status = newUpdate.status;
    this.count += newUpdate.count;
  }

  equals(other) {
    if (Array.isArray(this.value)) {
      // assume List is same if it's generated at same timestamp
      if (!Array.isArray(other.value)) {
        return false;
      }
    } else if (this.value != null && this.value instanceof Object) {
      // assume object is same if it's generated at same timestamp
      if (!(other.value instanceof Object)) {
        return false;
      }
    } else if (!Object.is(this.value, other.value)) {
      return false;
    }

    return other.ts === this.ts && other.count === this.count;
  } /// Generates a map representation of this value update.


  toMap() {
    let m = {
      "ts": this.ts,
      "value": this.value
    };

    if (this.count !== 1) {
      m["count"] = this.count;
    }

    return m;
  }

  cloneForAckQueue() {
    if (!this._cloned) {
      this._cloned = true;
      return this;
    }

    return new ValueUpdate(this.value, this.ts, {
      status: this.status,
      count: this.count
    });
  }

}

exports.ValueUpdate = ValueUpdate;
ValueUpdate._lastTs = 0;
},{}],"wq45":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RequesterUpdate = void 0;

class RequesterUpdate {
  constructor(streamStatus) {
    this.streamStatus = streamStatus;
  }

}

exports.RequesterUpdate = RequesterUpdate;
},{}],"duux":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ListController = exports.ListDefListener = exports.RequesterListUpdate = void 0;

var _async = require("../../utils/async");

var _interfaces = require("../../common/interfaces");

var _node_cache = require("../node_cache");

var _value = require("../../common/value");

var _interface = require("../interface");

class RequesterListUpdate extends _interface.RequesterUpdate {
  /** @ignore */
  constructor(node, changes, streamStatus) {
    super(streamStatus);
    this.node = node;
    this.changes = changes;
  }

}
/** @ignore */


exports.RequesterListUpdate = RequesterListUpdate;

class ListDefListener {
  constructor(node, requester, callback) {
    this.ready = false;
    this.node = node;
    this.requester = requester;
    this.listener = requester.list(node.remotePath, update => {
      this.ready = update.streamStatus !== _interfaces.StreamStatus.initialize;
      callback(update);
    });
  }

  close() {
    this.listener.close();
  }

}
/** @ignore */


exports.ListDefListener = ListDefListener;

class ListController {
  constructor(node, requester) {
    this.changes = new Set();

    this._onProfileUpdate = update => {
      if (this._profileLoader == null) {
        //      logger.finest('warning, unexpected state of profile loading');
        return;
      }

      this._profileLoader.close();

      this._profileLoader = null;

      for (let change of update.changes) {
        if (!ListController._ignoreProfileProps.includes(change)) {
          this.changes.add(change);

          if (change.startsWith('$')) {
            if (!this.node.configs.has(change)) {
              this.node.configs.set(change, this.node.profile.configs.get(change));
            }
          } else if (change.startsWith('@')) {
            if (!this.node.attributes.has(change)) {
              this.node.attributes.set(change, this.node.profile.attributes.get(change));
            }
          } else {
            if (!this.node.children.has(change)) {
              this.node.children.set(change, this.node.profile.children.get(change));
            }
          }
        }
      }

      this._ready = true;
      this.onProfileUpdated();
    };

    this._ready = true;
    this._pendingRemoveDef = false;

    this.onStartListen = () => {
      if (this.request == null && !this.waitToSend) {
        this.waitToSend = true;
        this.requester.addProcessor(this);
      }
    };

    this.waitToSend = false;

    this._onListen = callback => {
      if (this._ready && this.request != null) {
        setTimeout(() => {
          if (this.request == null) {
            return;
          }

          let changes = [];

          for (let [key, v] of this.node.configs) {
            changes.push(key);
          }

          for (let [key, v] of this.node.attributes) {
            changes.push(key);
          }

          for (let [key, v] of this.node.children) {
            changes.push(key);
          }

          let update = new RequesterListUpdate(this.node, changes, this.request.streamStatus);
          callback(update);
        }, 0);
      }
    };

    this._onAllCancel = () => {
      this._destroy();
    };

    this.node = node;
    this.requester = requester;
    this.stream = new _async.Stream(this.onStartListen, this._onAllCancel, this._onListen);
  }

  get initialized() {
    return this.request != null && this.request.streamStatus !== _interfaces.StreamStatus.initialize;
  }

  onDisconnect() {
    this.disconnectTs = _value.ValueUpdate.getTs();
    this.node.configs.set('$disconnectedTs', this.disconnectTs);
    this.stream.add(new RequesterListUpdate(this.node, ['$disconnectedTs'], this.request.streamStatus));
  }

  onReconnect() {
    if (this.disconnectTs != null) {
      this.node.configs.delete('$disconnectedTs');
      this.disconnectTs = null;
      this.changes.add('$disconnectedTs');
    }
  }

  onUpdate(streamStatus, updates, columns, meta, error) {
    let reseted = false; // TODO implement error handling

    if (updates != null) {
      for (let update of updates) {
        let name;
        let value;
        let removed = false;

        if (Array.isArray(update)) {
          if (update.length > 0 && typeof update[0] === 'string') {
            name = update[0];

            if (update.length > 1) {
              value = update[1];
            }
          } else {
            continue; // invalid response
          }
        } else if (update != null && update instanceof Object) {
          if (typeof update['name'] === 'string') {
            name = update['name'];
          } else {
            continue; // invalid response
          }

          if (update['change'] === 'remove') {
            removed = true;
          } else {
            value = update['value'];
          }
        } else {
          continue; // invalid response
        }

        if (name.startsWith('$')) {
          if (!reseted && (name === '$is' || name === '$base' || name === '$disconnectedTs' && typeof value === 'string')) {
            reseted = true;
            this.node.resetNodeCache();
          }

          if (name === '$is') {
            this.loadProfile(value);
          }

          this.changes.add(name);

          if (removed) {
            this.node.configs.delete(name);
          } else {
            this.node.configs.set(name, value);
          }
        } else if (name.startsWith('@')) {
          this.changes.add(name);

          if (removed) {
            this.node.attributes.delete(name);
          } else {
            this.node.attributes.set(name, value);
          }
        } else {
          this.changes.add(name);

          if (removed) {
            this.node.children.delete(name);
          } else if (value != null && value instanceof Object) {
            // TODO, also wait for children $is
            this.node.children.set(name, this.requester.nodeCache.updateRemoteChildNode(this.node, name, value));
          }
        }
      }

      if (this.request.streamStatus !== _interfaces.StreamStatus.initialize) {
        this.node.listed = true;
      }

      if (this._pendingRemoveDef) {
        this._checkRemoveDef();
      }

      this.onProfileUpdated();
    }
  }

  loadProfile(defName) {
    this._ready = true;
    let defPath = defName;

    if (!defPath.startsWith('/')) {
      let base = this.node.configs.get('$base');

      if (typeof base === 'string') {
        defPath = `${base}/defs/profile/${defPath}`;
      } else {
        defPath = `/defs/profile/${defPath}`;
      }
    }

    if (this.node.profile instanceof _node_cache.RemoteNode && this.node.profile.remotePath === defPath) {
      return;
    }

    this.node.profile = this.requester.nodeCache.getDefNode(defPath, defName);

    if (defName === 'node') {
      return;
    }

    if (this.node.profile instanceof _node_cache.RemoteNode && !this.node.profile.listed) {
      this._ready = false;
      this._profileLoader = new ListDefListener(this.node.profile, this.requester, this._onProfileUpdate);
    }
  }

  onProfileUpdated() {
    if (this._ready) {
      if (this.request.streamStatus !== _interfaces.StreamStatus.initialize) {
        this.stream.add(new RequesterListUpdate(this.node, Array.from(this.changes), this.request.streamStatus));
        this.changes.clear();
      }

      if (this.request && this.request.streamStatus === _interfaces.StreamStatus.closed) {
        this.stream.close();
      }
    }
  }

  _checkRemoveDef() {
    this._pendingRemoveDef = false;
  }

  startSendingData(currentTime, waitingAckId) {
    if (!this.waitToSend) {
      return;
    }

    this.request = this.requester._sendRequest({
      'method': 'list',
      'path': this.node.remotePath
    }, this);
    this.waitToSend = false;
  }

  ackReceived(receiveAckId, startTime, currentTime) {}

  _destroy() {
    this.waitToSend = false;

    if (this._profileLoader != null) {
      this._profileLoader.close();

      this._profileLoader = null;
    }

    if (this.request != null) {
      this.requester.closeRequest(this.request);
      this.request = null;
    }

    this.stream.close();
    this.node._listController = null;
  }

}

exports.ListController = ListController;
ListController._ignoreProfileProps = ['$is', '$permission', '$settings'];
},{"../../utils/async":"bajV","../../common/interfaces":"N9NG","../node_cache":"jg7K","../../common/value":"Re02","../interface":"wq45"}],"YpSC":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReqSubscribeController = exports.SubscribeRequest = exports.SubscribeController = exports.ReqSubscribeListener = void 0;

var _request = require("../request");

var _value = require("../../common/value");

var _connection_handler = require("../../common/connection_handler");

class ReqSubscribeListener {
  /** @ignore */
  constructor(requester, path, callback) {
    this.requester = requester;
    this.path = path;
    this.callback = callback;
  }

  close() {
    if (this.callback != null) {
      this.requester.unsubscribe(this.path, this.callback);
      this.callback = null;
    }
  }

} /// only a place holder for reconnect and disconnect
/// real logic is in SubscribeRequest itself

/** @ignore */


exports.ReqSubscribeListener = ReqSubscribeListener;

class SubscribeController {
  onDisconnect() {// TODO: implement onDisconnect
  }

  onReconnect() {// TODO: implement onReconnect
  }

  onUpdate(status, updates, columns, meta, error) {// do nothing
  }

}
/** @ignore */


exports.SubscribeController = SubscribeController;

class SubscribeRequest extends _request.Request {
  constructor(requester, rid) {
    super(requester, rid, new SubscribeController(), null);
    this.lastSid = 0;
    this.subscriptions = new Map();
    this.subscriptionIds = new Map();
    this._changedPaths = new Set();
    this.toRemove = new Map();
    this._pendingSending = false;
    this._waitingAckCount = 0;
    this._lastWatingAckId = -1;
    this._sendingAfterAck = false;
    this.updater.request = this;
  }

  getNextSid() {
    do {
      if (this.lastSid < 0x7FFFFFFF) {
        ++this.lastSid;
      } else {
        this.lastSid = 1;
      }
    } while (this.subscriptionIds.has(this.lastSid));

    return this.lastSid;
  }

  resend() {
    this.prepareSending();
  }

  _close(error) {
    if (this.subscriptions.size > 0) {
      for (let [key, s] of this.subscriptions) {
        this._changedPaths.add(key);
      }
    }

    this._waitingAckCount = 0;
    this._lastWatingAckId = -1;
    this._sendingAfterAck = false;
  }

  _update(m) {
    let updates = m['updates'];

    if (Array.isArray(updates)) {
      for (let update of updates) {
        let path;
        let sid = -1;
        let value;
        let ts;
        let options;

        if (Array.isArray(update) && update.length > 2) {
          if (typeof update[0] === 'string') {
            path = update[0];
          } else if (typeof update[0] === 'number') {
            sid = update[0];
          } else {
            continue; // invalid response
          }

          value = update[1];
          ts = update[2];
        } else if (update != null && update instanceof Object) {
          if (typeof update['ts'] === 'string') {
            path = update['path'];
            ts = update['ts'];

            if (typeof update['path'] === 'string') {
              path = update['path'];
            } else if (typeof update['sid'] === 'number') {
              sid = update['sid'];
            } else {
              continue; // invalid response
            }
          }

          value = update['value'];
          options = update;
        } else {
          continue; // invalid response
        }

        let controller;

        if (path != null) {
          controller = this.subscriptions.get(path);
        } else if (sid > -1) {
          controller = this.subscriptionIds.get(sid);
        }

        if (controller != null) {
          let valueUpdate = new _value.ValueUpdate(value, ts, options);
          controller.addValue(valueUpdate);
        }
      }
    }
  }

  addSubscription(controller, level) {
    let path = controller.node.remotePath;
    this.subscriptions.set(path, controller);
    this.subscriptionIds.set(controller.sid, controller);
    this.prepareSending();

    this._changedPaths.add(path);
  }

  removeSubscription(controller) {
    let path = controller.node.remotePath;

    if (this.subscriptions.has(path)) {
      this.toRemove.set(this.subscriptions.get(path).sid, this.subscriptions.get(path));
      this.prepareSending();
    } else if (this.subscriptionIds.has(controller.sid)) {
      console.error(`unexpected remoteSubscription in the requester, sid: ${controller.sid}`);
    }
  }

  startSendingData(currentTime, waitingAckId) {
    this._pendingSending = false;

    if (waitingAckId !== -1) {
      this._waitingAckCount++;
      this._lastWatingAckId = waitingAckId;
    }

    if (this.requester.connection == null) {
      return;
    }

    let toAdd = [];
    let processingPaths = this._changedPaths;
    this._changedPaths = new Set();

    for (let path of processingPaths) {
      if (this.subscriptions.has(path)) {
        let sub = this.subscriptions.get(path);
        let m = {
          'path': path,
          'sid': sub.sid
        };

        if (sub.currentQos > 0) {
          m['qos'] = sub.currentQos;
        }

        toAdd.push(m);
      }
    }

    if (toAdd.length > 0) {
      this.requester._sendRequest({
        'method': 'subscribe',
        'paths': toAdd
      }, null);
    }

    if (this.toRemove.size > 0) {
      let removeSids = [];

      for (let [sid, sub] of this.toRemove) {
        if (sub.callbacks.size === 0) {
          removeSids.push(sid);
          this.subscriptions.delete(sub.node.remotePath);
          this.subscriptionIds.delete(sub.sid);

          sub._destroy();
        }
      }

      this.requester._sendRequest({
        'method': 'unsubscribe',
        'sids': removeSids
      }, null);

      this.toRemove.clear();
    }
  }

  ackReceived(receiveAckId, startTime, currentTime) {
    if (receiveAckId === this._lastWatingAckId) {
      this._waitingAckCount = 0;
    } else {
      this._waitingAckCount--;
    }

    if (this._sendingAfterAck) {
      this._sendingAfterAck = false;
      this.prepareSending();
    }
  }

  prepareSending() {
    if (this._sendingAfterAck) {
      return;
    }

    if (this._waitingAckCount > _connection_handler.ACK_WAIT_COUNT) {
      this._sendingAfterAck = true;
      return;
    }

    if (!this._pendingSending) {
      this._pendingSending = true;
      this.requester.addProcessor(this);
    }
  }

}
/** @ignore */


exports.SubscribeRequest = SubscribeRequest;

class ReqSubscribeController {
  constructor(node, requester) {
    this.callbacks = new Map();
    this.currentQos = -1;
    this.node = node;
    this.requester = requester;
    this.sid = requester._subscription.getNextSid();
  }

  listen(callback, qos) {
    if (qos < 0 || qos > 3) {
      qos = 0;
    }

    let qosChanged = false;

    if (this.callbacks.has(callback)) {
      this.callbacks.set(callback, qos);
      qosChanged = this.updateQos();
    } else {
      this.callbacks.set(callback, qos);

      if (qos > this.currentQos) {
        qosChanged = true;
        this.currentQos = qos;
      }

      if (this._lastUpdate != null) {
        callback(this._lastUpdate);
      }
    }

    if (qosChanged) {
      this.requester._subscription.addSubscription(this, this.currentQos);
    }
  }

  unlisten(callback) {
    if (this.callbacks.has(callback)) {
      let cacheLevel = this.callbacks.get(callback);
      this.callbacks.delete(callback);

      if (this.callbacks.size === 0) {
        this.requester._subscription.removeSubscription(this);
      } else if (cacheLevel === this.currentQos && this.currentQos > 1) {
        this.updateQos();
      }
    }
  }

  updateQos() {
    let maxQos = 0;

    for (let qos of this.callbacks.values()) {
      maxQos = qos > maxQos ? qos : maxQos;
    }

    if (maxQos !== this.currentQos) {
      this.currentQos = maxQos;
      return true;
    }

    return false;
  }

  addValue(update) {
    this._lastUpdate = update;

    for (let callback of Array.from(this.callbacks.keys())) {
      callback(this._lastUpdate);
    }
  }

  _destroy() {
    this.callbacks.clear();
    this.node._subscribeController = null;
  }

}

exports.ReqSubscribeController = ReqSubscribeController;
},{"../request":"wg7F","../../common/value":"Re02","../../common/connection_handler":"lXIX"}],"nCNP":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Permission = void 0;

// part of dslink.common;
class Permission {
  static parse(obj, defaultVal = Permission.NEVER) {
    if (typeof obj === 'string' && Permission.nameParser.hasOwnProperty(obj)) {
      return Permission.nameParser[obj];
    }

    return defaultVal;
  }

} /// now allowed to do anything


exports.Permission = Permission;
Permission.NONE = 0; /// list node

Permission.LIST = 1; /// read node

Permission.READ = 2; /// write attribute and value

Permission.WRITE = 3; /// config the node

Permission.CONFIG = 4; /// something that can never happen

Permission.NEVER = 5;
Permission.names = ['none', 'list', 'read', 'write', 'config', 'never'];
Permission.nameParser = {
  'none': Permission.NONE,
  'list': Permission.LIST,
  'read': Permission.READ,
  'write': Permission.WRITE,
  'config': Permission.CONFIG,
  'never': Permission.NEVER
};
},{}],"q+mg":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TableMetadata = exports.TableColumns = exports.Table = exports.TableColumn = void 0;

class TableColumn {
  constructor(name, type, defaultValue) {
    this.name = name;
    this.type = type;
    this.defaultValue = defaultValue;
  }

  getData() {
    let rslt = {
      "type": this.type,
      "name": this.name
    };

    if (this.defaultValue != null) {
      rslt["default"] = this.defaultValue;
    }

    return rslt;
  } /// convert tableColumns into List of object


  static serializeColumns(list) {
    let rslts = [];

    for (let m of list) {
      if (m instanceof Object) {
        if (m instanceof TableColumn) {
          rslts.push(m.getData());
        } else {
          rslts.push(m);
        }
      }
    }

    return rslts;
  } /// parse List of object into TableColumn


  static parseColumns(list) {
    let rslt = [];

    for (let m of list) {
      if (m != null && m instanceof Object && typeof m["name"] === 'string') {
        let type = "string";

        if (typeof m["type"] === 'string') {
          type = m["type"];
        }

        rslt.push(new TableColumn(m["name"], type, m["default"]));
      } else if (m instanceof TableColumn) {
        rslt.push(m);
      } else {
        // invalid column data
        return null;
      }
    }

    return rslt;
  }

}

exports.TableColumn = TableColumn;

class Table {
  constructor(columns, rows, meta) {
    this.columns = columns;
    this.rows = rows;
    this.meta = meta;
  }

}

exports.Table = Table;

class TableColumns {
  constructor(columns) {
    this.columns = columns;
  }

}

exports.TableColumns = TableColumns;

class TableMetadata {
  constructor(meta) {
    this.meta = meta;
  }

}

exports.TableMetadata = TableMetadata;
},{}],"+yD6":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InvokeController = exports.RequesterInvokeStream = exports.RequesterInvokeUpdate = void 0;

var _async = require("../../utils/async");

var _permission = require("../../common/permission");

var _interfaces = require("../../common/interfaces");

var _table = require("../../common/table");

var _interface = require("../interface");

class RequesterInvokeUpdate extends _interface.RequesterUpdate {
  constructor(updates, rawColumns, columns, streamStatus, meta, error) {
    super(streamStatus);
    this.updates = updates;
    this.rawColumns = rawColumns;
    this.meta = meta;
    this.error = error;
  }

  get rows() {
    let colLen = -1;

    if (this.columns != null) {
      colLen = this.columns.length;
    }

    if (this._rows == null) {
      this._rows = [];

      if (this.updates == null) {
        return this._rows;
      }

      for (let obj of this.updates) {
        let row;

        if (Array.isArray(obj)) {
          if (obj.length < colLen) {
            row = obj.concat();

            for (let i = obj.length; i < colLen; ++i) {
              row.push(this.columns[i].defaultValue);
            }
          } else if (obj.length > colLen) {
            if (colLen === -1) {
              // when column is unknown, just return all values
              row = obj.concat();
            } else {
              row = obj.slice(0, colLen);
            }
          } else {
            row = obj;
          }
        } else if (obj != null && obj instanceof Object) {
          row = [];

          if (this.columns == null) {
            let keys = obj.keys;
            this.columns = keys.map(x => new _table.TableColumn(x, "dynamic"));
          }

          if (this.columns != null) {
            for (let column of this.columns) {
              if (obj.hasOwnProperty(column.name)) {
                row.push(obj[column.name]);
              } else {
                row.push(column.defaultValue);
              }
            }
          }
        }

        this._rows.push(row);
      }
    }

    return this._rows;
  }

}

exports.RequesterInvokeUpdate = RequesterInvokeUpdate;

class RequesterInvokeStream extends _async.Stream {}
/** @ignore */


exports.RequesterInvokeStream = RequesterInvokeStream;

class InvokeController {
  constructor(node, requester, params, maxPermission = _permission.Permission.CONFIG) {
    this.mode = 'stream';
    this.lastStatus = _interfaces.StreamStatus.initialize;

    this._onUnsubscribe = obj => {
      if (this._request != null && this._request.streamStatus !== _interfaces.StreamStatus.closed) {
        this._request.close();
      }
    };

    this.node = node;
    this.requester = requester;
    this._stream = new RequesterInvokeStream();
    this._stream._onClose = this._onUnsubscribe;
    let reqMap = {
      'method': 'invoke',
      'path': node.remotePath,
      'params': params
    };

    if (maxPermission !== _permission.Permission.CONFIG) {
      reqMap['permit'] = _permission.Permission.names[maxPermission];
    } // TODO: update node before invoke to load columns
    //    if(!node.isUpdated()) {
    //      node._list().listen( this._onNodeUpdate)
    //    } else {


    this._request = requester._sendRequest(reqMap, this);
    this._stream.request = this._request; //    }
  }

  static getNodeColumns(node) {
    let columns = node.getConfig('$columns');

    if (!Array.isArray(columns) && node.profile != null) {
      columns = node.profile.getConfig('$columns');
    }

    if (Array.isArray(columns)) {
      return _table.TableColumn.parseColumns(columns);
    }

    return null;
  }

  onUpdate(streamStatus, updates, columns, meta, error) {
    if (meta != null && typeof meta['mode'] === 'string') {
      this.mode = meta['mode'];
    } // TODO: implement error


    if (columns != null) {
      if (this._cachedColumns == null || this.mode === 'refresh') {
        this._cachedColumns = _table.TableColumn.parseColumns(columns);
      } else {
        this._cachedColumns = this._cachedColumns.concat(_table.TableColumn.parseColumns(columns));
      }
    } else if (this._cachedColumns == null) {
      this._cachedColumns = InvokeController.getNodeColumns(this.node);
    }

    if (error != null) {
      streamStatus = _interfaces.StreamStatus.closed;

      this._stream.add(new RequesterInvokeUpdate(null, null, null, streamStatus, meta, error));
    } else if (updates != null || meta != null || streamStatus !== this.lastStatus) {
      this._stream.add(new RequesterInvokeUpdate(updates, columns, this._cachedColumns, streamStatus, meta));
    }

    this.lastStatus = streamStatus;

    if (streamStatus === _interfaces.StreamStatus.closed) {
      this._stream.close();
    }
  }

  onDisconnect() {}

  onReconnect() {}

}

exports.InvokeController = InvokeController;
},{"../../utils/async":"bajV","../../common/permission":"nCNP","../../common/interfaces":"N9NG","../../common/table":"q+mg","../interface":"wq45"}],"UnXq":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildEnumType = buildEnumType;

function buildEnumType(values) {
  return `enum[${values.join(',')}]`;
}
},{}],"jg7K":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DefaultDefNodes = exports.RemoteDefNode = exports.RemoteNode = exports.RemoteNodeCache = void 0;

var _node = require("../common/node");

var _list = require("./request/list");

var _subscribe = require("./request/subscribe");

var _permission = require("../common/permission");

var _invoke = require("./request/invoke");

var _utils = require("../../utils");

/// manage cached nodes for requester

/** @ignore */
class RemoteNodeCache {
  constructor() {
    this._nodes = new Map();
  }

  RemoteNodeCache() {}

  getRemoteNode(path) {
    let node = this._nodes.get(path);

    if (node == null) {
      if (this._nodes.size % 1000 === 0) {//        logger.fine("Node Cache hit ${this._nodes.length} nodes in size.");
      }

      if (path.startsWith("defs")) {
        node = new RemoteDefNode(path);

        this._nodes.set(path, node);
      } else {
        node = new RemoteNode(path);

        this._nodes.set(path, node);
      }
    }

    return node;
  }

  cachedNodePaths() {
    return this._nodes.keys;
  }

  isNodeCached(path) {
    return this._nodes.has(path);
  }

  clearCachedNode(path) {
    this._nodes.delete(path);
  }

  clear() {
    this._nodes.clear();
  }

  getDefNode(path, defName) {
    if (DefaultDefNodes.nameMap.hasOwnProperty(defName)) {
      return DefaultDefNodes.nameMap[defName];
    }

    return this.getRemoteNode(path);
  } /// update node with a map.


  updateRemoteChildNode(parent, name, m) {
    let path;

    if (parent.remotePath === '/') {
      path = `/${name}`;
    } else {
      path = `${parent.remotePath}/${name}`;
    }

    let rslt;

    if (this._nodes.has(path)) {
      rslt = this._nodes.get(path);
      rslt.updateRemoteChildData(m, this);
    } else {
      rslt = new RemoteNode(path);

      this._nodes.set(path, rslt);

      rslt.updateRemoteChildData(m, this);
    }

    return rslt;
  }

}

exports.RemoteNodeCache = RemoteNodeCache;

class RemoteNode extends _node.Node {
  constructor(remotePath) {
    super();
    /** @ignore */

    this.listed = false;
    this.remotePath = remotePath;

    this._getRawName();
  }
  /** @ignore */


  get subscribeController() {
    return this._subscribeController;
  }

  get hasValueUpdate() {
    if (this._subscribeController == null) {
      return false;
    }

    return this._subscribeController._lastUpdate != null;
  }

  get lastValueUpdate() {
    if (this.hasValueUpdate) {
      return this._subscribeController._lastUpdate;
    } else {
      return null;
    }
  }
  /** @ignore */


  _getRawName() {
    if (this.remotePath === '/') {
      this.name = '/';
    } else {
      this.name = this.remotePath.split('/').pop();
    }
  } /// node data is not ready until all profile and mixins are updated

  /** @ignore */


  isUpdated() {
    if (!this.isSelfUpdated()) {
      return false;
    }

    if (this.profile instanceof RemoteNode && !this.profile.isSelfUpdated()) {
      return false;
    }

    return true;
  } /// whether the node's own data is updated

  /** @ignore */


  isSelfUpdated() {
    return this._listController != null && this._listController.initialized;
  }
  /** @ignore */


  _list(requester) {
    if (this._listController == null) {
      this._listController = this.createListController(requester);
    }

    return this._listController.stream;
  } /// need a factory function for children class to override

  /** @ignore */


  createListController(requester) {
    return new _list.ListController(this, requester);
  }
  /** @ignore */


  _subscribe(requester, callback, qos) {
    if (this._subscribeController == null) {
      this._subscribeController = new _subscribe.ReqSubscribeController(this, requester);
    }

    this._subscribeController.listen(callback, qos);
  }
  /** @ignore */


  _unsubscribe(requester, callback) {
    if (this._subscribeController != null) {
      this._subscribeController.unlisten(callback);
    }
  }
  /** @ignore */


  _invoke(params, requester, maxPermission = _permission.Permission.CONFIG) {
    return new _invoke.InvokeController(this, requester, params, maxPermission)._stream;
  }
  /** @ignore */
  /// used by list api to update simple data for children


  updateRemoteChildData(m, cache) {
    let childPathPre;

    if (this.remotePath === '/') {
      childPathPre = '/';
    } else {
      childPathPre = `${this.remotePath}/`;
    }

    for (let key in m) {
      let value = m[key];

      if (key.startsWith('$')) {
        this.configs.set(key, value);
      } else if (key.startsWith('@')) {
        this.attributes.set(key, value);
      } else if (value != null && value instanceof Object) {
        let node = cache.getRemoteNode(`${childPathPre}/${key}`);
        this.children.set(key, node);

        if (node instanceof RemoteNode) {
          node.updateRemoteChildData(value, cache);
        }
      }
    }
  } /// clear all configs attributes and children

  /** @ignore */


  resetNodeCache() {
    this.configs.clear();
    this.attributes.clear();
    this.children.clear();
  }
  /** @ignore */


  save(includeValue = true) {
    let map = {};

    for (let [key, value] of this.configs) {
      map[key] = value;
    }

    for (let [key, value] of this.attributes) {
      map[key] = value;
    }

    for (let [key, node] of this.children) {
      map[key] = node instanceof RemoteNode ? node.save() : node.getSimpleMap();
    }

    if (includeValue && this._subscribeController != null && this._subscribeController._lastUpdate != null) {
      map["?value"] = this._subscribeController._lastUpdate.value;
      map["?value_timestamp"] = this._subscribeController._lastUpdate.ts;
    }

    return map;
  }

}
/** @ignore */


exports.RemoteNode = RemoteNode;

class RemoteDefNode extends RemoteNode {
  constructor(path) {
    super(path);
  }

}
/** @ignore */


exports.RemoteDefNode = RemoteDefNode;

class DefaultDefNodes {}

exports.DefaultDefNodes = DefaultDefNodes;
DefaultDefNodes._defaultDefs = {
  "node": {},
  "static": {},
  "getHistory": {
    "$invokable": "read",
    "$result": "table",
    "$params": [{
      "name": "Timerange",
      "type": "string",
      "edito": "daterange"
    }, {
      "name": "Interval",
      "type": "enum",
      "default": "none",
      "edito": (0, _utils.buildEnumType)(["default", "none", "1Y", "3N", "1N", "1W", "1D", "12H", "6H", "4H", "3H", "2H", "1H", "30M", "15M", "10M", "5M", "1M", "30S", "15S", "10S", "5S", "1S"])
    }, {
      "name": "Rollup",
      "default": "none",
      "type": (0, _utils.buildEnumType)(["none", "avg", "min", "max", "sum", "first", "last", "count", "delta"])
    }],
    "$columns": [{
      "name": "timestamp",
      "type": "time"
    }, {
      "name": "value",
      "type": "dynamic"
    }]
  }
};

DefaultDefNodes.nameMap = function () {
  let rslt = {};

  for (let k in DefaultDefNodes._defaultDefs) {
    let m = DefaultDefNodes._defaultDefs[k];
    let path = `/defs/profile/${k}`;
    let node = new RemoteDefNode(path);

    for (let n in m) {
      let v = DefaultDefNodes._defaultDefs[k];

      if (n.startsWith('$')) {
        node.configs.set(n, v);
      } else if (n.startsWith('@')) {
        node.attributes.set(n, v);
      }
    }

    node.listed = true;
    rslt[k] = node;
  }

  return rslt;
}();

DefaultDefNodes.pathMap = function () {
  let rslt = {};

  for (let k in DefaultDefNodes.nameMap) {
    let node = DefaultDefNodes.nameMap[k];

    if (node instanceof RemoteNode) {
      rslt[node.remotePath] = node;
    }
  }

  return rslt;
}();
},{"../common/node":"QClj","./request/list":"duux","./request/subscribe":"YpSC","../common/permission":"nCNP","./request/invoke":"+yD6","../../utils":"UnXq"}],"wdMm":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SetController = void 0;

var _async = require("../../utils/async");

var _permission = require("../../common/permission");

var _interface = require("../interface");

/** @ignore */
class SetController {
  constructor(requester, path, value, maxPermission = _permission.Permission.CONFIG) {
    this.completer = new _async.Completer();
    this.requester = requester;
    this.path = path;
    this.value = value;
    let reqMap = {
      'method': 'set',
      'path': path,
      'value': value
    };

    if (maxPermission !== _permission.Permission.CONFIG) {
      reqMap['permit'] = _permission.Permission.names[maxPermission];
    }

    this._request = requester._sendRequest(reqMap, this);
  }

  get future() {
    return this.completer.future;
  }

  onUpdate(status, updates, columns, meta, error) {
    // TODO implement error
    this.completer.complete(new _interface.RequesterUpdate(status));
  }

  onDisconnect() {}

  onReconnect() {}

}

exports.SetController = SetController;
},{"../../utils/async":"bajV","../../common/permission":"nCNP","../interface":"wq45"}],"Eaoe":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RemoveController = void 0;

var _async = require("../../utils/async");

var _interface = require("../interface");

/** @ignore */
class RemoveController {
  constructor(requester, path) {
    this.completer = new _async.Completer();
    this.requester = requester;
    this.path = path;
    let reqMap = {
      'method': 'remove',
      'path': path
    };
    this._request = requester._sendRequest(reqMap, this);
  }

  get future() {
    return this.completer.future;
  }

  onUpdate(status, updates, columns, meta, error) {
    // TODO implement error
    this.completer.complete(new _interface.RequesterUpdate(status));
  }

  onDisconnect() {}

  onReconnect() {}

}

exports.RemoveController = RemoveController;
},{"../../utils/async":"bajV","../interface":"wq45"}],"9L6c":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Requester = void 0;

var _async = require("../utils/async");

var _request = require("./request");

var _connection_handler = require("../common/connection_handler");

var _node_cache = require("./node_cache");

var _subscribe = require("./request/subscribe");

var _interfaces = require("../common/interfaces");

var _list = require("./request/list");

var _permission = require("../common/permission");

var _set = require("./request/set");

var _remove = require("./request/remove");

class Requester extends _connection_handler.ConnectionHandler {
  constructor(cache) {
    super();
    /** @ignore */

    this._requests = new Map();
    /** @ignore */

    this.onData = list => {
      if (Array.isArray(list)) {
        for (let resp of list) {
          if (resp != null && resp instanceof Object) {
            this._onReceiveUpdate(resp);
          }
        }
      }
    };
    /** @ignore */


    this.onError = new _async.Stream();
    /** @ignore */

    this.lastRid = 0;
    /** @ignore */

    this._connected = false;
    this.nodeCache = cache ? cache : new _node_cache.RemoteNodeCache();
    this._subscription = new _subscribe.SubscribeRequest(this, 0);

    this._requests.set(0, this._subscription);
  }

  get subscriptionCount() {
    return this._subscription.subscriptions.size;
  }

  get openRequestCount() {
    return this._requests.size;
  }
  /** @ignore */


  _onReceiveUpdate(m) {
    if (typeof m['rid'] === 'number' && this._requests.has(m['rid'])) {
      this._requests.get(m['rid'])._update(m);
    }
  }
  /** @ignore */


  getNextRid() {
    do {
      if (this.lastRid < 0x7FFFFFFF) {
        ++this.lastRid;
      } else {
        this.lastRid = 1;
      }
    } while (this._requests.has(this.lastRid));

    return this.lastRid;
  }
  /** @ignore */


  getSendingData(currentTime, waitingAckId) {
    let rslt = super.getSendingData(currentTime, waitingAckId);
    return rslt;
  }
  /** @ignore */


  sendRequest(m, updater) {
    return this._sendRequest(m, updater);
  }
  /** @ignore */


  _sendRequest(m, updater) {
    m['rid'] = this.getNextRid();
    let req;

    if (updater != null) {
      req = new _request.Request(this, this.lastRid, updater, m);

      this._requests.set(this.lastRid, req);
    }

    if (this._conn) {
      this.addToSendList(m);
    }

    return req;
  }

  isNodeCached(path) {
    return this.nodeCache.isNodeCached(path);
  }
  /**
   * Subscribe a path and get value updates in a async callback
   * If you only need to get the current value once, use [[subscribeOnce]] instead.
   *
   * A Subscription listener should be close with [[ReqSubscribeListener.close]] when it's no longer needed.
   * You can also use the [[unsubscribe]] method to close the callback.
   *
   * @param callback - if same callback is subscribed twice, the previous one will be overwritten with new qos value
   * @param qos - qos level of the subscription
   *   - 0: allow value skipping as long as the last update is received
   *   - 1: no value skipping
   */


  subscribe(path, callback, qos = 0) {
    let node = this.nodeCache.getRemoteNode(path);

    node._subscribe(this, callback, qos);

    return new _subscribe.ReqSubscribeListener(this, path, callback);
  }
  /**
   * Unsubscribe the callback
   */


  unsubscribe(path, callback) {
    let node = this.nodeCache.getRemoteNode(path);

    node._unsubscribe(this, callback);
  }
  /** @ignore */


  onValueChange(path, qos = 0) {
    let listener;
    let stream;
    stream = new _async.Stream(() => {
      if (listener == null) {
        listener = this.subscribe(path, update => {
          stream.add(update);
        }, qos);
      }
    }, () => {
      if (listener) {
        listener.close();
        listener = null;
      }
    });
    return stream;
  }
  /**
   * Subscribe and get value update only once, subscription will be closed automatically when an update is received
   */


  subscribeOnce(path, timeoutMs = 0) {
    return new Promise((resolve, reject) => {
      let timer;
      let listener = this.subscribe(path, update => {
        resolve(update);

        if (listener != null) {
          listener.close();
          listener = null;
        }

        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      });

      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          timer = null;

          if (listener) {
            listener.close();
            listener = null;
          }

          reject(new Error(`failed to receive value, timeout: ${timeoutMs}ms`));
        }, timeoutMs);
      }
    });
  }
  /**
   * List and get node metadata and children summary only once, subscription will be closed automatically when an update is received
   */


  listOnce(path) {
    return new Promise((resolve, reject) => {
      let sub = this.list(path, update => {
        resolve(update.node);

        if (sub != null) {
          sub.close();
        }
      });
    });
  }
  /**
   * List a path and get the node metadata as well as a summary of children nodes.
   * This method will keep a stream and continue to get updates. If you only need to get the current value once, use [[listOnce]] instead.
   *
   * A Subscription should be close with [[StreamSubscription.close]] when it's no longer needed.
   */


  list(path, callback) {
    let node = this.nodeCache.getRemoteNode(path);
    return node._list(this).listen(callback);
  }
  /**
   * Invoke a node action, and receive updates.
   * Usually an action stream will be closed on server side,
   * but in the case of a streaming action the returned stream needs to be closed with [[RequesterInvokeStream.close]]
   */


  invoke(path, params = {}, callback, maxPermission = _permission.Permission.CONFIG) {
    let node = this.nodeCache.getRemoteNode(path);

    let stream = node._invoke(params, this, maxPermission);

    if (callback) {
      stream.listen(callback);
    }

    return stream;
  }
  /**
   * Invoke a node action, and receive update only once, stream will be closed automatically if necessary
   */


  invokeOnce(path, params = {}, callback, maxPermission = _permission.Permission.CONFIG) {
    let node = this.nodeCache.getRemoteNode(path);

    let stream = node._invoke(params, this, maxPermission);

    if (callback) {
      stream.listen(callback);
    }

    stream.listen(update => {
      if (update.streamStatus !== _interfaces.StreamStatus.closed) {
        stream.close();
      }
    });
    return stream;
  }
  /**
   * Set the value of an attribute, the attribute will be created if not exists
   */


  set(path, value, maxPermission = _permission.Permission.CONFIG) {
    return new _set.SetController(this, path, value, maxPermission).future;
  }
  /**
   * Remove an attribute
   */


  remove(path) {
    return new _remove.RemoveController(this, path).future;
  } /// close the request from requester side and notify responder

  /** @ignore */


  closeRequest(request) {
    if (this._requests.has(request.rid)) {
      if (request.streamStatus !== _interfaces.StreamStatus.closed) {
        this.addToSendList({
          'method': 'close',
          'rid': request.rid
        });
      }

      this._requests.delete(request.rid);

      request.close();
    }
  }
  /** @ignore */


  onDisconnected() {
    if (!this._connected) return;
    this._connected = false;
    let newRequests = new Map();
    newRequests.set(0, this._subscription);

    for (let [n, req] of this._requests) {
      if (req.rid <= this.lastRid && !(req.updater instanceof _list.ListController)) {
        req._close(_interfaces.DSError.DISCONNECTED);
      } else {
        newRequests.set(req.rid, req);
        req.updater.onDisconnect();
      }
    }

    this._requests = newRequests;
  }
  /** @ignore */


  onReconnected() {
    if (this._connected) return;
    this._connected = true;
    super.onReconnected();

    for (let [n, req] of this._requests) {
      req.updater.onReconnect();
      req.resend();
    }
  }

}

exports.Requester = Requester;
},{"../utils/async":"bajV","./request":"wg7F","../common/connection_handler":"lXIX","./node_cache":"jg7K","./request/subscribe":"YpSC","../common/interfaces":"N9NG","./request/list":"duux","../common/permission":"nCNP","./request/set":"wdMm","./request/remove":"Eaoe"}],"Hcj+":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PassiveChannel = void 0;

var _async = require("../utils/async");

class PassiveChannel {
  constructor(conn, connected = false) {
    this.onReceive = new _async.Stream();
    this._processors = [];
    this._isReady = false;
    this.connected = true;
    this.onDisconnectController = new _async.Completer();
    this.onConnectController = new _async.Completer();
    this.conn = conn;
    this.connected = connected;
  }

  sendWhenReady(handler) {
    this.handler = handler;
    this.conn.requireSend();
  }

  getSendingData(currentTime, waitingAckId) {
    if (this.handler != null) {
      let rslt = this.handler.getSendingData(currentTime, waitingAckId); // handler = null;

      return rslt;
    }

    return null;
  }

  get isReady() {
    return this._isReady;
  }

  set isReady(val) {
    this._isReady = val;
  }

  get onDisconnected() {
    return this.onDisconnectController.future;
  }

  get onConnected() {
    return this.onConnectController.future;
  }

  updateConnect() {
    if (this.connected) return;
    this.connected = true;
    this.onConnectController.complete(this);
  }

}

exports.PassiveChannel = PassiveChannel;
},{"../utils/async":"bajV"}],"3FSK":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebSocketConnection = void 0;

var _interfaces = require("../common/interfaces");

var _connection_channel = require("../common/connection_channel");

var _async = require("../utils/async");

class WebSocketConnection extends _interfaces.Connection {
  /// clientLink is not needed when websocket works in server link
  constructor(socket, clientLink, onConnect, useCodec) {
    super();
    this._onRequestReadyCompleter = new _async.Completer();
    this._onDisconnectedCompleter = new _async.Completer();
    this._dataSent = false; /// add this count every 20 seconds, set to 0 when receiving data
    /// when the count is 3, disconnect the link

    this._dataReceiveCount = 0;
    this._opened = false;
    this.nextMsgId = 1;
    this._sending = false;
    this._authError = false;
    this.socket = socket;
    this.clientLink = clientLink;
    this.onConnect = onConnect;

    if (useCodec != null) {
      this.codec = useCodec;
    }

    socket.binaryType = "arraybuffer";
    this._responderChannel = new _connection_channel.PassiveChannel(this);
    this._requesterChannel = new _connection_channel.PassiveChannel(this);

    socket.onmessage = event => {
      this._onData(event);
    };

    socket.onclose = event => {
      this._onDone(event);
    };

    socket.onopen = event => {
      this._onOpen(event);
    }; // TODO, when it's used in client link, wait for the server to send {allowed} before complete this


    setTimeout(() => {
      this._onRequestReadyCompleter.complete(this._requesterChannel);
    }, 0);
    this.pingTimer = setInterval(() => {
      this.onPingTimer();
    }, 20000);
  }

  get responderChannel() {
    return this._responderChannel;
  }

  get requesterChannel() {
    return this._requesterChannel;
  }

  get onRequesterReady() {
    return this._onRequestReadyCompleter.future;
  }

  get onDisconnected() {
    return this._onDisconnectedCompleter.future;
  }

  onPingTimer() {
    if (this._dataReceiveCount >= 3) {
      close();
      return;
    }

    this._dataReceiveCount++;

    if (this._dataSent) {
      this._dataSent = false;
      return;
    }

    this.addConnCommand(null, null);
  }

  requireSend() {
    if (!this._sending) {
      this._sending = true;
      setTimeout(() => {
        this._send();
      }, 0);
    }
  }

  get opened() {
    return this._opened;
  }

  _onOpen(e) {
    //    logger.info("Connected");
    this._opened = true;

    if (this.onConnect != null) {
      this.onConnect();
    }

    this._responderChannel.updateConnect();

    this._requesterChannel.updateConnect();

    this.socket.send(this.codec.blankData);
    this.requireSend();
  } /// add server command, will be called only when used as server connection


  addConnCommand(key, value) {
    if (this._msgCommand == null) {
      this._msgCommand = {};
    }

    if (key != null) {
      this._msgCommand[key] = value;
    }

    this.requireSend();
  }

  _onData(e) {
    //    logger.fine("onData:");
    this._dataReceiveCount = 0;
    let m;

    if (e.data instanceof ArrayBuffer) {
      try {
        let bytes = new Uint8Array(e.data);
        m = this.codec.decodeBinaryFrame(bytes); //        logger.fine("$m");

        if (typeof m["salt"] === 'string') {
          this.clientLink.updateSalt(m["salt"]);
        }

        let needAck = false;

        if (Array.isArray(m["responses"]) && m["responses"].length > 0) {
          needAck = true; // send responses to requester channel

          this._requesterChannel.onReceive.add(m["responses"]);
        }

        if (Array.isArray(m["requests"]) && m["requests"].length > 0) {
          needAck = true; // send requests to responder channel

          this._responderChannel.onReceive.add(m["requests"]);
        }

        if (typeof m["ack"] === 'number') {
          this.ack(m["ack"]);
        }

        if (needAck) {
          let msgId = m["msg"];

          if (msgId != null) {
            this.addConnCommand("ack", msgId);
          }
        }
      } catch (err) {
        console.error("error in onData", err);
        this.close();
        return;
      }
    } else if (typeof e.data === 'string') {
      try {
        m = this.codec.decodeStringFrame(e.data); //        logger.fine("$m");

        let needAck = false;

        if (Array.isArray(m["responses"]) && m["responses"].length > 0) {
          needAck = true; // send responses to requester channel

          this._requesterChannel.onReceive.add(m["responses"]);
        }

        if (Array.isArray(m["requests"]) && m["requests"].length > 0) {
          needAck = true; // send requests to responder channel

          this._responderChannel.onReceive.add(m["requests"]);
        }

        if (typeof m["ack"] === "number") {
          this.ack(m["ack"]);
        }

        if (needAck) {
          let msgId = m["msg"];

          if (msgId != null) {
            this.addConnCommand("ack", msgId);
          }
        }
      } catch (err) {
        console.error(err);
        this.close();
        return;
      }
    }
  }

  _send() {
    this._sending = false;

    if (this.socket.readyState !== WebSocket.OPEN) {
      return;
    } //    logger.fine("browser sending");


    let needSend = false;
    let m;

    if (this._msgCommand != null) {
      m = this._msgCommand;
      needSend = true;
      this._msgCommand = null;
    } else {
      m = {};
    }

    let pendingAck = [];
    let ts = new Date().getTime();

    let rslt = this._responderChannel.getSendingData(ts, this.nextMsgId);

    if (rslt != null) {
      if (rslt.messages.length > 0) {
        m["responses"] = rslt.messages;
        needSend = true;
      }

      if (rslt.processors.length > 0) {
        pendingAck = pendingAck.concat(rslt.processors);
      }
    }

    rslt = this._requesterChannel.getSendingData(ts, this.nextMsgId);

    if (rslt != null) {
      if (rslt.messages.length > 0) {
        m["requests"] = rslt.messages;
        needSend = true;
      }

      if (rslt.processors.length > 0) {
        pendingAck = pendingAck.concat(rslt.processors);
      }
    }

    if (needSend) {
      if (this.nextMsgId !== -1) {
        if (pendingAck.length > 0) {
          this.pendingAcks.push(new _interfaces.ConnectionAckGroup(this.nextMsgId, ts, pendingAck));
        }

        m["msg"] = this.nextMsgId;

        if (this.nextMsgId < 0x7FFFFFFF) {
          ++this.nextMsgId;
        } else {
          this.nextMsgId = 1;
        }
      } //      logger.fine("send: $m");


      let encoded = this.codec.encodeFrame(m);

      try {
        this.socket.send(encoded);
      } catch (e) {
        console.error('Unable to send on socket', e);
        this.close();
      }

      this._dataSent = true;
    }
  }

  _onDone(o) {
    if (o instanceof CloseEvent) {
      if (o.code === 1006) {
        this._authError = true;
      }
    } //    logger.fine("socket disconnected");


    if (!this._requesterChannel.onReceive.isClosed) {
      this._requesterChannel.onReceive.close();
    }

    if (!this._requesterChannel.onDisconnectController.isCompleted) {
      this._requesterChannel.onDisconnectController.complete(this._requesterChannel);
    }

    if (!this._responderChannel.onReceive.isClosed) {
      this._responderChannel.onReceive.close();
    }

    if (!this._responderChannel.onDisconnectController.isCompleted) {
      this._responderChannel.onDisconnectController.complete(this._responderChannel);
    }

    if (!this._onDisconnectedCompleter.isCompleted) {
      this._onDisconnectedCompleter.complete(this._authError);
    }

    if (this.pingTimer != null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  close() {
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close();
    }

    this._onDone();
  }

}

exports.WebSocketConnection = WebSocketConnection;
},{"../common/interfaces":"N9NG","../common/connection_channel":"Hcj+","../utils/async":"bajV"}],"0BdU":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BrowserUserLink = void 0;

var _interfaces = require("../common/interfaces");

var _async = require("../utils/async");

var _requester = require("../requester/requester");

var _browser_ws_conn = require("./browser_ws_conn");

var _codec = require("../utils/codec");

/// a client link for both http and ws

/** @ignore */
class DummyECDH {
  constructor() {
    this.encodedPublicKey = "";
  }

  hashSalt(salt) {
    return '';
  }

  verifySalt(salt, hash) {
    return true;
  }

}

class BrowserUserLink extends _interfaces.ClientLink {
  constructor(wsUpdateUri, format = 'msgpack') {
    super();
    /** @ignore */

    this._onRequesterReadyCompleter = new _async.Completer();
    this.requester = new _requester.Requester(); //  readonly responder: Responder;

    /** @ignore */

    this.nonce = new DummyECDH();
    /** @ignore */

    this._wsDelay = 1;

    if (wsUpdateUri.startsWith("http")) {
      wsUpdateUri = `ws${wsUpdateUri.substring(4)}`;
    }

    this.wsUpdateUri = wsUpdateUri;
    this.format = format;

    if (window.location.hash.includes("dsa_json")) {
      this.format = "json";
    }
  }

  get onRequesterReady() {
    return this._onRequesterReadyCompleter.future;
  }
  /** @ignore */


  updateSalt(salt) {// do nothing
  }

  connect() {
    this.initWebsocket(false);
  }
  /** @ignore */


  initWebsocketLater(ms) {
    if (this._initSocketTimer) return;
    this._initSocketTimer = setTimeout(() => this.initWebsocket, ms);
  }
  /** @ignore */


  initWebsocket(reconnect = true) {
    this._initSocketTimer = null;
    let socket = new WebSocket(`${this.wsUpdateUri}?session=${BrowserUserLink.session}&format=${this.format}`);
    this._wsConnection = new _browser_ws_conn.WebSocketConnection(socket, this, null, _codec.DsCodec.getCodec(this.format)); // if (this.responder != null) {
    //   this.responder.connection = this._wsConnection.responderChannel;
    // }

    if (this.requester != null) {
      this._wsConnection.onRequesterReady.then(channel => {
        this.requester.connection = channel;

        if (!this._onRequesterReadyCompleter.isCompleted) {
          this._onRequesterReadyCompleter.complete(this.requester);
        }
      });
    }

    this._wsConnection.onDisconnected.then(connection => {
      //      logger.info("Disconnected");
      if (this._wsConnection == null) {
        // connection is closed
        return;
      }

      if (this._wsConnection._opened) {
        this._wsDelay = 1;
        this.initWebsocket(false);
      } else if (reconnect) {
        this.initWebsocketLater(this._wsDelay * 1000);
        if (this._wsDelay < 60) this._wsDelay++;
      } else {
        this._wsDelay = 5;
        this.initWebsocketLater(5000);
      }
    });
  }

  reconnect() {
    if (this._wsConnection != null) {
      this._wsConnection.socket.close();
    }
  }

  close() {
    if (this._initSocketTimer) {
      clearTimeout(this._initSocketTimer);
      this._initSocketTimer = null;
    }

    if (this._wsConnection != null) {
      this._wsConnection.close();

      this._wsConnection = null;
    }
  }

}
/** @ignore */


exports.BrowserUserLink = BrowserUserLink;
BrowserUserLink.session = Math.random().toString(16).substr(2, 8);
},{"../common/interfaces":"N9NG","../utils/async":"bajV","../requester/requester":"9L6c","./browser_ws_conn":"3FSK","../utils/codec":"TRmg"}],"txRo":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DSLink = void 0;

var _browser_user_link = require("./src/browser/browser_user_link");

if (Object.isExtensible(window)) {
  window.DSLink = _browser_user_link.BrowserUserLink;
}

const DSLink = _browser_user_link.BrowserUserLink;
exports.DSLink = DSLink;
},{"./src/browser/browser_user_link":"0BdU"}]},{},["txRo"], null)
//# sourceMappingURL=/web.map