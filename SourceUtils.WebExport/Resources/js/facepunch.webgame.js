var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Facepunch;
(function (Facepunch) {
    var Loader = (function () {
        function Loader() {
            this.queue = [];
            this.loaded = {};
            this.active = [];
            this.completed = 0;
        }
        Loader.prototype.load = function (url) {
            var loaded = this.loaded[url];
            if (loaded != null)
                return loaded;
            loaded = this.onCreateItem(url);
            this.loaded[url] = loaded;
            this.enqueueItem(loaded);
            return loaded;
        };
        Loader.prototype.getLoadProgress = function () {
            var total = this.queue.length + this.active.length + this.completed;
            var complete = this.completed;
            for (var _i = 0, _a = this.queue; _i < _a.length; _i++) {
                var item = _a[_i];
                complete += item.getLoadProgress();
            }
            for (var _b = 0, _c = this.active; _b < _c.length; _b++) {
                var item = _c[_b];
                complete += item.getLoadProgress();
            }
            return total > 0 ? complete / total : 0;
        };
        Loader.prototype.enqueueItem = function (item) {
            this.queue.push(item);
        };
        Loader.prototype.onFinishedLoadStep = function (item) { };
        Loader.prototype.getNextToLoad = function () {
            if (this.queue.length <= 0)
                return null;
            var bestIndex = -1;
            var bestItem = this.queue[0];
            var bestPriority = 0;
            for (var i = 0, iEnd = this.queue.length; i < iEnd; ++i) {
                var item = this.queue[i];
                var priority = item.getLoadPriority();
                if (priority <= bestPriority)
                    continue;
                bestIndex = i;
                bestItem = item;
                bestPriority = priority;
            }
            if (bestIndex === -1)
                return null;
            return this.queue.splice(bestIndex, 1)[0];
        };
        Loader.prototype.update = function (requestQuota) {
            var _this = this;
            var next;
            var _loop_1 = function () {
                this_1.active.push(next);
                var nextCopy = next;
                next.loadNext(function (requeue) {
                    _this.active.splice(_this.active.indexOf(nextCopy), 1);
                    if (requeue)
                        _this.queue.push(nextCopy);
                    else
                        ++_this.completed;
                    _this.onFinishedLoadStep(nextCopy);
                });
            };
            var this_1 = this;
            while (this.active.length < requestQuota && (next = this.getNextToLoad()) != null) {
                _loop_1();
            }
            return this.active.length;
        };
        return Loader;
    }());
    Facepunch.Loader = Loader;
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    // Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
    // This work is free. You can redistribute it and/or modify it
    // under the terms of the WTFPL, Version 2
    // For more information see LICENSE.txt or http://www.wtfpl.net/
    //
    // For more information, the home page:
    // http://pieroxy.net/blog/pages/lz-string/testing.html
    //
    // LZ-based compression algorithm, version 1.4.4
    var _LZString = (function () {
        // private property
        var f = String.fromCharCode;
        var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
        var baseReverseDic = {};
        function getBaseValue(alphabet, character) {
            if (!baseReverseDic[alphabet]) {
                baseReverseDic[alphabet] = {};
                for (var i = 0; i < alphabet.length; i++) {
                    baseReverseDic[alphabet][alphabet.charAt(i)] = i;
                }
            }
            return baseReverseDic[alphabet][character];
        }
        var _LZString = {
            compressToBase64: function (input) {
                if (input == null)
                    return "";
                var res = _LZString._compress(input, 6, function (a) { return keyStrBase64.charAt(a); });
                switch (res.length % 4) {
                    default: // When could this happen ?
                    case 0: return res;
                    case 1: return res + "===";
                    case 2: return res + "==";
                    case 3: return res + "=";
                }
            },
            decompressFromBase64: function (input) {
                if (input == null)
                    return "";
                if (input == "")
                    return null;
                return _LZString._decompress(input.length, 32, function (index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
            },
            compressToUTF16: function (input) {
                if (input == null)
                    return "";
                return _LZString._compress(input, 15, function (a) { return f(a + 32); }) + " ";
            },
            decompressFromUTF16: function (compressed) {
                if (compressed == null)
                    return "";
                if (compressed == "")
                    return null;
                return _LZString._decompress(compressed.length, 16384, function (index) { return compressed.charCodeAt(index) - 32; });
            },
            //compress into uint8array (UCS-2 big endian format)
            compressToUint8Array: function (uncompressed) {
                var compressed = _LZString.compress(uncompressed);
                var buf = new Uint8Array(compressed.length * 2); // 2 bytes per character
                for (var i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
                    var current_value = compressed.charCodeAt(i);
                    buf[i * 2] = current_value >>> 8;
                    buf[i * 2 + 1] = current_value % 256;
                }
                return buf;
            },
            //decompress from uint8array (UCS-2 big endian format)
            decompressFromUint8Array: function (compressed) {
                if (compressed === null || compressed === undefined) {
                    return _LZString.decompress(compressed);
                }
                else {
                    var buf = new Array(compressed.length / 2); // 2 bytes per character
                    for (var i = 0, TotalLen = buf.length; i < TotalLen; i++) {
                        buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
                    }
                    var result = [];
                    buf.forEach(function (c) {
                        result.push(f(c));
                    });
                    return _LZString.decompress(result.join(''));
                }
            },
            //compress into a string that is already URI encoded
            compressToEncodedURIComponent: function (input) {
                if (input == null)
                    return "";
                return _LZString._compress(input, 6, function (a) { return keyStrUriSafe.charAt(a); });
            },
            //decompress from an output of compressToEncodedURIComponent
            decompressFromEncodedURIComponent: function (input) {
                if (input == null)
                    return "";
                if (input == "")
                    return null;
                input = input.replace(/ /g, "+");
                return _LZString._decompress(input.length, 32, function (index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
            },
            compress: function (uncompressed) {
                return _LZString._compress(uncompressed, 16, function (a) { return f(a); });
            },
            _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
                if (uncompressed == null)
                    return "";
                var i, value, context_dictionary = {}, context_dictionaryToCreate = {}, context_c = "", context_wc = "", context_w = "", context_enlargeIn = 2, // Compensate for the first entry which should not count
                context_dictSize = 3, context_numBits = 2, context_data = [], context_data_val = 0, context_data_position = 0, ii;
                for (ii = 0; ii < uncompressed.length; ii += 1) {
                    context_c = uncompressed.charAt(ii);
                    if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                        context_dictionary[context_c] = context_dictSize++;
                        context_dictionaryToCreate[context_c] = true;
                    }
                    context_wc = context_w + context_c;
                    if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                        context_w = context_wc;
                    }
                    else {
                        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                            if (context_w.charCodeAt(0) < 256) {
                                for (i = 0; i < context_numBits; i++) {
                                    context_data_val = (context_data_val << 1);
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    }
                                    else {
                                        context_data_position++;
                                    }
                                }
                                value = context_w.charCodeAt(0);
                                for (i = 0; i < 8; i++) {
                                    context_data_val = (context_data_val << 1) | (value & 1);
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    }
                                    else {
                                        context_data_position++;
                                    }
                                    value = value >> 1;
                                }
                            }
                            else {
                                value = 1;
                                for (i = 0; i < context_numBits; i++) {
                                    context_data_val = (context_data_val << 1) | value;
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    }
                                    else {
                                        context_data_position++;
                                    }
                                    value = 0;
                                }
                                value = context_w.charCodeAt(0);
                                for (i = 0; i < 16; i++) {
                                    context_data_val = (context_data_val << 1) | (value & 1);
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    }
                                    else {
                                        context_data_position++;
                                    }
                                    value = value >> 1;
                                }
                            }
                            context_enlargeIn--;
                            if (context_enlargeIn == 0) {
                                context_enlargeIn = Math.pow(2, context_numBits);
                                context_numBits++;
                            }
                            delete context_dictionaryToCreate[context_w];
                        }
                        else {
                            value = context_dictionary[context_w];
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0) {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                        // Add wc to the dictionary.
                        context_dictionary[context_wc] = context_dictSize++;
                        context_w = String(context_c);
                    }
                }
                // Output the code for w.
                if (context_w !== "") {
                    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                        if (context_w.charCodeAt(0) < 256) {
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 8; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        else {
                            value = 1;
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1) | value;
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                                value = 0;
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 16; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0) {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                        delete context_dictionaryToCreate[context_w];
                    }
                    else {
                        value = context_dictionary[context_w];
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                }
                // Mark the end of the stream
                value = 2;
                for (i = 0; i < context_numBits; i++) {
                    context_data_val = (context_data_val << 1) | (value & 1);
                    if (context_data_position == bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                    }
                    else {
                        context_data_position++;
                    }
                    value = value >> 1;
                }
                // Flush the last char
                while (true) {
                    context_data_val = (context_data_val << 1);
                    if (context_data_position == bitsPerChar - 1) {
                        context_data.push(getCharFromInt(context_data_val));
                        break;
                    }
                    else
                        context_data_position++;
                }
                return context_data.join('');
            },
            decompress: function (compressed) {
                if (compressed == null)
                    return "";
                if (compressed == "")
                    return null;
                return _LZString._decompress(compressed.length, 32768, function (index) { return compressed.charCodeAt(index); });
            },
            _decompress: function (length, resetValue, getNextValue) {
                var dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [], i, w, bits, resb, maxpower, power, c, data = { val: getNextValue(0), position: resetValue, index: 1 };
                for (i = 0; i < 3; i += 1) {
                    dictionary[i] = i;
                }
                bits = 0;
                maxpower = Math.pow(2, 2);
                power = 1;
                while (power != maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                switch (next = bits) {
                    case 0:
                        bits = 0;
                        maxpower = Math.pow(2, 8);
                        power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        c = f(bits);
                        break;
                    case 1:
                        bits = 0;
                        maxpower = Math.pow(2, 16);
                        power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        c = f(bits);
                        break;
                    case 2:
                        return "";
                }
                dictionary[3] = c;
                w = c;
                result.push(c);
                while (true) {
                    if (data.index > length) {
                        return "";
                    }
                    bits = 0;
                    maxpower = Math.pow(2, numBits);
                    power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    switch (c = bits) {
                        case 0:
                            bits = 0;
                            maxpower = Math.pow(2, 8);
                            power = 1;
                            while (power != maxpower) {
                                resb = data.val & data.position;
                                data.position >>= 1;
                                if (data.position == 0) {
                                    data.position = resetValue;
                                    data.val = getNextValue(data.index++);
                                }
                                bits |= (resb > 0 ? 1 : 0) * power;
                                power <<= 1;
                            }
                            dictionary[dictSize++] = f(bits);
                            c = dictSize - 1;
                            enlargeIn--;
                            break;
                        case 1:
                            bits = 0;
                            maxpower = Math.pow(2, 16);
                            power = 1;
                            while (power != maxpower) {
                                resb = data.val & data.position;
                                data.position >>= 1;
                                if (data.position == 0) {
                                    data.position = resetValue;
                                    data.val = getNextValue(data.index++);
                                }
                                bits |= (resb > 0 ? 1 : 0) * power;
                                power <<= 1;
                            }
                            dictionary[dictSize++] = f(bits);
                            c = dictSize - 1;
                            enlargeIn--;
                            break;
                        case 2:
                            return result.join('');
                    }
                    if (enlargeIn == 0) {
                        enlargeIn = Math.pow(2, numBits);
                        numBits++;
                    }
                    if (dictionary[c]) {
                        entry = dictionary[c];
                    }
                    else {
                        if (c === dictSize) {
                            entry = w + w.charAt(0);
                        }
                        else {
                            return null;
                        }
                    }
                    result.push(entry);
                    // Add w+entry[0] to the dictionary.
                    dictionary[dictSize++] = w + entry.charAt(0);
                    enlargeIn--;
                    w = entry;
                    if (enlargeIn == 0) {
                        enlargeIn = Math.pow(2, numBits);
                        numBits++;
                    }
                }
            }
        };
        return _LZString;
    })();
    var LZString = (function () {
        function LZString() {
        }
        return LZString;
    }());
    LZString.compressToBase64 = _LZString.compressToBase64;
    LZString.decompressFromBase64 = _LZString.decompressFromBase64;
    LZString.compressToUTF16 = _LZString.compressToUTF16;
    LZString.decompressFromUTF16 = _LZString.decompressFromUTF16;
    LZString.compressToUint8Array = _LZString.compressToUint8Array;
    LZString.decompressFromUint8Array = _LZString.decompressFromUint8Array;
    LZString.compressToEncodedURIComponent = _LZString.compressToEncodedURIComponent;
    LZString.decompressFromEncodedURIComponent = _LZString.decompressFromEncodedURIComponent;
    LZString.compress = _LZString.compress;
    LZString.decompress = _LZString.decompress;
    Facepunch.LZString = LZString;
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var Vector2 = (function () {
        function Vector2(x, y) {
            this.x = x || 0;
            this.y = y || 0;
        }
        Vector2.prototype.length = function () {
            var x = this.x, y = this.y;
            return Math.sqrt(x * x + y * y);
        };
        Vector2.prototype.lengthSq = function () {
            var x = this.x, y = this.y;
            return x * x + y * y;
        };
        Vector2.prototype.set = function (x, y) {
            this.x = x;
            this.y = y;
            return this;
        };
        Vector2.prototype.add = function (vecOrX, y) {
            if (typeof vecOrX !== "number") {
                this.x += vecOrX.x;
                this.y += vecOrX.y;
            }
            else {
                this.x += vecOrX;
                this.y += y;
            }
            return this;
        };
        Vector2.prototype.sub = function (vecOrX, y) {
            if (typeof vecOrX !== "number") {
                this.x -= vecOrX.x;
                this.y -= vecOrX.y;
            }
            else {
                this.x -= vecOrX;
                this.y -= y;
            }
            return this;
        };
        Vector2.prototype.multiplyScalar = function (val) {
            this.x *= val;
            this.y *= val;
            return this;
        };
        Vector2.prototype.copy = function (vec) {
            this.x = vec.x;
            this.y = vec.y;
            return this;
        };
        return Vector2;
    }());
    Facepunch.Vector2 = Vector2;
    var Vector3 = (function () {
        function Vector3(x, y, z) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
        }
        Vector3.prototype.length = function () {
            var x = this.x, y = this.y, z = this.z;
            return Math.sqrt(x * x + y * y + z * z);
        };
        Vector3.prototype.lengthSq = function () {
            var x = this.x, y = this.y, z = this.z;
            return x * x + y * y + z * z;
        };
        Vector3.prototype.normalize = function () {
            var length = this.length();
            this.x /= length;
            this.y /= length;
            this.z /= length;
            return this;
        };
        Vector3.prototype.set = function (x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        };
        Vector3.prototype.add = function (vecOrX, y, z) {
            if (typeof vecOrX !== "number") {
                this.x += vecOrX.x;
                this.y += vecOrX.y;
                this.z += vecOrX.z;
            }
            else {
                this.x += vecOrX;
                this.y += y;
                this.z += z;
            }
            return this;
        };
        Vector3.prototype.sub = function (vecOrX, y, z) {
            if (typeof vecOrX !== "number") {
                this.x -= vecOrX.x;
                this.y -= vecOrX.y;
                this.z -= vecOrX.z;
            }
            else {
                this.x -= vecOrX;
                this.y -= y;
                this.z -= z;
            }
            return this;
        };
        Vector3.prototype.multiply = function (vecOrX, y, z) {
            if (typeof vecOrX !== "number") {
                this.x *= vecOrX.x;
                this.y *= vecOrX.y;
                this.z *= vecOrX.z;
            }
            else {
                this.x *= vecOrX;
                this.y *= y;
                this.z *= z;
            }
            return this;
        };
        Vector3.prototype.cross = function (vec) {
            var x = this.x;
            var y = this.y;
            var z = this.z;
            this.x = y * vec.z - z * vec.y;
            this.y = z * vec.x - x * vec.z;
            this.z = x * vec.y - y * vec.x;
            return this;
        };
        Vector3.prototype.divide = function (vec) {
            this.x /= vec.x;
            this.y /= vec.y;
            this.z /= vec.z;
            return this;
        };
        Vector3.prototype.multiplyScalar = function (val) {
            this.x *= val;
            this.y *= val;
            this.z *= val;
            return this;
        };
        Vector3.prototype.dot = function (vec) {
            return this.x * vec.x + this.y * vec.y + this.z * vec.z;
        };
        Vector3.prototype.copy = function (vec) {
            this.x = vec.x;
            this.y = vec.y;
            this.z = vec.z;
            return this;
        };
        Vector3.prototype.applyQuaternion = function (quat) {
            // From https://github.com/mrdoob/three.js
            var x = this.x, y = this.y, z = this.z;
            var qx = quat.x, qy = quat.y, qz = quat.z, qw = quat.w;
            // calculate quat * vector
            var ix = qw * x + qy * z - qz * y;
            var iy = qw * y + qz * x - qx * z;
            var iz = qw * z + qx * y - qy * x;
            var iw = -qx * x - qy * y - qz * z;
            // calculate result * inverse quat
            this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
            return this;
        };
        Vector3.prototype.setNormal = function (vec) {
            var x = vec.x, y = vec.y, z = vec.z;
            var invLen = 1 / Math.sqrt(x * x + y * y + z * z);
            this.x = x * invLen;
            this.y = y * invLen;
            this.z = z * invLen;
            return this;
        };
        return Vector3;
    }());
    Vector3.zero = new Vector3(0, 0, 0);
    Vector3.one = new Vector3(1, 1, 1);
    Vector3.unitX = new Vector3(1, 0, 0);
    Vector3.unitY = new Vector3(0, 1, 0);
    Vector3.unitZ = new Vector3(0, 0, 1);
    Facepunch.Vector3 = Vector3;
    var Vector4 = (function () {
        function Vector4(x, y, z, w) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            this.w = w || 0;
        }
        Vector4.prototype.length = function () {
            var x = this.x, y = this.y, z = this.z, w = this.w;
            return Math.sqrt(x * x + y * y + z * z + w * w);
        };
        Vector4.prototype.lengthSq = function () {
            var x = this.x, y = this.y, z = this.z, w = this.w;
            return x * x + y * y + z * z + w * w;
        };
        Vector4.prototype.lengthXyz = function () {
            var x = this.x, y = this.y, z = this.z;
            return Math.sqrt(x * x + y * y + z * z);
        };
        Vector4.prototype.lengthSqXyz = function () {
            var x = this.x, y = this.y, z = this.z;
            return x * x + y * y + z * z;
        };
        Vector4.prototype.normalize = function () {
            var length = this.length();
            this.x /= length;
            this.y /= length;
            this.z /= length;
            this.w /= length;
            return this;
        };
        Vector4.prototype.normalizeXyz = function () {
            var length = this.lengthXyz();
            this.x /= length;
            this.y /= length;
            this.z /= length;
            return this;
        };
        Vector4.prototype.set = function (x, y, z, w) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        };
        Vector4.prototype.multiplyScalar = function (val) {
            this.x *= val;
            this.y *= val;
            this.z *= val;
            this.w *= val;
            return this;
        };
        Vector4.prototype.applyQuaternion = function (quat) {
            // From https://github.com/mrdoob/three.js
            var x = this.x, y = this.y, z = this.z;
            var qx = quat.x, qy = quat.y, qz = quat.z, qw = quat.w;
            // calculate quat * vector
            var ix = qw * x + qy * z - qz * y;
            var iy = qw * y + qz * x - qx * z;
            var iz = qw * z + qx * y - qy * x;
            var iw = -qx * x - qy * y - qz * z;
            // calculate result * inverse quat
            this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
            return this;
        };
        Vector4.prototype.applyMatrix4 = function (mat) {
            var x = this.x, y = this.y, z = this.z, w = this.w;
            var m = mat.elements;
            this.x = m[0x0] * x + m[0x4] * y + m[0x8] * z + m[0xc] * w;
            this.y = m[0x1] * x + m[0x5] * y + m[0x9] * z + m[0xd] * w;
            this.z = m[0x2] * x + m[0x6] * y + m[0xa] * z + m[0xe] * w;
            this.w = m[0x3] * x + m[0x7] * y + m[0xb] * z + m[0xf] * w;
            return this;
        };
        return Vector4;
    }());
    Facepunch.Vector4 = Vector4;
    var Quaternion = (function () {
        function Quaternion(x, y, z, w) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            this.w = w || 0;
        }
        Quaternion.prototype.copy = function (quat) {
            this.x = quat.x;
            this.y = quat.y;
            this.z = quat.z;
            this.w = quat.w;
            return this;
        };
        Quaternion.prototype.setIdentity = function () {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;
            return this;
        };
        Quaternion.prototype.setInverse = function (quat) {
            if (quat === undefined)
                quat = this;
            this.x = -quat.x;
            this.y = -quat.y;
            this.z = -quat.z;
            this.w = quat.w;
            return this.setNormalized();
        };
        Quaternion.prototype.setNormalized = function (quat) {
            if (quat === undefined)
                quat = this;
            var len = Math.sqrt(quat.x * quat.x + quat.y * quat.y +
                quat.z * quat.z + quat.w * quat.w);
            if (len === 0) {
                this.x = this.y = this.z = 0;
                this.w = 1;
            }
            else {
                var invLen = 1 / len;
                this.x = quat.x * invLen;
                this.y = quat.y * invLen;
                this.z = quat.z * invLen;
                this.w = quat.w * invLen;
            }
            return this;
        };
        Quaternion.prototype.setLookAlong = function (normal) {
            var r = normal.y + 1;
            var temp = Quaternion.setLookAlong_temp;
            // TODO: check for small r?
            temp.set(0, 1, 0).cross(normal);
            this.x = temp.x;
            this.y = temp.y;
            this.z = temp.z;
            this.w = r;
            return this.setNormalized();
        };
        Quaternion.prototype.setAxisAngle = function (axis, angle) {
            // From https://github.com/mrdoob/three.js
            var halfAngle = angle * 0.5, s = Math.sin(halfAngle);
            this.x = axis.x * s;
            this.y = axis.y * s;
            this.z = axis.z * s;
            this.w = Math.cos(halfAngle);
            return this;
        };
        Quaternion.prototype.multiply = function (quat) {
            // From https://github.com/mrdoob/three.js
            var qax = this.x, qay = this.y, qaz = this.z, qaw = this.w;
            var qbx = quat.x, qby = quat.y, qbz = quat.z, qbw = quat.w;
            this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
            this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
            this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
            this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
            return this;
        };
        Quaternion.prototype.setEuler = function (euler) {
            // From https://github.com/mrdoob/three.js
            var x = euler.x;
            var y = euler.y;
            var z = euler.z;
            var order = euler.order;
            var cos = Math.cos;
            var sin = Math.sin;
            var c1 = cos(x * 0.5);
            var c2 = cos(y * 0.5);
            var c3 = cos(z * 0.5);
            var s1 = sin(x * 0.5);
            var s2 = sin(y * 0.5);
            var s3 = sin(z * 0.5);
            this.x = s1 * c2 * c3 + c1 * s2 * s3 * ((order & 1) !== 0 ? 1 : -1);
            this.y = c1 * s2 * c3 + s1 * c2 * s3 * ((order & 2) !== 0 ? 1 : -1);
            this.z = c1 * c2 * s3 + s1 * s2 * c3 * ((order & 4) !== 0 ? 1 : -1);
            this.w = c1 * c2 * c3 + s1 * s2 * s3 * ((order & 8) !== 0 ? 1 : -1);
            return this;
        };
        return Quaternion;
    }());
    Quaternion.setLookAlong_temp = new Facepunch.Vector3();
    Facepunch.Quaternion = Quaternion;
    var AxisOrder;
    (function (AxisOrder) {
        AxisOrder[AxisOrder["Xyz"] = 5] = "Xyz";
        AxisOrder[AxisOrder["Xzy"] = 12] = "Xzy";
        AxisOrder[AxisOrder["Yxz"] = 9] = "Yxz";
        AxisOrder[AxisOrder["Yzx"] = 3] = "Yzx";
        AxisOrder[AxisOrder["Zxy"] = 6] = "Zxy";
        AxisOrder[AxisOrder["Zyx"] = 10] = "Zyx"; // 0101
    })(AxisOrder = Facepunch.AxisOrder || (Facepunch.AxisOrder = {}));
    var Euler = (function () {
        function Euler(x, y, z, order) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            this.order = order || AxisOrder.Xyz;
        }
        return Euler;
    }());
    Facepunch.Euler = Euler;
    var Plane = (function () {
        function Plane(normal, distance) {
            this.normal = new Vector3();
            this.normal.setNormal(normal);
            this.distance = distance;
        }
        return Plane;
    }());
    Facepunch.Plane = Plane;
    var Box3 = (function () {
        function Box3(min, max) {
            this.min = new Vector3();
            this.max = new Vector3();
            if (min !== undefined)
                this.min.copy(min);
            if (max !== undefined)
                this.max.copy(max);
        }
        Box3.prototype.copy = function (box) {
            this.min.copy(box.min);
            this.max.copy(box.max);
            return this;
        };
        Box3.prototype.clampLineSegment = function (a, b) {
            var difX = b.x - a.x;
            var difY = b.y - a.y;
            var difZ = b.z - a.z;
            var invX = 1 / difX;
            var invY = 1 / difY;
            var invZ = 1 / difZ;
            var tx0 = (this.min.x - a.x) * invX;
            var tx1 = (this.max.x - a.x) * invX;
            var ty0 = (this.min.y - a.y) * invY;
            var ty1 = (this.max.y - a.y) * invY;
            var tz0 = (this.min.z - a.z) * invZ;
            var tz1 = (this.max.z - a.z) * invZ;
            var tMin = Math.max(Math.min(tx0, tx1), Math.min(ty0, ty1), Math.min(tz0, tz1));
            var tMax = Math.min(Math.max(tx0, tx1), Math.max(ty0, ty1), Math.max(tz0, tz1));
            a.x += tMin * difX;
            a.y += tMin * difY;
            a.z += tMin * difZ;
            b.x += (tMax - 1) * difX;
            b.y += (tMax - 1) * difY;
            b.z += (tMax - 1) * difZ;
            return tMax >= tMin;
        };
        Box3.prototype.distanceToPoint = function (vec) {
            var minX = Math.max(0, this.min.x - vec.x, vec.x - this.max.x);
            var minY = Math.max(0, this.min.y - vec.y, vec.y - this.max.y);
            var minZ = Math.max(0, this.min.z - vec.z, vec.z - this.max.z);
            return Math.sqrt(minX * minX + minY * minY + minZ * minZ);
        };
        Box3.prototype.addPoint = function (vec) {
            var min = this.min;
            var max = this.max;
            if (vec.x < min.x)
                min.x = vec.x;
            if (vec.x > max.x)
                max.x = vec.x;
            if (vec.y < min.y)
                min.y = vec.y;
            if (vec.y > max.y)
                max.y = vec.y;
            if (vec.z < min.z)
                min.z = vec.z;
            if (vec.z > max.z)
                max.z = vec.z;
        };
        return Box3;
    }());
    Facepunch.Box3 = Box3;
    var Matrix4 = (function () {
        function Matrix4() {
            this.id = Matrix4.nextId++;
            this.elements = new Float32Array(4 * 4);
        }
        Matrix4.prototype.setIdentity = function () {
            var m = this.elements;
            m[0x0] = 1;
            m[0x1] = 0;
            m[0x2] = 0;
            m[0x3] = 0;
            m[0x4] = 0;
            m[0x5] = 1;
            m[0x6] = 0;
            m[0x7] = 0;
            m[0x8] = 0;
            m[0x9] = 0;
            m[0xa] = 1;
            m[0xb] = 0;
            m[0xc] = 0;
            m[0xd] = 0;
            m[0xe] = 0;
            m[0xf] = 1;
            return this;
        };
        Matrix4.prototype.compareTo = function (other) {
            var m = this.elements;
            var n = other.elements;
            for (var i = 0xf; i >= 0; --i) {
                if (m[i] !== n[i])
                    return m[i] - n[i];
            }
            return 0;
        };
        Matrix4.prototype.copy = function (mat) {
            var m = this.elements;
            var n = mat.elements;
            for (var i = 0; i < 16; ++i)
                m[i] = n[i];
            return this;
        };
        Matrix4.prototype.setRotation = function (rotation) {
            var m = this.elements;
            // From https://github.com/mrdoob/three.js
            var x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w;
            var x2 = x + x, y2 = y + y, z2 = z + z;
            var xx = x * x2, xy = x * y2, xz = x * z2;
            var yy = y * y2, yz = y * z2, zz = z * z2;
            var wx = w * x2, wy = w * y2, wz = w * z2;
            m[0] = 1 - (yy + zz);
            m[4] = xy - wz;
            m[8] = xz + wy;
            m[1] = xy + wz;
            m[5] = 1 - (xx + zz);
            m[9] = yz - wx;
            m[2] = xz - wy;
            m[6] = yz + wx;
            m[10] = 1 - (xx + yy);
            m[3] = 0;
            m[7] = 0;
            m[11] = 0;
            m[12] = 0;
            m[13] = 0;
            m[14] = 0;
            m[15] = 1;
            return this;
        };
        Matrix4.prototype.scale = function (vec) {
            var m = this.elements;
            var x = vec.x, y = vec.y, z = vec.z;
            m[0x0] *= x;
            m[0x1] *= x;
            m[0x2] *= x;
            m[0x3] *= x;
            m[0x4] *= y;
            m[0x5] *= y;
            m[0x6] *= y;
            m[0x7] *= y;
            m[0x8] *= z;
            m[0x9] *= z;
            m[0xa] *= z;
            m[0xb] *= z;
            return this;
        };
        Matrix4.prototype.translate = function (vec) {
            var m = this.elements;
            m[0xc] += vec.x;
            m[0xd] += vec.y;
            m[0xe] += vec.z;
            return this;
        };
        Matrix4.prototype.setPerspective = function (fov, aspect, near, far) {
            var top = near * Math.tan(0.5 * fov), height = 2 * top, width = aspect * height, left = -0.5 * width, right = left + width, bottom = -top;
            // From https://github.com/mrdoob/three.js
            var m = this.elements;
            var x = 2 * near / width;
            var y = 2 * near / height;
            var a = (right + left) / (right - left);
            var b = (top + bottom) / (top - bottom);
            var c = -(far + near) / (far - near);
            var d = -2 * far * near / (far - near);
            m[0x0] = x;
            m[0x4] = 0;
            m[0x8] = a;
            m[0xc] = 0;
            m[0x1] = 0;
            m[0x5] = y;
            m[0x9] = b;
            m[0xd] = 0;
            m[0x2] = 0;
            m[0x6] = 0;
            m[0xa] = c;
            m[0xe] = d;
            m[0x3] = 0;
            m[0x7] = 0;
            m[0xb] = -1;
            m[0xf] = 0;
            return this;
        };
        Matrix4.prototype.setOrthographic = function (size, aspect, near, far) {
            var width = size * aspect;
            var m = this.elements;
            var x = 2 / width;
            var y = 2 / size;
            var z = 2 / (far - near);
            var a = (far + near) * z * -0.5;
            m[0x0] = x;
            m[0x4] = 0;
            m[0x8] = 0;
            m[0xc] = 0;
            m[0x1] = 0;
            m[0x5] = y;
            m[0x9] = 0;
            m[0xd] = 0;
            m[0x2] = 0;
            m[0x6] = 0;
            m[0xa] = z;
            m[0xe] = a;
            m[0x3] = 0;
            m[0x7] = 0;
            m[0xb] = 0;
            m[0xf] = 1;
            return this;
        };
        Matrix4.prototype.setInverse = function (from) {
            var m = from.elements;
            var inv = this.elements;
            // From http://stackoverflow.com/a/1148405
            inv[0] = m[5] * m[10] * m[15] -
                m[5] * m[11] * m[14] -
                m[9] * m[6] * m[15] +
                m[9] * m[7] * m[14] +
                m[13] * m[6] * m[11] -
                m[13] * m[7] * m[10];
            inv[4] = -m[4] * m[10] * m[15] +
                m[4] * m[11] * m[14] +
                m[8] * m[6] * m[15] -
                m[8] * m[7] * m[14] -
                m[12] * m[6] * m[11] +
                m[12] * m[7] * m[10];
            inv[8] = m[4] * m[9] * m[15] -
                m[4] * m[11] * m[13] -
                m[8] * m[5] * m[15] +
                m[8] * m[7] * m[13] +
                m[12] * m[5] * m[11] -
                m[12] * m[7] * m[9];
            inv[12] = -m[4] * m[9] * m[14] +
                m[4] * m[10] * m[13] +
                m[8] * m[5] * m[14] -
                m[8] * m[6] * m[13] -
                m[12] * m[5] * m[10] +
                m[12] * m[6] * m[9];
            inv[1] = -m[1] * m[10] * m[15] +
                m[1] * m[11] * m[14] +
                m[9] * m[2] * m[15] -
                m[9] * m[3] * m[14] -
                m[13] * m[2] * m[11] +
                m[13] * m[3] * m[10];
            inv[5] = m[0] * m[10] * m[15] -
                m[0] * m[11] * m[14] -
                m[8] * m[2] * m[15] +
                m[8] * m[3] * m[14] +
                m[12] * m[2] * m[11] -
                m[12] * m[3] * m[10];
            inv[9] = -m[0] * m[9] * m[15] +
                m[0] * m[11] * m[13] +
                m[8] * m[1] * m[15] -
                m[8] * m[3] * m[13] -
                m[12] * m[1] * m[11] +
                m[12] * m[3] * m[9];
            inv[13] = m[0] * m[9] * m[14] -
                m[0] * m[10] * m[13] -
                m[8] * m[1] * m[14] +
                m[8] * m[2] * m[13] +
                m[12] * m[1] * m[10] -
                m[12] * m[2] * m[9];
            inv[2] = m[1] * m[6] * m[15] -
                m[1] * m[7] * m[14] -
                m[5] * m[2] * m[15] +
                m[5] * m[3] * m[14] +
                m[13] * m[2] * m[7] -
                m[13] * m[3] * m[6];
            inv[6] = -m[0] * m[6] * m[15] +
                m[0] * m[7] * m[14] +
                m[4] * m[2] * m[15] -
                m[4] * m[3] * m[14] -
                m[12] * m[2] * m[7] +
                m[12] * m[3] * m[6];
            inv[10] = m[0] * m[5] * m[15] -
                m[0] * m[7] * m[13] -
                m[4] * m[1] * m[15] +
                m[4] * m[3] * m[13] +
                m[12] * m[1] * m[7] -
                m[12] * m[3] * m[5];
            inv[14] = -m[0] * m[5] * m[14] +
                m[0] * m[6] * m[13] +
                m[4] * m[1] * m[14] -
                m[4] * m[2] * m[13] -
                m[12] * m[1] * m[6] +
                m[12] * m[2] * m[5];
            inv[3] = -m[1] * m[6] * m[11] +
                m[1] * m[7] * m[10] +
                m[5] * m[2] * m[11] -
                m[5] * m[3] * m[10] -
                m[9] * m[2] * m[7] +
                m[9] * m[3] * m[6];
            inv[7] = m[0] * m[6] * m[11] -
                m[0] * m[7] * m[10] -
                m[4] * m[2] * m[11] +
                m[4] * m[3] * m[10] +
                m[8] * m[2] * m[7] -
                m[8] * m[3] * m[6];
            inv[11] = -m[0] * m[5] * m[11] +
                m[0] * m[7] * m[9] +
                m[4] * m[1] * m[11] -
                m[4] * m[3] * m[9] -
                m[8] * m[1] * m[7] +
                m[8] * m[3] * m[5];
            inv[15] = m[0] * m[5] * m[10] -
                m[0] * m[6] * m[9] -
                m[4] * m[1] * m[10] +
                m[4] * m[2] * m[9] +
                m[8] * m[1] * m[6] -
                m[8] * m[2] * m[5];
            var det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
            if (det === 0)
                throw new Error("Matrix is not invertible.");
            det = 1.0 / det;
            for (var i = 0; i < 16; ++i)
                inv[i] *= det;
            return this;
        };
        return Matrix4;
    }());
    Matrix4.nextId = 1;
    Facepunch.Matrix4 = Matrix4;
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var Http = (function () {
        function Http() {
        }
        Http.getString = function (url, success, failure, progress) {
            var request = new XMLHttpRequest();
            request.addEventListener("load", function (ev) { return success(request.responseText); });
            if (failure != null) {
                request.addEventListener("error", function (ev) { return failure(ev.error); });
                request.addEventListener("abort", function (ev) { return failure(Http.cancelled); });
            }
            if (progress != null) {
                request.onprogress = function (ev) { return ev.lengthComputable
                    ? progress(ev.loaded, ev.total) : progress(0, undefined); };
            }
            request.open("get", url, true);
            request.send();
        };
        Http.getJson = function (url, success, failure, progress) {
            Http.getString(url, function (text) { return success(JSON.parse(text)); }, failure, progress);
        };
        Http.getImage = function (url, success, failure, progress) {
            var image = new Image();
            image.src = url;
            image.addEventListener("load", function (ev) { return success(image); });
            if (failure != null) {
                image.addEventListener("error", function (ev) { return failure(ev.error); });
                image.addEventListener("abort", function (ev) { return failure(Http.cancelled); });
            }
            if (progress != null) {
                image.onprogress = function (ev) { return ev.lengthComputable
                    ? progress(ev.loaded, ev.total) : progress(0, undefined); };
            }
        };
        Http.isAbsUrl = function (url) {
            return url != null && /^(http[s]:\/)?\//i.test(url);
        };
        Http.getAbsUrl = function (url, relativeTo) {
            if (Http.isAbsUrl(url))
                return url;
            if (!Http.isAbsUrl(relativeTo)) {
                relativeTo = window.location.pathname;
            }
            if (relativeTo.charAt(relativeTo.length - 1) === "/") {
                return "" + relativeTo + url;
            }
            var lastSep = relativeTo.lastIndexOf("/");
            var prefix = relativeTo.substr(0, lastSep + 1);
            return "" + prefix + url;
        };
        return Http;
    }());
    Http.cancelled = { toString: function () { return "Request cancelled by user."; } };
    Facepunch.Http = Http;
    var Utils = (function () {
        function Utils() {
        }
        Utils.decompress = function (value) {
            if (value == null)
                return null;
            return typeof value === "string"
                ? JSON.parse(Facepunch.LZString.decompressFromBase64(value))
                : value;
        };
        Utils.decompressOrClone = function (value) {
            if (value == null)
                return null;
            return typeof value === "string"
                ? JSON.parse(Facepunch.LZString.decompressFromBase64(value))
                : value.slice(0);
        };
        return Utils;
    }());
    Facepunch.Utils = Utils;
    var WebGl = (function () {
        function WebGl() {
        }
        WebGl.decodeConst = function (valueOrIdent, defaultValue) {
            if (valueOrIdent === undefined)
                return defaultValue;
            return (typeof valueOrIdent === "number" ? valueOrIdent : WebGLRenderingContext[valueOrIdent]);
        };
        WebGl.encodeConst = function (value) {
            if (WebGl.constDict == null) {
                WebGl.constDict = {};
                for (var name_1 in WebGLRenderingContext) {
                    var val = WebGLRenderingContext[name_1];
                    if (typeof val !== "number")
                        continue;
                    WebGl.constDict[val] = name_1;
                }
            }
            return WebGl.constDict[value];
        };
        return WebGl;
    }());
    Facepunch.WebGl = WebGl;
})(Facepunch || (Facepunch = {}));
/// <reference path="../Math.ts"/>
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Entity = (function () {
            function Entity() {
                this.id = Entity.nextId++;
                this.position = new Facepunch.Vector3();
                this.rotation = new Facepunch.Quaternion().setIdentity();
                this.scale = new Facepunch.Vector3(1, 1, 1);
                this.matrix = new Facepunch.Matrix4();
                this.matrixInvalid = true;
                this.inverseMatrix = new Facepunch.Matrix4();
                this.inverseMatrixInvalid = true;
            }
            Entity.prototype.compareTo = function (other) {
                if (other == null)
                    return 1;
                return this.id - other.id;
            };
            Entity.prototype.invalidateMatrices = function () {
                this.matrixInvalid = true;
                this.inverseMatrixInvalid = true;
            };
            Entity.prototype.onChangePosition = function () {
                this.invalidateMatrices();
            };
            Entity.prototype.onChangeRotation = function () {
                this.invalidateMatrices();
            };
            Entity.prototype.onChangeScale = function () {
                this.invalidateMatrices();
            };
            Entity.prototype.getMatrix = function (target) {
                if (this.matrixInvalid) {
                    this.matrixInvalid = false;
                    this.matrix.setRotation(this.rotation);
                    this.matrix.scale(this.scale);
                    this.matrix.translate(this.position);
                }
                if (target != null) {
                    return target.copy(this.matrix);
                }
                return this.matrix;
            };
            Entity.prototype.getInverseMatrix = function (target) {
                if (this.inverseMatrixInvalid) {
                    this.inverseMatrixInvalid = false;
                    this.getMatrix();
                    this.inverseMatrix.setInverse(this.matrix);
                }
                if (target != null) {
                    return target.copy(this.inverseMatrix);
                }
                return this.inverseMatrix;
            };
            Entity.prototype.setPosition = function (valueOrX, y, z) {
                if (y !== undefined) {
                    var x = valueOrX;
                    this.position.set(x, y, z);
                }
                else {
                    var value = valueOrX;
                    this.position.set(value.x, value.y, value.z);
                }
                this.onChangePosition();
            };
            Entity.prototype.getPosition = function (target) {
                target.x = this.position.x;
                target.y = this.position.y;
                target.z = this.position.z;
                return target;
            };
            Entity.prototype.getPositionValues = function (target) {
                target[0] = this.position.x;
                target[1] = this.position.y;
                target[2] = this.position.z;
                return target;
            };
            Entity.prototype.getDistanceToBounds = function (bounds) {
                return bounds.distanceToPoint(this.position);
            };
            Entity.prototype.translate = function (valueOrX, y, z) {
                if (typeof valueOrX === "number") {
                    this.position.x += valueOrX;
                    this.position.y += y;
                    this.position.z += z;
                }
                else {
                    this.position.add(valueOrX);
                }
                this.onChangePosition();
            };
            Entity.prototype.easeTo = function (goal, delta) {
                this.position.x += (goal.x - this.position.x) * delta;
                this.position.y += (goal.y - this.position.y) * delta;
                this.position.z += (goal.z - this.position.z) * delta;
            };
            Entity.prototype.setRotation = function (value) {
                this.rotation.copy(value);
                this.onChangeRotation();
            };
            Entity.prototype.setAngles = function (valueOrPitch, yaw, roll) {
                var pitch;
                if (typeof valueOrPitch === "number") {
                    pitch = valueOrPitch;
                }
                else {
                    pitch = valueOrPitch.x;
                    yaw = valueOrPitch.y;
                    roll = valueOrPitch.z;
                }
                Entity.tempEuler.x = roll;
                Entity.tempEuler.y = pitch;
                Entity.tempEuler.z = yaw;
                this.rotation.setEuler(Entity.tempEuler);
            };
            Entity.prototype.copyRotation = function (other) {
                this.setRotation(other.rotation);
            };
            Entity.prototype.applyRotationTo = function (vector) {
                vector.applyQuaternion(this.rotation);
            };
            Entity.prototype.setScale = function (value) {
                if (typeof value === "number") {
                    this.scale.set(value, value, value);
                }
                else {
                    this.scale.set(value.x, value.y, value.z);
                }
                this.onChangeScale();
            };
            return Entity;
        }());
        Entity.nextId = 0;
        Entity.tempEuler = new Facepunch.Euler(0, 0, 0, Facepunch.AxisOrder.Zyx);
        WebGame.Entity = Entity;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var UniformType;
        (function (UniformType) {
            UniformType[UniformType["Float"] = 0] = "Float";
            UniformType[UniformType["Float2"] = 1] = "Float2";
            UniformType[UniformType["Float3"] = 2] = "Float3";
            UniformType[UniformType["Float4"] = 3] = "Float4";
            UniformType[UniformType["Matrix4"] = 4] = "Matrix4";
            UniformType[UniformType["Texture"] = 5] = "Texture";
        })(UniformType = WebGame.UniformType || (WebGame.UniformType = {}));
        var CommandBufferParameter = (function () {
            function CommandBufferParameter(type) {
                this.id = CommandBufferParameter.nextId++;
                this.type = type;
            }
            return CommandBufferParameter;
        }());
        CommandBufferParameter.nextId = 1;
        WebGame.CommandBufferParameter = CommandBufferParameter;
        var CommandBuffer = (function () {
            function CommandBuffer(context, immediate) {
                if (immediate === void 0) { immediate = false; }
                this.parameters = {};
                this.drawCalls = 0;
                this.tempSpareTime = 0;
                this.tempCurFrame = 0;
                this.context = context;
                this.immediate = !!immediate;
                this.clearCommands();
            }
            CommandBuffer.prototype.getCommandName = function (action) {
                for (var name_2 in this) {
                    if (this[name_2] === action)
                        return name_2;
                }
                return undefined;
            };
            CommandBuffer.prototype.logCommands = function () {
                var commands = [];
                for (var i = 0, iEnd = this.commands.length; i < iEnd; ++i) {
                    var command = this.commands[i];
                    var params = [];
                    for (var name_3 in command) {
                        var value = command[name_3];
                        if (typeof value === "function")
                            continue;
                        switch (name_3) {
                            case "target":
                            case "unit":
                            case "cap":
                            case "mode":
                            case "type":
                                value = "GL_" + Facepunch.WebGl.encodeConst(value);
                                break;
                            case "parameter":
                            case "parameters":
                                value = undefined;
                                break;
                        }
                        if (value !== undefined)
                            params.push(name_3 + ": " + value);
                    }
                    if (command.parameter !== undefined && this.parameters !== undefined) {
                        var value = this.parameters[command.parameter.id];
                        if (value === undefined) {
                            params.push("undefined");
                        }
                        else if (value.length !== undefined) {
                            params.push("[" + value + "]");
                        }
                        else {
                            params.push(value.toString());
                        }
                    }
                    var paramsJoined = params.join(", ");
                    commands.push(this.getCommandName(command.action) + "(" + paramsJoined + ");");
                }
                console.log(commands.join("\r\n"));
            };
            CommandBuffer.prototype.clearState = function () {
                this.boundTextures = {};
                this.boundBuffers = {};
                this.capStates = {};
                this.depthMaskState = undefined;
            };
            CommandBuffer.prototype.clearCommands = function () {
                this.clearState();
                this.commands = [];
                this.lastCommand = null;
                this.drawCalls = 0;
            };
            CommandBuffer.prototype.getDrawCalls = function () {
                return this.drawCalls;
            };
            CommandBuffer.prototype.setParameter = function (param, value) {
                this.parameters[param.id] = value;
            };
            CommandBuffer.prototype.getArrayParameter = function (param) {
                return this.parameters[param.id];
            };
            CommandBuffer.prototype.getTextureParameter = function (param) {
                return this.parameters[param.id];
            };
            CommandBuffer.prototype.run = function () {
                this.clearState();
                var gl = this.context;
                for (var i = 0, iEnd = this.commands.length; i < iEnd; ++i) {
                    var command = this.commands[i];
                    command.action(gl, command);
                }
                // TODO: temp animated texture solution
                var time = performance.now();
                if (this.tempLastRunTime !== undefined && (time - this.tempLastRunTime) < 1000.0) {
                    this.tempSpareTime += time - this.tempLastRunTime;
                    var frames_1 = Math.floor(this.tempSpareTime * 60.0 / 1000.0);
                    this.tempCurFrame += frames_1;
                    this.tempSpareTime -= frames_1 * 1000.0 / 60.0;
                }
                this.tempLastRunTime = time;
            };
            CommandBuffer.prototype.push = function (action, args) {
                if (this.immediate)
                    throw new Error("CommandBuffer.push was called in immediate mode!");
                else {
                    args.action = action;
                    this.commands.push(args);
                    this.lastCommand = args;
                }
            };
            CommandBuffer.prototype.clear = function (mask) {
                if (this.immediate)
                    this.context.clear(mask);
                else
                    this.push(this.onClear, { mask: mask });
            };
            CommandBuffer.prototype.onClear = function (gl, args) {
                gl.clear(args.mask);
            };
            CommandBuffer.prototype.dynamicMaterial = function (callback) {
                var _this = this;
                if (this.immediate) {
                    callback(this);
                    return;
                }
                var buf = this;
                this.push(function (gl, args) {
                    var wasImmediate = _this.immediate;
                    _this.immediate = true;
                    callback(buf);
                    _this.immediate = wasImmediate;
                }, {});
            };
            CommandBuffer.prototype.setCap = function (cap, enabled) {
                if (this.capStates[cap] === enabled)
                    return;
                this.capStates[cap] = enabled;
                if (this.immediate) {
                    if (enabled)
                        this.context.enable(cap);
                    else
                        this.context.disable(cap);
                }
                else
                    this.push(enabled ? this.onEnable : this.onDisable, { cap: cap });
            };
            CommandBuffer.prototype.enable = function (cap) {
                this.setCap(cap, true);
            };
            CommandBuffer.prototype.onEnable = function (gl, args) {
                gl.enable(args.cap);
            };
            CommandBuffer.prototype.disable = function (cap) {
                this.setCap(cap, false);
            };
            CommandBuffer.prototype.onDisable = function (gl, args) {
                gl.disable(args.cap);
            };
            CommandBuffer.prototype.depthMask = function (flag) {
                if (this.depthMaskState === flag)
                    return;
                this.depthMaskState = flag;
                if (this.immediate)
                    this.context.depthMask(flag);
                else
                    this.push(this.onDepthMask, { enabled: flag });
            };
            CommandBuffer.prototype.onDepthMask = function (gl, args) {
                gl.depthMask(args.enabled);
            };
            CommandBuffer.prototype.blendFuncSeparate = function (srcRgb, dstRgb, srcAlpha, dstAlpha) {
                if (this.immediate)
                    this.context.blendFuncSeparate(srcRgb, dstRgb, srcAlpha, dstAlpha);
                else
                    this.push(this.onBlendFuncSeparate, { x: srcRgb, y: dstRgb, z: srcAlpha, w: dstAlpha });
            };
            CommandBuffer.prototype.onBlendFuncSeparate = function (gl, args) {
                gl.blendFuncSeparate(args.x, args.y, args.z, args.w);
            };
            CommandBuffer.prototype.useProgram = function (program) {
                if (this.immediate)
                    this.context.useProgram(program == null ? null : program.getProgram());
                else
                    this.push(this.onUseProgram, { program: program });
            };
            CommandBuffer.prototype.onUseProgram = function (gl, args) {
                gl.useProgram(args.program == null ? null : args.program.getProgram());
            };
            CommandBuffer.prototype.setUniformParameter = function (uniform, parameter) {
                if (uniform == null)
                    return;
                var loc = uniform.getLocation();
                if (loc == null)
                    return;
                var unit;
                if (uniform.isSampler) {
                    var sampler = uniform;
                    unit = sampler.getTexUnit();
                    this.setUniform1I(uniform, unit);
                }
                if (this.immediate) {
                    this.setUniformParameterInternal(uniform, parameter, unit);
                    return;
                }
                this.push(this.onSetUniformParameter, { uniform: uniform, commandBuffer: this, parameter: parameter, unit: unit });
            };
            CommandBuffer.prototype.setUniformParameterInternal = function (uniform, param, unit) {
                var gl = this.context;
                var value = this.parameters[param.id];
                if (value == null)
                    return;
                switch (param.type) {
                    case UniformType.Matrix4:
                        gl.uniformMatrix4fv(uniform.getLocation(), false, value);
                        break;
                    case UniformType.Float:
                        gl.uniform1f(uniform.getLocation(), value[0]);
                        break;
                    case UniformType.Float2:
                        gl.uniform2f(uniform.getLocation(), value[0], value[1]);
                        break;
                    case UniformType.Float3:
                        gl.uniform3f(uniform.getLocation(), value[0], value[1], value[2]);
                        break;
                    case UniformType.Float4:
                        gl.uniform4f(uniform.getLocation(), value[0], value[1], value[2], value[3]);
                        break;
                    case UniformType.Texture:
                        var tex = value;
                        var sampler = uniform;
                        gl.activeTexture(gl.TEXTURE0 + unit);
                        gl.bindTexture(tex.getTarget(), tex.getHandle());
                        if (!sampler.hasSizeUniform())
                            break;
                        if (tex != null) {
                            var width = tex.getWidth(0);
                            var height = tex.getHeight(0);
                            gl.uniform4f(sampler.getSizeUniform().getLocation(), width, height, 1 / width, 1 / height);
                        }
                        else {
                            gl.uniform4f(sampler.getSizeUniform().getLocation(), 1, 1, 1, 1);
                        }
                        break;
                }
            };
            CommandBuffer.prototype.onSetUniformParameter = function (gl, args) {
                args.commandBuffer.setUniformParameterInternal(args.uniform, args.parameter, args.unit);
            };
            CommandBuffer.prototype.setUniform1F = function (uniform, x) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                if (this.immediate)
                    this.context.uniform1f(uniform.getLocation(), x);
                else
                    this.push(this.onSetUniform1F, { uniform: uniform, x: x });
            };
            CommandBuffer.prototype.onSetUniform1F = function (gl, args) {
                gl.uniform1f(args.uniform.getLocation(), args.x);
            };
            CommandBuffer.prototype.setUniform1I = function (uniform, x) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                if (this.immediate)
                    this.context.uniform1i(uniform.getLocation(), x);
                else
                    this.push(this.onSetUniform1I, { uniform: uniform, x: x });
            };
            CommandBuffer.prototype.onSetUniform1I = function (gl, args) {
                gl.uniform1i(args.uniform.getLocation(), args.x);
            };
            CommandBuffer.prototype.setUniform2F = function (uniform, x, y) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                if (this.immediate)
                    this.context.uniform2f(uniform.getLocation(), x, y);
                else
                    this.push(this.onSetUniform2F, { uniform: uniform, x: x, y: y });
            };
            CommandBuffer.prototype.onSetUniform2F = function (gl, args) {
                gl.uniform2f(args.uniform.getLocation(), args.x, args.y);
            };
            CommandBuffer.prototype.setUniform3F = function (uniform, x, y, z) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                if (this.immediate)
                    this.context.uniform3f(uniform.getLocation(), x, y, z);
                else
                    this.push(this.onSetUniform3F, { uniform: uniform, x: x, y: y, z: z });
            };
            CommandBuffer.prototype.onSetUniform3F = function (gl, args) {
                gl.uniform3f(args.uniform.getLocation(), args.x, args.y, args.z);
            };
            CommandBuffer.prototype.setUniform4F = function (uniform, x, y, z, w) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                if (this.immediate)
                    this.context.uniform4f(uniform.getLocation(), x, y, z, w);
                else
                    this.push(this.onSetUniform4F, { uniform: uniform, x: x, y: y, z: z, w: w });
            };
            CommandBuffer.prototype.onSetUniform4F = function (gl, args) {
                gl.uniform4f(args.uniform.getLocation(), args.x, args.y, args.z, args.w);
            };
            CommandBuffer.prototype.setUniformTextureSize = function (uniform, tex) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                if (this.immediate) {
                    var width = tex.getWidth(0);
                    var height = tex.getHeight(0);
                    this.context.uniform4f(uniform.getLocation(), width, height, 1 / width, 1 / height);
                }
                else
                    this.push(this.onSetUniformTextureSize, { uniform: uniform, texture: tex });
            };
            CommandBuffer.prototype.onSetUniformTextureSize = function (gl, args) {
                var width = args.texture.getWidth(0);
                var height = args.texture.getHeight(0);
                gl.uniform4f(args.uniform.getLocation(), width, height, 1 / width, 1 / height);
            };
            CommandBuffer.prototype.setUniformMatrix4 = function (uniform, transpose, values) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                if (this.immediate)
                    this.context.uniformMatrix4fv(uniform.getLocation(), transpose, values);
                else
                    this.push(this.onSetUniformMatrix4, { uniform: uniform, transpose: transpose, values: values });
            };
            CommandBuffer.prototype.onSetUniformMatrix4 = function (gl, args) {
                gl.uniformMatrix4fv(args.uniform.getLocation(), args.transpose, args.values);
            };
            CommandBuffer.prototype.bindTexture = function (unit, value) {
                if (this.boundTextures[unit] === value)
                    return;
                this.boundTextures[unit] = value;
                var frameCount = value.getFrameCount();
                if (this.immediate) {
                    var gl = this.context;
                    gl.activeTexture(unit + this.context.TEXTURE0);
                    gl.bindTexture(value.getTarget(), value.getHandle(frameCount === 1 ? undefined : this.tempCurFrame % frameCount));
                    return;
                }
                this.push(frameCount === 1 ? this.onBindTexture : this.onBindAnimatedTexture, {
                    unit: unit + this.context.TEXTURE0,
                    target: value.getTarget(),
                    texture: value,
                    frames: frameCount,
                    commandBuffer: this
                });
            };
            CommandBuffer.prototype.onBindTexture = function (gl, args) {
                gl.activeTexture(args.unit);
                gl.bindTexture(args.target, args.texture.getHandle());
            };
            CommandBuffer.prototype.onBindAnimatedTexture = function (gl, args) {
                gl.activeTexture(args.unit);
                gl.bindTexture(args.target, args.texture.getHandle(args.commandBuffer.tempCurFrame % args.frames));
            };
            CommandBuffer.prototype.bindBuffer = function (target, buffer) {
                if (this.boundBuffers[target] === buffer)
                    return;
                this.boundBuffers[target] = buffer;
                if (this.immediate)
                    this.context.bindBuffer(target, buffer);
                else
                    this.push(this.onBindBuffer, { target: target, buffer: buffer });
            };
            CommandBuffer.prototype.onBindBuffer = function (gl, args) {
                gl.bindBuffer(args.target, args.buffer);
            };
            CommandBuffer.prototype.enableVertexAttribArray = function (index) {
                if (this.immediate)
                    this.context.enableVertexAttribArray(index);
                else
                    this.push(this.onEnableVertexAttribArray, { index: index });
            };
            CommandBuffer.prototype.onEnableVertexAttribArray = function (gl, args) {
                gl.enableVertexAttribArray(args.index);
            };
            CommandBuffer.prototype.disableVertexAttribArray = function (index) {
                if (this.immediate)
                    this.context.disableVertexAttribArray(index);
                else
                    this.push(this.onDisableVertexAttribArray, { index: index });
            };
            CommandBuffer.prototype.onDisableVertexAttribArray = function (gl, args) {
                gl.disableVertexAttribArray(args.index);
            };
            CommandBuffer.prototype.vertexAttribPointer = function (index, size, type, normalized, stride, offset) {
                if (this.immediate)
                    this.context.vertexAttribPointer(index, size, type, normalized, stride, offset);
                else
                    this.push(this.onVertexAttribPointer, { index: index, size: size, type: type, normalized: normalized, stride: stride, offset: offset });
            };
            CommandBuffer.prototype.onVertexAttribPointer = function (gl, args) {
                gl.vertexAttribPointer(args.index, args.size, args.type, args.normalized, args.stride, args.offset);
            };
            CommandBuffer.prototype.drawElements = function (mode, count, type, offset, elemSize) {
                if (this.immediate) {
                    this.context.drawElements(mode, count, type, offset);
                    return;
                }
                if (this.lastCommand != null && this.lastCommand.action === this.onDrawElements &&
                    this.lastCommand.type === type &&
                    this.lastCommand.offset + this.lastCommand.count * elemSize === offset) {
                    this.lastCommand.count += count;
                    return;
                }
                this.drawCalls += 1;
                this.push(this.onDrawElements, { mode: mode, count: count, type: type, offset: offset });
            };
            CommandBuffer.prototype.onDrawElements = function (gl, args) {
                gl.drawElements(args.mode, args.count, args.type, args.offset);
            };
            CommandBuffer.prototype.bindFramebuffer = function (buffer, fitView) {
                if (this.immediate)
                    this.bindFramebufferInternal(buffer, fitView);
                else
                    this.push(this.onBindFramebuffer, { commandBuffer: this, framebuffer: buffer, fitView: fitView });
            };
            CommandBuffer.prototype.bindFramebufferInternal = function (buffer, fitView) {
                var gl = this.context;
                if (buffer == null) {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    return;
                }
                if (fitView) {
                    buffer.resize(gl.drawingBufferWidth, gl.drawingBufferHeight);
                }
                gl.bindFramebuffer(gl.FRAMEBUFFER, buffer.getHandle());
            };
            CommandBuffer.prototype.onBindFramebuffer = function (gl, args) {
                args.commandBuffer.bindFramebufferInternal(args.framebuffer, args.fitView);
            };
            return CommandBuffer;
        }());
        WebGame.CommandBuffer = CommandBuffer;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
/// <reference path="Entity.ts"/>
/// <reference path="CommandBuffer.ts"/>
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Camera = (function (_super) {
            __extends(Camera, _super);
            function Camera(game, near, far) {
                var _this = _super.call(this) || this;
                _this.drawList = new WebGame.DrawList();
                _this.geometryInvalid = true;
                _this.fog = new WebGame.Fog();
                _this.projectionInvalid = true;
                _this.projectionMatrix = new Facepunch.Matrix4();
                _this.inverseProjectionInvalid = true;
                _this.inverseProjectionMatrix = new Facepunch.Matrix4();
                _this.cameraPosParams = new Float32Array(3);
                _this.clipParams = new Float32Array(4);
                _this.game = game;
                _this.commandBuffer = new WebGame.CommandBuffer(game.context);
                _this.near = near;
                _this.far = far;
                game.addDrawListInvalidationHandler(function (geom) {
                    if (geom)
                        _this.invalidateGeometry();
                    _this.drawList.invalidate();
                });
                return _this;
            }
            Camera.prototype.setShadowCascades = function (cascadeFractions) {
                if (this.shadowCamera == null) {
                    this.shadowCamera = new WebGame.ShadowCamera(this.game, this);
                }
                this.shadowCascades = cascadeFractions;
            };
            Camera.prototype.setNear = function (value) {
                if (value === this.near)
                    return;
                this.near = value;
                this.invalidateProjectionMatrix();
            };
            Camera.prototype.getNear = function () { return this.near; };
            Camera.prototype.setFar = function (value) {
                if (value === this.far)
                    return;
                this.far = value;
                this.invalidateProjectionMatrix();
            };
            Camera.prototype.getFar = function () { return this.far; };
            Camera.prototype.getOpaqueColorTexture = function () {
                return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getColorTexture();
            };
            Camera.prototype.getOpaqueDepthTexture = function () {
                return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getDepthTexture();
            };
            Camera.prototype.getShadowCascadeCount = function () {
                return this.shadowCascades == null ? 0 : this.shadowCascades.length;
            };
            Camera.prototype.invalidateGeometry = function () {
                this.geometryInvalid = true;
            };
            Camera.prototype.onPopulateDrawList = function (drawList) {
                this.game.populateDrawList(this.drawList, this);
            };
            Camera.prototype.render = function () {
                if (this.geometryInvalid) {
                    this.drawList.clear();
                    this.onPopulateDrawList(this.drawList);
                }
                if (this.geometryInvalid || this.drawList.isInvalid()) {
                    this.commandBuffer.clearCommands();
                    this.drawList.appendToBuffer(this.commandBuffer, this);
                }
                this.geometryInvalid = false;
                this.populateCommandBufferParameters(this.commandBuffer);
                this.commandBuffer.run();
            };
            Camera.prototype.setupFrameBuffers = function () {
                if (this.opaqueFrameBuffer !== undefined)
                    return;
                var gl = this.game.context;
                var width = this.game.getWidth();
                var height = this.game.getHeight();
                this.opaqueFrameBuffer = new WebGame.FrameBuffer(gl, width, height);
                this.opaqueFrameBuffer.addDepthAttachment();
            };
            Camera.prototype.bufferOpaqueTargetBegin = function (buf) {
                this.setupFrameBuffers();
                var gl = WebGLRenderingContext;
                buf.bindFramebuffer(this.opaqueFrameBuffer, true);
                buf.depthMask(true);
                buf.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            };
            Camera.prototype.bufferRenderTargetEnd = function (buf) {
                buf.bindFramebuffer(null);
            };
            Camera.prototype.bufferShadowTargetBegin = function (buf, cascadeIndex) {
                var nearFrac = cascadeIndex === 0 ? 0 : this.shadowCascades[cascadeIndex - 1];
                var farFrac = this.shadowCascades[cascadeIndex];
                var near = this.getNear();
                var range = this.getFar() - near;
                var lightDirArray = buf.getArrayParameter(WebGame.Game.lightDirParam);
                var lightDir = Camera.bufferShadowTargetBegin_lightDir;
                var lightNorm = Camera.bufferShadowTargetBegin_lightNorm;
                lightNorm.set(lightDirArray[0], lightDirArray[1], lightDirArray[2]);
                lightDir.setLookAlong(lightNorm);
                this.shadowCamera.bufferCascadeBegin(lightDir, near + nearFrac * range, near + farFrac * range);
            };
            Camera.prototype.bufferShadowTargetEnd = function (buf) {
            };
            Camera.prototype.getDrawCalls = function () {
                return this.commandBuffer.getDrawCalls();
            };
            Camera.prototype.getProjectionMatrix = function (target) {
                if (this.projectionInvalid) {
                    this.projectionInvalid = false;
                    this.onUpdateProjectionMatrix(this.projectionMatrix);
                }
                if (target != null) {
                    target.copy(this.projectionMatrix);
                    return target;
                }
                return this.projectionMatrix;
            };
            Camera.prototype.getInverseProjectionMatrix = function (target) {
                if (this.inverseProjectionInvalid) {
                    this.inverseProjectionInvalid = false;
                    this.inverseProjectionMatrix.setInverse(this.getProjectionMatrix());
                }
                if (target != null) {
                    target.copy(this.inverseProjectionMatrix);
                    return target;
                }
                return this.inverseProjectionMatrix;
            };
            Camera.prototype.invalidateProjectionMatrix = function () {
                this.projectionInvalid = true;
                this.inverseProjectionInvalid = true;
            };
            Camera.prototype.populateCommandBufferParameters = function (buf) {
                this.getPositionValues(this.cameraPosParams);
                this.clipParams[0] = this.getNear();
                this.clipParams[1] = this.getFar();
                this.clipParams[2] = 1 / (this.clipParams[1] - this.clipParams[0]);
                buf.setParameter(Camera.cameraPosParam, this.cameraPosParams);
                buf.setParameter(Camera.clipInfoParam, this.clipParams);
                buf.setParameter(Camera.projectionMatrixParam, this.getProjectionMatrix().elements);
                buf.setParameter(Camera.inverseProjectionMatrixParam, this.getInverseProjectionMatrix().elements);
                buf.setParameter(Camera.viewMatrixParam, this.getInverseMatrix().elements);
                buf.setParameter(Camera.inverseViewMatrixParam, this.getMatrix().elements);
                buf.setParameter(Camera.opaqueColorParam, this.getOpaqueColorTexture());
                buf.setParameter(Camera.opaqueDepthParam, this.getOpaqueDepthTexture());
                this.game.populateCommandBufferParameters(buf);
                this.fog.populateCommandBufferParameters(buf);
            };
            Camera.prototype.dispose = function () {
                if (this.opaqueFrameBuffer != null) {
                    this.opaqueFrameBuffer.dispose();
                    this.opaqueFrameBuffer = null;
                }
            };
            return Camera;
        }(WebGame.Entity));
        Camera.cameraPosParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float3);
        Camera.clipInfoParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float4);
        Camera.projectionMatrixParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Matrix4);
        Camera.inverseProjectionMatrixParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Matrix4);
        Camera.viewMatrixParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Matrix4);
        Camera.inverseViewMatrixParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Matrix4);
        Camera.opaqueColorParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Texture);
        Camera.opaqueDepthParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Texture);
        Camera.bufferShadowTargetBegin_lightNorm = new Facepunch.Vector3();
        Camera.bufferShadowTargetBegin_lightDir = new Facepunch.Quaternion();
        WebGame.Camera = Camera;
        var PerspectiveCamera = (function (_super) {
            __extends(PerspectiveCamera, _super);
            function PerspectiveCamera(game, fov, aspect, near, far) {
                var _this = _super.call(this, game, near, far) || this;
                _this.fov = fov;
                _this.aspect = aspect;
                return _this;
            }
            PerspectiveCamera.prototype.setFov = function (value) {
                if (value === this.fov)
                    return;
                this.fov = value;
                this.invalidateProjectionMatrix();
            };
            PerspectiveCamera.prototype.getFov = function () { return this.fov; };
            PerspectiveCamera.prototype.setAspect = function (value) {
                if (value === this.aspect)
                    return;
                this.aspect = value;
                this.invalidateProjectionMatrix();
            };
            PerspectiveCamera.prototype.getAspect = function () { return this.aspect; };
            PerspectiveCamera.prototype.onUpdateProjectionMatrix = function (matrix) {
                var deg2Rad = Math.PI / 180;
                matrix.setPerspective(deg2Rad * this.fov, this.aspect, this.getNear(), this.getFar());
            };
            return PerspectiveCamera;
        }(Camera));
        WebGame.PerspectiveCamera = PerspectiveCamera;
        var OrthographicCamera = (function (_super) {
            __extends(OrthographicCamera, _super);
            function OrthographicCamera(game, size, aspect, near, far) {
                var _this = _super.call(this, game, near, far) || this;
                _this.size = size;
                _this.aspect = aspect;
                return _this;
            }
            OrthographicCamera.prototype.setSize = function (value) {
                if (value === this.size)
                    return;
                this.size = value;
                this.invalidateProjectionMatrix();
            };
            OrthographicCamera.prototype.getSize = function () { return this.size; };
            OrthographicCamera.prototype.setAspect = function (value) {
                if (value === this.aspect)
                    return;
                this.aspect = value;
                this.invalidateProjectionMatrix();
            };
            OrthographicCamera.prototype.getAspect = function () { return this.aspect; };
            OrthographicCamera.prototype.onUpdateProjectionMatrix = function (matrix) {
                matrix.setOrthographic(this.size, this.aspect, this.getNear(), this.getFar());
            };
            return OrthographicCamera;
        }(Camera));
        WebGame.OrthographicCamera = OrthographicCamera;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
/// <reference path="Entity.ts"/>
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var DrawableEntity = (function (_super) {
            __extends(DrawableEntity, _super);
            function DrawableEntity(isStatic) {
                if (isStatic === void 0) { isStatic = false; }
                var _this = _super.call(this) || this;
                _this.drawable = new WebGame.DrawListItem();
                _this.drawable.entity = _this;
                _this.drawable.isStatic = isStatic;
                return _this;
            }
            DrawableEntity.prototype.invalidateDrawLists = function () {
                this.drawable.invalidateDrawLists();
            };
            DrawableEntity.prototype.getIsVisible = function () {
                return this.drawable.getIsVisible();
            };
            DrawableEntity.prototype.getIsInDrawList = function (drawList) {
                return this.drawable.getIsInDrawList(drawList);
            };
            DrawableEntity.prototype.onAddToDrawList = function (list) {
                this.drawable.onAddToDrawList(list);
            };
            DrawableEntity.prototype.onRemoveFromDrawList = function (list) {
                this.drawable.onRemoveFromDrawList(list);
            };
            DrawableEntity.prototype.getMeshHandles = function () {
                return this.drawable.getMeshHandles();
            };
            return DrawableEntity;
        }(WebGame.Entity));
        WebGame.DrawableEntity = DrawableEntity;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
/// <reference path="DrawableEntity.ts"/>
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var DebugLine = (function (_super) {
            __extends(DebugLine, _super);
            function DebugLine(game) {
                var _this = _super.call(this) || this;
                _this.attribs = [WebGame.VertexAttribute.position, WebGame.VertexAttribute.alpha];
                _this.vertData = new Float32Array(4);
                _this.vertBuffer = new Float32Array(6);
                _this.meshChanged = false;
                _this.progressScale = 1;
                _this.lastPos = new Facepunch.Vector3();
                _this.progress = 0;
                _this.game = game;
                _this.material = game.shaders.createMaterial(WebGame.Shaders.DebugLine, true);
                _this.materialProps = _this.material.properties;
                _this.meshGroup = new WebGame.MeshGroup(game.context, _this.attribs);
                _this.meshHandle = new WebGame.MeshHandle(_this.meshGroup, 0, WebGame.DrawMode.Lines, 0, 0, _this.material);
                _this.meshHandles = [_this.meshHandle];
                _this.vertData = new Float32Array(4);
                _this.indexData = _this.meshGroup.indexSize === 2 ? new Uint16Array(2) : new Uint32Array(4);
                return _this;
            }
            DebugLine.prototype.clear = function () {
                this.meshGroup.clear();
                this.meshHandle.indexCount = 0;
                this.meshChanged = true;
            };
            Object.defineProperty(DebugLine.prototype, "phase", {
                get: function () {
                    return this.materialProps.phase;
                },
                set: function (value) {
                    this.materialProps.phase = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DebugLine.prototype, "frequency", {
                get: function () {
                    return this.materialProps.frequency;
                },
                set: function (value) {
                    this.materialProps.frequency = value;
                },
                enumerable: true,
                configurable: true
            });
            DebugLine.prototype.setColor = function (color0, color1) {
                if (color1 === undefined)
                    color1 = color0;
                this.materialProps.color0.copy(color0);
                this.materialProps.color1.copy(color1);
            };
            DebugLine.prototype.addVertex = function (pos, progress) {
                var vertData = this.vertData;
                vertData[0] = pos.x;
                vertData[1] = pos.y;
                vertData[2] = pos.z;
                vertData[3] = this.progress;
                return this.meshGroup.addVertexData(vertData, this.meshHandle) >> 2;
            };
            DebugLine.prototype.moveTo = function (pos) {
                this.lastPos.copy(pos);
                this.progress = 0;
                this.addVertex(pos, this.progress);
            };
            DebugLine.prototype.lineTo = function (pos, progress) {
                var indexData = this.indexData;
                this.meshChanged = true;
                if (progress === undefined) {
                    this.lastPos.sub(pos);
                    this.progress += this.lastPos.length() * this.progressScale;
                }
                else {
                    this.progress = progress;
                }
                this.lastPos.copy(pos);
                var index = this.addVertex(pos, this.progress);
                indexData[0] = Math.max(0, index - 1);
                indexData[1] = index;
                this.meshGroup.addIndexData(indexData, this.meshHandle);
            };
            DebugLine.prototype.update = function () {
                if (this.meshChanged) {
                    this.meshChanged = false;
                    this.drawable.clearMeshHandles();
                    if (this.meshHandle.indexCount > 0) {
                        this.drawable.addMeshHandles(this.meshHandles);
                    }
                }
            };
            DebugLine.prototype.dispose = function () {
                this.meshGroup.dispose();
            };
            return DebugLine;
        }(WebGame.DrawableEntity));
        WebGame.DebugLine = DebugLine;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var DrawList = (function () {
            function DrawList() {
                this.items = [];
                this.shadowCast = [];
                this.opaque = [];
                this.translucent = [];
                this.isBuildingList = false;
            }
            DrawList.prototype.isInvalid = function () {
                return this.invalid;
            };
            DrawList.prototype.clear = function () {
                for (var i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                    this.items[i].onRemoveFromDrawList(this);
                }
                this.items = [];
                this.shadowCast = [];
                this.opaque = [];
                this.translucent = [];
            };
            DrawList.prototype.addItem = function (item) {
                this.items.push(item);
                item.onAddToDrawList(this);
                this.invalidate();
            };
            DrawList.prototype.addItems = function (items) {
                if (items.length === 0)
                    return;
                for (var i = 0, iEnd = items.length; i < iEnd; ++i) {
                    this.items.push(items[i]);
                    items[i].onAddToDrawList(this);
                }
                this.invalidate();
            };
            DrawList.prototype.invalidate = function () {
                if (this.isBuildingList)
                    return;
                this.invalid = true;
            };
            DrawList.prototype.bufferHandle = function (buf, handle) {
                var changedMaterial = false;
                var changedProgram = false;
                var changedTransform = false;
                var changedBuffer = false;
                var changedAttributes = false;
                var program = handle.program;
                if (this.lastHandle.transform !== handle.transform) {
                    changedTransform = true;
                }
                if (this.lastHandle.group !== handle.group) {
                    changedBuffer = true;
                }
                if (this.lastHandle.vertexOffset !== handle.vertexOffset) {
                    changedAttributes = true;
                }
                if (this.lastHandle.material !== handle.material) {
                    changedMaterial = true;
                    changedProgram = this.lastProgram !== program;
                    changedTransform = changedTransform || changedProgram;
                }
                if (changedProgram) {
                    changedBuffer = true;
                    if (this.lastProgram !== undefined) {
                        this.lastProgram.bufferDisableAttributes(buf);
                    }
                    program.bufferSetup(buf);
                }
                if (changedMaterial) {
                    program.bufferMaterial(buf, handle.material);
                }
                if (changedTransform) {
                    program.bufferModelMatrix(buf, handle.transform == null
                        ? DrawList.identityMatrix.elements : handle.transform.elements);
                }
                if (changedBuffer) {
                    changedAttributes = true;
                    handle.group.bufferBindBuffers(buf, program);
                }
                if (changedAttributes) {
                    handle.group.bufferAttribPointers(buf, program, handle.vertexOffset);
                }
                handle.group.bufferRenderElements(buf, handle.drawMode, handle.indexOffset, handle.indexCount);
                this.lastHandle = handle;
                this.lastProgram = program;
            };
            DrawList.compareHandles = function (a, b) {
                return a.compareTo(b);
            };
            DrawList.prototype.buildHandleList = function (shaders) {
                this.shadowCast = [];
                this.opaque = [];
                this.translucent = [];
                this.hasRefraction = false;
                var errorProgram = shaders.get(WebGame.Shaders.Error);
                this.isBuildingList = true;
                for (var i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                    var handles = this.items[i].getMeshHandles();
                    if (handles == null)
                        continue;
                    for (var j = 0, jEnd = handles.length; j < jEnd; ++j) {
                        var handle = handles[j];
                        if (handle.indexCount === 0)
                            continue;
                        if (handle.material == null)
                            continue;
                        if (!handle.material.enabled)
                            continue;
                        handle.program = handle.material.program;
                        if (handle.program == null || !handle.program.isCompiled()) {
                            handle.program = errorProgram;
                        }
                        var properties = handle.material.properties;
                        if (properties.translucent || properties.refract) {
                            if (properties.refract)
                                this.hasRefraction = true;
                            this.translucent.push(handle);
                        }
                        else {
                            if (properties.shadowCast)
                                this.shadowCast.push(handle);
                            this.opaque.push(handle);
                        }
                    }
                }
                this.isBuildingList = false;
                this.shadowCast.sort(DrawList.compareHandles);
                this.opaque.sort(DrawList.compareHandles);
                this.translucent.sort(DrawList.compareHandles);
                this.invalid = false;
            };
            DrawList.prototype.appendToBuffer = function (buf, camera) {
                this.lastHandle = WebGame.MeshHandle.undefinedHandle;
                this.lastProgram = undefined;
                if (this.invalid)
                    this.buildHandleList(camera.game.shaders);
                camera.game.shaders.resetUniformCache();
                if (this.shadowCast.length > 0 && camera.getShadowCascadeCount() > 0) {
                    camera.bufferShadowTargetBegin(buf, 0);
                    for (var i = 0, iEnd = this.shadowCast.length; i < iEnd; ++i) {
                        this.bufferHandle(buf, this.shadowCast[i]);
                    }
                    camera.bufferShadowTargetEnd(buf);
                }
                if (this.hasRefraction)
                    camera.bufferOpaqueTargetBegin(buf);
                for (var i = 0, iEnd = this.opaque.length; i < iEnd; ++i) {
                    this.bufferHandle(buf, this.opaque[i]);
                }
                if (this.hasRefraction) {
                    camera.bufferRenderTargetEnd(buf);
                    this.bufferHandle(buf, camera.game.meshes.getComposeFrameMeshHandle());
                }
                for (var i = 0, iEnd = this.translucent.length; i < iEnd; ++i) {
                    this.bufferHandle(buf, this.translucent[i]);
                }
                if (this.lastProgram !== undefined) {
                    this.lastProgram.bufferDisableAttributes(buf);
                    this.lastProgram = undefined;
                    buf.useProgram(null);
                }
            };
            return DrawList;
        }());
        DrawList.identityMatrix = new Facepunch.Matrix4().setIdentity();
        WebGame.DrawList = DrawList;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var DrawListItem = (function () {
            function DrawListItem() {
                this.isStatic = false;
                this.entity = null;
                this.drawLists = [];
            }
            DrawListItem.prototype.clearMeshHandles = function () {
                if (this.meshHandles != null) {
                    for (var i = 0, iEnd = this.meshHandles.length; i < iEnd; ++i) {
                        var handle = this.meshHandles[i];
                        if (handle.material == null)
                            continue;
                        handle.material.removeUsage(this);
                    }
                }
                this.meshHandles = null;
                this.invalidateDrawLists();
            };
            DrawListItem.prototype.addMeshHandles = function (handles) {
                if (this.meshHandles == null)
                    this.meshHandles = [];
                for (var i = 0, iEnd = handles.length; i < iEnd; ++i) {
                    var handle = handles[i].clone(!this.isStatic && this.entity != null ? this.entity.getMatrix() : null);
                    this.meshHandles.push(handle);
                    if (handle.material != null) {
                        handle.material.addUsage(this);
                    }
                }
                this.invalidateDrawLists();
            };
            DrawListItem.prototype.invalidateDrawLists = function () {
                if (!this.getIsVisible())
                    return;
                for (var i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                    this.drawLists[i].invalidate();
                }
            };
            DrawListItem.prototype.getIsVisible = function () {
                return this.drawLists.length > 0;
            };
            DrawListItem.prototype.getIsInDrawList = function (drawList) {
                for (var i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                    if (this.drawLists[i] === drawList) {
                        return true;
                    }
                }
                return false;
            };
            DrawListItem.prototype.onAddToDrawList = function (list) {
                if (this.getIsInDrawList(list))
                    throw "Item added to a draw list twice.";
                this.drawLists.push(list);
            };
            DrawListItem.prototype.onRemoveFromDrawList = function (list) {
                for (var i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                    if (this.drawLists[i] === list) {
                        this.drawLists.splice(i, 1);
                        return;
                    }
                }
                throw "Item removed from a draw list it isn't a member of.";
            };
            DrawListItem.prototype.getMeshHandles = function () {
                return this.meshHandles;
            };
            return DrawListItem;
        }());
        WebGame.DrawListItem = DrawListItem;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Fog = (function () {
            function Fog() {
                this.start = 0;
                this.end = 8192;
                this.maxDensity = 0;
                this.color = new Facepunch.Vector3();
                this.colorValues = new Float32Array(3);
                this.paramsValues = new Float32Array(4);
            }
            Fog.prototype.populateCommandBufferParameters = function (buf) {
                this.colorValues[0] = this.color.x;
                this.colorValues[1] = this.color.y;
                this.colorValues[2] = this.color.z;
                buf.setParameter(Fog.fogColorParam, this.colorValues);
                var clipParams = buf.getArrayParameter(WebGame.Camera.clipInfoParam);
                var near = clipParams[0];
                var far = clipParams[1];
                var densMul = this.maxDensity / (this.end - this.start);
                var dens0 = (0 - this.start) * densMul;
                var dens1 = (1 - this.start) * densMul;
                this.paramsValues[0] = dens0;
                this.paramsValues[1] = dens1 - dens0;
                this.paramsValues[2] = 0;
                this.paramsValues[3] = this.maxDensity;
                buf.setParameter(Fog.fogInfoParam, this.paramsValues);
            };
            return Fog;
        }());
        Fog.fogColorParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float3);
        Fog.fogInfoParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float4);
        WebGame.Fog = Fog;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var FrameBuffer = (function () {
            function FrameBuffer(glOrTex, width, height) {
                var gl;
                if (width !== undefined) {
                    this.ownsFrameTexture = true;
                    this.context = gl = glOrTex;
                    this.frameTexture = new WebGame.RenderTexture(gl, WebGame.TextureTarget.Texture2D, WebGame.TextureFormat.Rgba, WebGame.TextureDataType.Uint8, width, height);
                }
                else {
                    this.ownsFrameTexture = false;
                    this.frameTexture = glOrTex;
                    this.context = gl = this.frameTexture.context;
                }
                this.frameBuffer = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frameTexture.getHandle(), 0);
                this.unbindAndCheckState();
            }
            FrameBuffer.prototype.unbindAndCheckState = function () {
                var gl = this.context;
                var state = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                if (state !== gl.FRAMEBUFFER_COMPLETE) {
                    throw new Error("Unexpected framebuffer state: " + state + ".");
                }
            };
            FrameBuffer.prototype.addDepthAttachment = function (existing) {
                var gl = this.context;
                if (existing == null) {
                    this.ownsDepthTexture = true;
                    this.depthTexture = new WebGame.RenderTexture(gl, WebGame.TextureTarget.Texture2D, WebGame.TextureFormat.DepthComponent, WebGame.TextureDataType.Uint32, this.frameTexture.getWidth(0), this.frameTexture.getHeight(0));
                }
                else {
                    this.ownsDepthTexture = false;
                    this.depthTexture = existing;
                }
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture.getHandle(), 0);
                this.unbindAndCheckState();
            };
            FrameBuffer.prototype.getColorTexture = function () { return this.frameTexture; };
            FrameBuffer.prototype.getDepthTexture = function () { return this.depthTexture; };
            FrameBuffer.prototype.dispose = function () {
                if (this.frameBuffer !== undefined) {
                    this.context.deleteFramebuffer(this.frameBuffer);
                    this.frameBuffer = undefined;
                }
                if (this.frameTexture !== undefined && this.ownsFrameTexture) {
                    this.frameTexture.dispose();
                    this.frameTexture = undefined;
                    this.ownsFrameTexture = undefined;
                }
                if (this.depthTexture !== undefined && this.ownsDepthTexture) {
                    this.depthTexture.dispose();
                    this.depthTexture = undefined;
                    this.ownsDepthTexture = undefined;
                }
            };
            FrameBuffer.prototype.resize = function (width, height) {
                if (this.ownsFrameTexture)
                    this.frameTexture.resize(width, height);
                if (this.depthTexture !== undefined && this.ownsDepthTexture) {
                    this.depthTexture.resize(width, height);
                }
            };
            FrameBuffer.prototype.getHandle = function () {
                return this.frameBuffer;
            };
            FrameBuffer.prototype.begin = function () {
                var gl = this.context;
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
            };
            FrameBuffer.prototype.end = function () {
                var gl = this.context;
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            };
            return FrameBuffer;
        }());
        WebGame.FrameBuffer = FrameBuffer;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var MouseButton;
        (function (MouseButton) {
            MouseButton[MouseButton["Left"] = 1] = "Left";
            MouseButton[MouseButton["Middle"] = 2] = "Middle";
            MouseButton[MouseButton["Right"] = 3] = "Right";
        })(MouseButton = WebGame.MouseButton || (WebGame.MouseButton = {}));
        var Key;
        (function (Key) {
            Key[Key["Backspace"] = 8] = "Backspace";
            Key[Key["Tab"] = 9] = "Tab";
            Key[Key["Enter"] = 13] = "Enter";
            Key[Key["Shift"] = 16] = "Shift";
            Key[Key["Ctrl"] = 17] = "Ctrl";
            Key[Key["Alt"] = 18] = "Alt";
            Key[Key["PauseBreak"] = 19] = "PauseBreak";
            Key[Key["CapsLock"] = 20] = "CapsLock";
            Key[Key["Escape"] = 27] = "Escape";
            Key[Key["Space"] = 32] = "Space";
            Key[Key["PageUp"] = 33] = "PageUp";
            Key[Key["PageDown"] = 34] = "PageDown";
            Key[Key["End"] = 35] = "End";
            Key[Key["Home"] = 36] = "Home";
            Key[Key["LeftArrow"] = 37] = "LeftArrow";
            Key[Key["UpArrow"] = 38] = "UpArrow";
            Key[Key["RightArrow"] = 39] = "RightArrow";
            Key[Key["DownArrow"] = 40] = "DownArrow";
            Key[Key["Insert"] = 45] = "Insert";
            Key[Key["Delete"] = 46] = "Delete";
            Key[Key["D0"] = 48] = "D0";
            Key[Key["D1"] = 49] = "D1";
            Key[Key["D2"] = 50] = "D2";
            Key[Key["D3"] = 51] = "D3";
            Key[Key["D4"] = 52] = "D4";
            Key[Key["D5"] = 53] = "D5";
            Key[Key["D6"] = 54] = "D6";
            Key[Key["D7"] = 55] = "D7";
            Key[Key["D8"] = 56] = "D8";
            Key[Key["D9"] = 57] = "D9";
            Key[Key["A"] = 65] = "A";
            Key[Key["B"] = 66] = "B";
            Key[Key["C"] = 67] = "C";
            Key[Key["D"] = 68] = "D";
            Key[Key["E"] = 69] = "E";
            Key[Key["F"] = 70] = "F";
            Key[Key["G"] = 71] = "G";
            Key[Key["H"] = 72] = "H";
            Key[Key["I"] = 73] = "I";
            Key[Key["J"] = 74] = "J";
            Key[Key["K"] = 75] = "K";
            Key[Key["L"] = 76] = "L";
            Key[Key["M"] = 77] = "M";
            Key[Key["N"] = 78] = "N";
            Key[Key["O"] = 79] = "O";
            Key[Key["P"] = 80] = "P";
            Key[Key["Q"] = 81] = "Q";
            Key[Key["R"] = 82] = "R";
            Key[Key["S"] = 83] = "S";
            Key[Key["T"] = 84] = "T";
            Key[Key["U"] = 85] = "U";
            Key[Key["V"] = 86] = "V";
            Key[Key["W"] = 87] = "W";
            Key[Key["X"] = 88] = "X";
            Key[Key["Y"] = 89] = "Y";
            Key[Key["Z"] = 90] = "Z";
            Key[Key["LeftWindowKey"] = 91] = "LeftWindowKey";
            Key[Key["RightWindowKey"] = 92] = "RightWindowKey";
            Key[Key["Select"] = 93] = "Select";
            Key[Key["Numpad0"] = 96] = "Numpad0";
            Key[Key["Numpad1"] = 97] = "Numpad1";
            Key[Key["Numpad2"] = 98] = "Numpad2";
            Key[Key["Numpad3"] = 99] = "Numpad3";
            Key[Key["Numpad4"] = 100] = "Numpad4";
            Key[Key["Numpad5"] = 101] = "Numpad5";
            Key[Key["Numpad6"] = 102] = "Numpad6";
            Key[Key["Numpad7"] = 103] = "Numpad7";
            Key[Key["Numpad8"] = 104] = "Numpad8";
            Key[Key["Numpad9"] = 105] = "Numpad9";
            Key[Key["Multiply"] = 106] = "Multiply";
            Key[Key["Add"] = 107] = "Add";
            Key[Key["Subtract"] = 109] = "Subtract";
            Key[Key["DecimalPoint"] = 110] = "DecimalPoint";
            Key[Key["Divide"] = 111] = "Divide";
            Key[Key["F1"] = 112] = "F1";
            Key[Key["F2"] = 113] = "F2";
            Key[Key["F3"] = 114] = "F3";
            Key[Key["F4"] = 115] = "F4";
            Key[Key["F5"] = 116] = "F5";
            Key[Key["F6"] = 117] = "F6";
            Key[Key["F7"] = 118] = "F7";
            Key[Key["F8"] = 119] = "F8";
            Key[Key["F9"] = 120] = "F9";
            Key[Key["F10"] = 121] = "F10";
            Key[Key["F11"] = 122] = "F11";
            Key[Key["F12"] = 123] = "F12";
            Key[Key["NumLock"] = 144] = "NumLock";
            Key[Key["ScrollLock"] = 145] = "ScrollLock";
            Key[Key["SemiColon"] = 186] = "SemiColon";
            Key[Key["EqualSign"] = 187] = "EqualSign";
            Key[Key["Comma"] = 188] = "Comma";
            Key[Key["Dash"] = 189] = "Dash";
            Key[Key["Period"] = 190] = "Period";
            Key[Key["ForwardSlash"] = 191] = "ForwardSlash";
            Key[Key["GraveAccent"] = 192] = "GraveAccent";
            Key[Key["OpenBracket"] = 219] = "OpenBracket";
            Key[Key["BackSlash"] = 220] = "BackSlash";
            Key[Key["CloseBraket"] = 221] = "CloseBraket";
            Key[Key["SingleQuote"] = 222] = "SingleQuote";
        })(Key = WebGame.Key || (WebGame.Key = {}));
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
/// <reference path="Input.ts"/>
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Game = (function () {
            function Game(container) {
                var _this = this;
                this.canLockPointer = false;
                this.initialized = false;
                this.loaders = [];
                this.lastAnimateCallback = 0;
                this.drawListInvalidationHandlers = [];
                this.heldKeys = new Array(128);
                this.heldMouseButtons = new Array(8);
                this.mouseScreenPos = new Facepunch.Vector2();
                this.mouseLookDelta = new Facepunch.Vector2();
                this.timeParams = new Float32Array(4);
                this.screenParams = new Float32Array(4);
                this.lightDirParams = new Float32Array(3);
                this.container = container;
                this.canvas = document.createElement("canvas");
                this.container.appendChild(this.canvas);
                this.context = this.canvas.getContext("webgl");
                this.shaders = new WebGame.ShaderManager(this.context);
                this.meshes = new WebGame.MeshManager(this);
                this.materialLoader = this.addLoader(new WebGame.MaterialLoader(this));
                this.textureLoader = this.addLoader(new WebGame.TextureLoader(this.context));
                this.modelLoader = this.addLoader(new WebGame.ModelLoader(this));
                this.enableExtension("OES_texture_float");
                this.enableExtension("OES_texture_float_linear");
                this.enableExtension("EXT_frag_depth");
                this.enableExtension("WEBGL_depth_texture");
                container.addEventListener("mousedown", function (evnt) {
                    _this.heldMouseButtons[evnt.which] = true;
                    var handled = _this.onMouseDown(evnt.which, _this.getScreenPos(evnt.pageX, evnt.pageY, _this.mouseScreenPos), evnt.target);
                    if (handled)
                        evnt.preventDefault();
                    return handled;
                });
                this.canvas.addEventListener("contextmenu", function (evnt) {
                    evnt.preventDefault();
                    return false;
                });
                window.addEventListener("mouseup", function (evnt) {
                    _this.heldMouseButtons[evnt.which] = false;
                    var handled = _this.onMouseUp(evnt.which, _this.getScreenPos(evnt.pageX, evnt.pageY, _this.mouseScreenPos), evnt.target);
                    if (handled)
                        evnt.preventDefault();
                    return handled;
                });
                window.addEventListener("mousemove", function (evnt) {
                    _this.onMouseMove(_this.getScreenPos(evnt.pageX, evnt.pageY, _this.mouseScreenPos));
                    if (_this.isPointerLocked()) {
                        var e = evnt;
                        _this.mouseLookDelta.set(e.movementX, e.movementY);
                        _this.onMouseLook(_this.mouseLookDelta);
                    }
                });
                window.addEventListener("mousewheel", function (evnt) {
                    var handled = _this.onMouseScroll(evnt.wheelDelta / 400);
                    if (handled)
                        evnt.preventDefault();
                    return handled;
                });
                window.addEventListener("keydown", function (evnt) {
                    if (evnt.which < 0 || evnt.which >= 128)
                        return true;
                    _this.heldKeys[evnt.which] = true;
                    var handled = _this.onKeyDown(evnt.which);
                    if (_this.isPointerLocked() && evnt.which === WebGame.Key.Escape) {
                        document.exitPointerLock();
                        handled = true;
                    }
                    if (handled)
                        evnt.preventDefault();
                    return evnt.which !== WebGame.Key.Tab && handled;
                });
                window.addEventListener("keyup", function (evnt) {
                    if (evnt.which < 0 || evnt.which >= 128)
                        return true;
                    _this.heldKeys[evnt.which] = false;
                    var handled = _this.onKeyUp(evnt.which);
                    if (handled)
                        evnt.preventDefault();
                    return handled;
                });
                window.addEventListener("resize", function (evnt) {
                    _this.onResize();
                    _this.onRenderFrame(0);
                });
                this.animateCallback = function (time) {
                    var deltaTime = time - _this.lastAnimateCallback;
                    _this.lastAnimateCallback = time;
                    _this.animate(deltaTime * 0.001);
                };
            }
            Game.prototype.enableExtension = function (name) {
                if (this.context.getExtension(name) == null) {
                    console.warn("WebGL extension '" + name + "' is unsupported.");
                }
            };
            Game.prototype.getLastUpdateTime = function () {
                return this.lastAnimateCallback;
            };
            Game.prototype.getWidth = function () {
                return this.container.clientWidth;
            };
            Game.prototype.getHeight = function () {
                return this.container.clientHeight;
            };
            Game.prototype.getMouseScreenPos = function (out) {
                if (out == null)
                    out = new Facepunch.Vector2();
                out.copy(this.mouseScreenPos);
                return out;
            };
            Game.prototype.getMouseViewPos = function (out) {
                if (out == null)
                    out = new Facepunch.Vector2();
                this.getMouseScreenPos(out);
                out.x = out.x / this.getWidth() - 0.5;
                out.y = out.y / this.getHeight() - 0.5;
                return out;
            };
            Game.prototype.getScreenPos = function (pageX, pageY, out) {
                if (out == null)
                    out = new Facepunch.Vector2();
                out.x = pageX - this.container.offsetLeft;
                out.y = pageY - this.container.offsetTop;
                return out;
            };
            Game.prototype.isPointerLocked = function () {
                return document.pointerLockElement === this.container;
            };
            Game.prototype.populateDrawList = function (drawList, camera) { };
            Game.prototype.addDrawListInvalidationHandler = function (action) {
                this.drawListInvalidationHandlers.push(action);
            };
            Game.prototype.forceDrawListInvalidation = function (geom) {
                for (var i = 0; i < this.drawListInvalidationHandlers.length; ++i) {
                    this.drawListInvalidationHandlers[i](geom);
                }
            };
            Game.prototype.animate = function (dt) {
                dt = dt || 0.01666667;
                if (!this.initialized) {
                    this.initialized = true;
                    this.onInitialize();
                    this.onResize();
                }
                for (var i = 0, iEnd = this.loaders.length; i < iEnd; ++i) {
                    this.loaders[i].update(4);
                }
                this.onUpdateFrame(dt);
                this.onRenderFrame(dt);
                requestAnimationFrame(this.animateCallback);
            };
            Game.prototype.isKeyDown = function (key) {
                return key >= 0 && key < 128 && this.heldKeys[key] === true;
            };
            Game.prototype.isMouseButtonDown = function (button) {
                return button >= 0 && button < this.heldMouseButtons.length && this.heldMouseButtons[button] === true;
            };
            Game.prototype.onInitialize = function () { };
            Game.prototype.onResize = function () {
                this.canvas.width = this.container.clientWidth;
                this.canvas.height = this.container.clientHeight;
                this.context.viewport(0, 0, this.canvas.width, this.canvas.height);
            };
            Game.prototype.addLoader = function (loader) {
                this.loaders.push(loader);
                return loader;
            };
            Game.prototype.onMouseDown = function (button, screenPos, target) {
                if (this.canLockPointer && target === this.canvas) {
                    this.container.requestPointerLock();
                    return true;
                }
                return false;
            };
            Game.prototype.onMouseUp = function (button, screenPos, target) { return false; };
            Game.prototype.onMouseScroll = function (delta) { return false; };
            Game.prototype.onMouseMove = function (screenPos) { };
            Game.prototype.onMouseLook = function (delta) { };
            Game.prototype.onKeyDown = function (key) { return false; };
            Game.prototype.onKeyUp = function (key) { return false; };
            Game.prototype.onUpdateFrame = function (dt) { };
            Game.prototype.onRenderFrame = function (dt) { };
            Game.prototype.populateCommandBufferParameters = function (buf) {
                this.timeParams[0] = this.getLastUpdateTime() * 0.001;
                this.screenParams[0] = this.getWidth();
                this.screenParams[1] = this.getHeight();
                this.screenParams[2] = 1 / this.getWidth();
                this.screenParams[3] = 1 / this.getHeight();
                this.lightDirParams[0] = 0;
                this.lightDirParams[1] = 0;
                this.lightDirParams[2] = -1;
                buf.setParameter(Game.timeInfoParam, this.timeParams);
                buf.setParameter(Game.screenInfoParam, this.screenParams);
                buf.setParameter(Game.lightDirParam, this.lightDirParams);
            };
            return Game;
        }());
        Game.timeInfoParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float4);
        Game.screenInfoParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float4);
        Game.lightDirParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float3);
        WebGame.Game = Game;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var RenderResource = (function () {
            function RenderResource() {
                this.onLoadCallbacks = [];
                this.usages = [];
                this.dependents = [];
            }
            RenderResource.prototype.getLoadPriority = function () {
                return this.getVisibleUsageCount();
            };
            RenderResource.prototype.addDependent = function (dependent) {
                var index = this.dependents.indexOf(dependent);
                if (index !== -1)
                    return;
                this.dependents.push(dependent);
                this.addOnLoadCallback(function (res) { return dependent.onDependencyLoaded(res); });
            };
            RenderResource.prototype.addUsage = function (drawable) {
                var index = this.usages.indexOf(drawable);
                if (index !== -1)
                    return;
                this.usages.push(drawable);
            };
            RenderResource.prototype.removeUsage = function (drawable) {
                var index = this.usages.indexOf(drawable);
                if (index !== -1)
                    this.usages.splice(index, 1);
            };
            RenderResource.prototype.onDependencyLoaded = function (dependency) {
                if (this.isLoaded())
                    this.dispatchOnLoadCallbacks();
            };
            RenderResource.prototype.getVisibleUsageCount = function () {
                var count = 0;
                for (var i = 0, iEnd = this.usages.length; i < iEnd; ++i) {
                    count += this.usages[i].getIsVisible() ? 1 : 0;
                }
                for (var i = 0, iEnd = this.dependents.length; i < iEnd; ++i) {
                    count += this.dependents[i].getVisibleUsageCount();
                }
                return count;
            };
            RenderResource.prototype.addOnLoadCallback = function (callback) {
                if (this.isLoaded()) {
                    callback(this);
                }
                else {
                    this.onLoadCallbacks.push(callback);
                }
            };
            RenderResource.prototype.dispatchOnLoadCallbacks = function () {
                if (!this.isLoaded()) {
                    throw new Error("Resource attempted to dispatch onLoad callbacks without being loaded.");
                }
                for (var i = 0, iEnd = this.usages.length; i < iEnd; ++i) {
                    this.usages[i].invalidateDrawLists();
                }
                for (var i = 0, iEnd = this.onLoadCallbacks.length; i < iEnd; ++i) {
                    this.onLoadCallbacks[i](this);
                }
                this.onLoadCallbacks.splice(0, this.onLoadCallbacks.length);
            };
            return RenderResource;
        }());
        WebGame.RenderResource = RenderResource;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
/// <reference path="RenderResource.ts"/>
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var MaterialPropertyType;
        (function (MaterialPropertyType) {
            MaterialPropertyType[MaterialPropertyType["Boolean"] = 1] = "Boolean";
            MaterialPropertyType[MaterialPropertyType["Number"] = 2] = "Number";
            MaterialPropertyType[MaterialPropertyType["Color"] = 3] = "Color";
            MaterialPropertyType[MaterialPropertyType["TextureUrl"] = 4] = "TextureUrl";
            MaterialPropertyType[MaterialPropertyType["TextureIndex"] = 5] = "TextureIndex";
            MaterialPropertyType[MaterialPropertyType["TextureInfo"] = 6] = "TextureInfo";
        })(MaterialPropertyType = WebGame.MaterialPropertyType || (WebGame.MaterialPropertyType = {}));
        var Material = (function (_super) {
            __extends(Material, _super);
            function Material(program, isDynamic) {
                var _this = _super.call(this) || this;
                _this.id = Material.nextId++;
                _this.enabled = true;
                if (typeof program === "boolean") {
                    _this.isDynamic = program;
                }
                else {
                    _this.program = program;
                    _this.isDynamic = isDynamic !== undefined && isDynamic;
                }
                if (_this.program != null) {
                    _this.properties = _this.program.createMaterialProperties();
                }
                else {
                    _this.properties = {};
                }
                return _this;
            }
            Material.prototype.clone = function (isDynamic) {
                if (isDynamic === void 0) { isDynamic = false; }
                return new MaterialClone(this, isDynamic);
            };
            Material.prototype.isLoaded = function () {
                return this.program != null;
            };
            return Material;
        }(WebGame.RenderResource));
        Material.nextId = 0;
        WebGame.Material = Material;
        var MaterialClone = (function (_super) {
            __extends(MaterialClone, _super);
            function MaterialClone(base, isDynamic) {
                var _this = _super.call(this, isDynamic) || this;
                base.addDependent(_this);
                _this.program = base.program;
                _this.properties = {};
                if (base.program == null) {
                    base.addOnLoadCallback(function (mat) {
                        _this.program = mat.program;
                        var thisProps = _this.properties;
                        var thatProps = mat.properties;
                        for (var prop in thatProps) {
                            if (thatProps.hasOwnProperty(prop) && !thisProps.hasOwnProperty(prop)) {
                                thisProps[prop] = thatProps[prop];
                            }
                        }
                    });
                }
                return _this;
            }
            return MaterialClone;
        }(Material));
        WebGame.MaterialClone = MaterialClone;
        var MaterialLoadable = (function (_super) {
            __extends(MaterialLoadable, _super);
            function MaterialLoadable(game, url) {
                var _this = _super.call(this, false) || this;
                _this.loadProgress = 0;
                _this.game = game;
                _this.url = url;
                return _this;
            }
            MaterialLoadable.prototype.getLoadProgress = function () {
                return this.loadProgress;
            };
            MaterialLoadable.prototype.addPropertyFromInfo = function (info) {
                switch (info.type) {
                    case MaterialPropertyType.Boolean:
                    case MaterialPropertyType.Number: {
                        this.properties[info.name] = info.value;
                        break;
                    }
                    case MaterialPropertyType.Color: {
                        var vec = this.properties[info.name];
                        if (vec === undefined) {
                            vec = this.properties[info.name] = new Facepunch.Vector4();
                        }
                        var color = info.value;
                        vec.set(color.r, color.g, color.b, color.a);
                        break;
                    }
                    case MaterialPropertyType.TextureUrl: {
                        var texUrl = Facepunch.Http.getAbsUrl(info.value, this.url);
                        var tex = this.properties[info.name] = this.game.textureLoader.load(texUrl);
                        tex.addDependent(this);
                        break;
                    }
                    case MaterialPropertyType.TextureIndex: {
                        if (this.textureSource == null) {
                            console.warn("No texture source provided for material.");
                            break;
                        }
                        var tex = this.properties[info.name] = this.textureSource(info.value);
                        tex.addDependent(this);
                        break;
                    }
                    case MaterialPropertyType.TextureInfo: {
                        if (info.value == null) {
                            console.warn("Texture info missing for material.");
                            break;
                        }
                        var texInfo = info.value;
                        var tex = this.properties[info.name] = texInfo.path != null
                            ? this.game.textureLoader.load(texInfo.path)
                            : this.game.textureLoader.load("__dummy_" + MaterialLoadable.nextDummyId++);
                        tex.addDependent(this);
                        tex.loadFromInfo(texInfo);
                        break;
                    }
                }
            };
            MaterialLoadable.prototype.loadFromInfo = function (info, textureSource) {
                this.program = this.game.shaders.get(info.shader);
                this.textureSource = textureSource;
                this.loadProgress = 1;
                if (this.program != null) {
                    this.properties = this.program.createMaterialProperties();
                    for (var i = 0; i < info.properties.length; ++i) {
                        this.addPropertyFromInfo(info.properties[i]);
                    }
                }
                else {
                    this.properties = {};
                }
                if (this.program != null) {
                    this.dispatchOnLoadCallbacks();
                }
            };
            MaterialLoadable.prototype.loadNext = function (callback) {
                var _this = this;
                if (this.program != null) {
                    callback(false);
                    return;
                }
                Facepunch.Http.getJson(this.url, function (info) {
                    _this.loadFromInfo(info);
                    callback(false);
                }, function (error) {
                    callback(false);
                }, function (loaded, total) {
                    if (total !== undefined) {
                        _this.loadProgress = loaded / total;
                    }
                });
            };
            return MaterialLoadable;
        }(Material));
        MaterialLoadable.nextDummyId = 0;
        WebGame.MaterialLoadable = MaterialLoadable;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var MaterialLoader = (function (_super) {
            __extends(MaterialLoader, _super);
            function MaterialLoader(game) {
                var _this = _super.call(this) || this;
                _this.game = game;
                return _this;
            }
            MaterialLoader.prototype.onCreateItem = function (url) {
                return new WebGame.MaterialLoadable(this.game, url);
            };
            return MaterialLoader;
        }(Facepunch.Loader));
        WebGame.MaterialLoader = MaterialLoader;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var MeshGroup = (function () {
            function MeshGroup(context, attribs) {
                this.id = MeshGroup.nextId++;
                this.vertexDataLength = 0;
                this.indexDataLength = 0;
                this.subBufferOffset = 0;
                this.context = context;
                this.indexSize = context.getExtension("OES_element_index_uint") != null ? 4 : 2;
                this.vertexLength = 0;
                this.attribs = [];
                this.attribOffsets = [];
                for (var i = 0; i < attribs.length; ++i) {
                    this.attribs.push(attribs[i]);
                    this.attribOffsets.push(this.vertexLength * MeshGroup.vertexComponentSize);
                    this.vertexLength += attribs[i].size;
                }
                var maxVertsPerSubBuffer = this.indexSize === 4 ? 2147483648 : 65536;
                this.maxVertexDataLength = MeshGroup.maxIndexDataLength;
                this.maxSubBufferLength = this.vertexLength * maxVertsPerSubBuffer;
                this.vertexBuffer = context.createBuffer();
                this.indexBuffer = context.createBuffer();
            }
            MeshGroup.prototype.clear = function () {
                this.vertexDataLength = 0;
                this.indexDataLength = 0;
                this.subBufferOffset = 0;
            };
            MeshGroup.prototype.compareTo = function (other) {
                return this.id - other.id;
            };
            MeshGroup.prototype.canAddMeshData = function (data) {
                if (this.attribs.length !== data.attributes.length)
                    return false;
                for (var i = 0; i < this.attribs.length; ++i) {
                    if (WebGame.VertexAttribute.compare(this.attribs[i], data.attributes[i]) !== 0)
                        return false;
                }
                return this.vertexDataLength + data.vertices.length <= this.maxVertexDataLength
                    && this.indexDataLength + data.indices.length <= MeshGroup.maxIndexDataLength;
            };
            MeshGroup.prototype.ensureCapacity = function (array, length, ctor) {
                if (array != null && array.length >= length)
                    return array;
                var newLength = 2048;
                while (newLength < length)
                    newLength *= 2;
                var newArray = ctor(newLength);
                if (array != null)
                    newArray.set(array, 0);
                return newArray;
            };
            MeshGroup.prototype.updateBuffer = function (target, buffer, data, newData, oldData, offset) {
                var gl = this.context;
                gl.bindBuffer(target, buffer);
                if (data !== oldData) {
                    gl.bufferData(target, data.byteLength, gl.STATIC_DRAW);
                    gl.bufferSubData(target, 0, data);
                }
                else {
                    gl.bufferSubData(target, offset * data.BYTES_PER_ELEMENT, newData);
                }
            };
            MeshGroup.prototype.addVertexData = function (data, meshHandle) {
                var gl = this.context;
                // TODO: maybe validate MeshHandle if given
                var vertexOffset = this.vertexDataLength;
                var oldVertexData = this.vertexData;
                this.vertexData = this.ensureCapacity(this.vertexData, this.vertexDataLength + data.length, function (size) { return new Float32Array(size); });
                this.vertexData.set(data, vertexOffset);
                this.vertexDataLength += data.length;
                if (this.vertexDataLength - this.subBufferOffset > this.maxSubBufferLength) {
                    this.subBufferOffset = vertexOffset;
                }
                this.updateBuffer(gl.ARRAY_BUFFER, this.vertexBuffer, this.vertexData, data, oldVertexData, vertexOffset);
                return vertexOffset;
            };
            MeshGroup.prototype.addIndexData = function (data, meshHandle) {
                if (data.BYTES_PER_ELEMENT !== this.indexSize) {
                    throw new Error("Expected index data element size to be " + this.indexSize + ", not " + data.BYTES_PER_ELEMENT + ".");
                }
                // TODO: maybe validate MeshHandle if given
                var gl = this.context;
                var indexOffset = this.indexDataLength;
                var oldIndexData = this.indexData;
                this.indexData = this.ensureCapacity(this.indexData, this.indexDataLength + data.length, this.indexSize === 4 ? function (size) { return new Uint32Array(size); } : function (size) { return new Uint16Array(size); });
                this.indexData.set(data, indexOffset);
                this.indexDataLength += data.length;
                this.updateBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer, this.indexData, data, oldIndexData, indexOffset);
                if (meshHandle != null) {
                    meshHandle.indexCount += data.length;
                }
                return indexOffset;
            };
            MeshGroup.prototype.addMeshData = function (data, getMaterial, target) {
                if (!this.canAddMeshData(data)) {
                    throw new Error("Target MeshGroup is incompatible with the given IMeshData.");
                }
                var gl = this.context;
                var newVertices = new Float32Array(data.vertices);
                var newIndices = this.indexSize === 4 ? new Uint32Array(data.indices) : new Uint16Array(data.indices);
                var oldVertexData = this.vertexData;
                var oldIndexData = this.indexData;
                var vertexOffset = this.addVertexData(newVertices);
                var elementOffset = Math.round(vertexOffset / this.vertexLength) - this.subBufferOffset;
                if (elementOffset !== 0) {
                    for (var i = 0, iEnd = newIndices.length; i < iEnd; ++i) {
                        newIndices[i] += elementOffset;
                    }
                }
                var indexOffset = this.addIndexData(newIndices);
                for (var i = 0; i < data.elements.length; ++i) {
                    var element = data.elements[i];
                    var material = typeof element.material === "number"
                        ? getMaterial != null ? getMaterial(element.material) : null
                        : element.material;
                    target.push(new WebGame.MeshHandle(this, this.subBufferOffset, Facepunch.WebGl.decodeConst(element.mode), element.indexOffset + indexOffset, element.indexCount, material));
                }
            };
            MeshGroup.prototype.bufferBindBuffers = function (buf, program) {
                var gl = this.context;
                buf.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
                buf.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
                program.bufferEnableAttributes(buf, this.attribs);
            };
            MeshGroup.prototype.bufferAttribPointers = function (buf, program, vertexOffset) {
                var gl = this.context;
                var compSize = MeshGroup.vertexComponentSize;
                var stride = this.vertexLength * compSize;
                for (var i = 0, iEnd = this.attribs.length; i < iEnd; ++i) {
                    program.bufferAttribPointer(buf, this.attribs[i], stride, vertexOffset + this.attribOffsets[i]);
                }
            };
            MeshGroup.prototype.bufferRenderElements = function (buf, mode, offset, count) {
                var gl = this.context;
                buf.drawElements(mode, count, this.indexSize === 4 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, offset * this.indexSize, this.indexSize);
            };
            MeshGroup.prototype.dispose = function () {
                if (this.vertexBuffer !== undefined) {
                    this.context.deleteBuffer(this.vertexBuffer);
                    this.vertexBuffer = undefined;
                }
                if (this.indexBuffer !== undefined) {
                    this.context.deleteBuffer(this.indexBuffer);
                    this.indexBuffer = undefined;
                }
            };
            return MeshGroup;
        }());
        MeshGroup.maxIndexDataLength = 2147483648;
        MeshGroup.vertexComponentSize = 4;
        MeshGroup.nextId = 1;
        WebGame.MeshGroup = MeshGroup;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var DrawMode;
        (function (DrawMode) {
            DrawMode[DrawMode["Lines"] = WebGLRenderingContext.LINES] = "Lines";
            DrawMode[DrawMode["LineStrip"] = WebGLRenderingContext.LINE_STRIP] = "LineStrip";
            DrawMode[DrawMode["LineLoop"] = WebGLRenderingContext.LINE_LOOP] = "LineLoop";
            DrawMode[DrawMode["Triangles"] = WebGLRenderingContext.TRIANGLES] = "Triangles";
            DrawMode[DrawMode["TriangleStrip"] = WebGLRenderingContext.TRIANGLE_STRIP] = "TriangleStrip";
            DrawMode[DrawMode["TriangleFan"] = WebGLRenderingContext.TRIANGLE_FAN] = "TriangleFan";
        })(DrawMode = WebGame.DrawMode || (WebGame.DrawMode = {}));
        var MeshHandle = (function () {
            function MeshHandle(group, vertexOffset, drawMode, indexOffset, indexCount, material, transform) {
                this.group = group;
                this.vertexOffset = vertexOffset;
                this.drawMode = drawMode;
                this.indexOffset = indexOffset;
                this.indexCount = indexCount;
                this.material = material;
                this.transform = transform;
            }
            MeshHandle.prototype.clone = function (newTransform, newMaterial) {
                return new MeshHandle(this.group, this.vertexOffset, this.drawMode, this.indexOffset, this.indexCount, newMaterial || this.material, newTransform);
            };
            MeshHandle.prototype.compareTo = function (other) {
                var thisProg = this.program;
                var otherProg = other.program;
                var progComp = thisProg.compareTo(otherProg);
                if (progComp !== 0)
                    return progComp;
                if (this.transform !== other.transform) {
                    if (this.transform == null)
                        return -1;
                    if (other.transform == null)
                        return 1;
                    return this.transform.id - other.transform.id;
                }
                var matComp = thisProg.compareMaterials(this.material, other.material);
                if (matComp !== 0)
                    return matComp;
                var groupComp = this.group.compareTo(other.group);
                if (groupComp !== 0)
                    return groupComp;
                return this.indexOffset - other.indexOffset;
            };
            return MeshHandle;
        }());
        MeshHandle.undefinedHandle = new MeshHandle(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        WebGame.MeshHandle = MeshHandle;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var MeshManager = (function () {
            function MeshManager(game) {
                this.groups = [];
                this.context = game.context;
                this.game = game;
            }
            MeshManager.decompress = function (compressed) {
                var attribs = [];
                for (var i = 0, iEnd = compressed.attributes.length; i < iEnd; ++i) {
                    var attrib = compressed.attributes[i];
                    attribs.push(typeof attrib === "string" ? WebGame.VertexAttribute[attrib] : attrib);
                }
                return {
                    attributes: attribs,
                    elements: compressed.elements,
                    vertices: Facepunch.Utils.decompress(compressed.vertices),
                    indices: Facepunch.Utils.decompress(compressed.indices)
                };
            };
            MeshManager.createEmpty = function (attribs) {
                return {
                    attributes: attribs,
                    elements: [],
                    vertices: [],
                    indices: []
                };
            };
            MeshManager.copyElement = function (src, dst, index) {
                var srcElem = src.elements[index];
                if (srcElem.vertexOffset === undefined || srcElem.vertexCount === undefined) {
                    throw new Error("Can only copy elements with vertexOffset and vertexCount values.");
                }
                var srcVertLength = MeshManager.getVertexLength(src.attributes);
                var dstVertLength = MeshManager.getVertexLength(dst.attributes);
                var dstElem = {
                    mode: srcElem.mode,
                    material: srcElem.material,
                    indexOffset: dst.indices.length,
                    indexCount: srcElem.indexCount,
                    vertexOffset: dst.vertices.length,
                    vertexCount: Math.floor(srcElem.vertexCount / srcVertLength) * dstVertLength
                };
                dst.elements.push(dstElem);
                var srcIndices = src.indices;
                var dstIndices = dst.indices;
                var srcOffset = Math.floor(srcElem.vertexOffset / srcVertLength);
                var dstOffset = Math.floor(dstElem.vertexOffset / dstVertLength);
                for (var i = srcElem.indexOffset, iEnd = srcElem.indexOffset + srcElem.indexCount; i < iEnd; ++i) {
                    dstIndices.push(srcIndices[i] - srcOffset + dstOffset);
                }
                var srcVertices = src.vertices;
                var dstVertices = dst.vertices;
                dstVertices.length += dstElem.vertexCount;
                for (var _i = 0, _a = dst.attributes; _i < _a.length; _i++) {
                    var attrib = _a[_i];
                    var srcAttribOffset = MeshManager.getAttributeOffset(src.attributes, attrib);
                    var dstAttribOffset = MeshManager.getAttributeOffset(dst.attributes, attrib);
                    var existsInSrc = dstAttribOffset !== undefined;
                    var attribSize = attrib.size;
                    for (var i = dstAttribOffset + dstElem.vertexOffset, j = srcAttribOffset + srcElem.vertexOffset, iEnd = dstAttribOffset + dstElem.vertexOffset + dstElem.vertexCount; i < iEnd; i += dstVertLength, j += srcVertLength) {
                        for (var k = 0, kEnd = attribSize; k < kEnd; ++k) {
                            dstVertices[i + k] = existsInSrc ? srcVertices[j + k] : 0;
                        }
                    }
                }
                return dstElem;
            };
            MeshManager.clone = function (data) {
                return {
                    attributes: data.attributes,
                    elements: data.elements,
                    vertices: data.vertices.slice(),
                    indices: data.indices
                };
            };
            MeshManager.getAttributeOffset = function (attribs, attrib) {
                var length = 0;
                for (var i = 0, iEnd = attribs.length; i < iEnd; ++i) {
                    if (attrib.id === attribs[i].id)
                        return length;
                    length += attribs[i].size;
                }
                return undefined;
            };
            MeshManager.getVertexLength = function (attribs) {
                var length = 0;
                for (var i = 0, iEnd = attribs.length; i < iEnd; ++i) {
                    length += attribs[i].size;
                }
                return length;
            };
            MeshManager.transform3F = function (data, attrib, action) {
                if (attrib.size !== 3)
                    throw new Error("Expected the given attribute to be of size 3.");
                var attribOffset = MeshManager.getAttributeOffset(data.attributes, attrib);
                if (attribOffset === undefined)
                    return;
                var verts = data.vertices;
                var length = data.vertices.length;
                var vertLength = MeshManager.getVertexLength(data.attributes);
                var normalized = attrib.normalized;
                var vec = new Facepunch.Vector3();
                for (var i = attribOffset; i < length; i += vertLength) {
                    vec.set(verts[i], verts[i + 1], verts[i + 2]);
                    action(vec);
                    if (normalized)
                        vec.normalize();
                    verts[i] = vec.x;
                    verts[i + 1] = vec.y;
                    verts[i + 2] = vec.z;
                }
            };
            MeshManager.transform4F = function (data, attrib, action, defaultW) {
                if (defaultW === void 0) { defaultW = 1; }
                if (attrib.size !== 3 && attrib.size !== 4)
                    throw new Error("Expected the given attribute to be of size 3 or 4.");
                var attribOffset = MeshManager.getAttributeOffset(data.attributes, attrib);
                if (attribOffset === undefined)
                    return;
                var verts = data.vertices;
                var length = data.vertices.length;
                var vertLength = MeshManager.getVertexLength(data.attributes);
                var normalized = attrib.normalized;
                var vec = new Facepunch.Vector4();
                if (attrib.size === 3) {
                    for (var i = attribOffset; i < length; i += vertLength) {
                        vec.set(verts[i], verts[i + 1], verts[i + 2], defaultW);
                        action(vec);
                        if (normalized)
                            vec.normalizeXyz();
                        verts[i] = vec.x;
                        verts[i + 1] = vec.y;
                        verts[i + 2] = vec.z;
                    }
                }
                else if (attrib.size === 4) {
                    for (var i = attribOffset; i < length; i += vertLength) {
                        vec.set(verts[i], verts[i + 1], verts[i + 2], verts[i + 3]);
                        action(vec);
                        if (normalized)
                            vec.normalize();
                        verts[i] = vec.x;
                        verts[i + 1] = vec.y;
                        verts[i + 2] = vec.z;
                        verts[i + 3] = vec.w;
                    }
                }
            };
            MeshManager.prototype.addMeshData = function (data, getMaterial, target) {
                if (target == null) {
                    target = [];
                }
                for (var i = 0, iEnd = this.groups.length; i < iEnd; ++i) {
                    var group = this.groups[i];
                    if (group.canAddMeshData(data)) {
                        group.addMeshData(data, getMaterial, target);
                        return target;
                    }
                }
                var newGroup = new WebGame.MeshGroup(this.context, data.attributes);
                this.groups.push(newGroup);
                newGroup.addMeshData(data, getMaterial, target);
                return target;
            };
            MeshManager.prototype.getComposeFrameMeshHandle = function () {
                if (this.composeFrameHandle != null)
                    return this.composeFrameHandle;
                var meshData = {
                    attributes: [WebGame.VertexAttribute.uv],
                    vertices: [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0],
                    indices: [0, 1, 2, 0, 2, 3],
                    elements: [
                        {
                            mode: WebGame.DrawMode.Triangles,
                            material: this.game.shaders.createMaterial(Facepunch.WebGame.Shaders.ComposeFrame, false),
                            indexOffset: 0,
                            indexCount: 6
                        }
                    ]
                };
                this.composeFrameHandle = this.addMeshData(meshData)[0];
                this.composeFrameHandle.program = this.composeFrameHandle.material.program;
                return this.composeFrameHandle;
            };
            MeshManager.prototype.dispose = function () {
                for (var i = 0; i < this.groups.length; ++i) {
                    this.groups[i].dispose();
                }
                this.groups.splice(0, this.groups.length);
            };
            return MeshManager;
        }());
        WebGame.MeshManager = MeshManager;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
/// <reference path="RenderResource.ts"/>
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Model = (function (_super) {
            __extends(Model, _super);
            function Model(meshManager, materialLoader) {
                var _this = _super.call(this) || this;
                _this.meshManager = meshManager;
                _this.materialLoader = materialLoader;
                return _this;
            }
            return Model;
        }(WebGame.RenderResource));
        WebGame.Model = Model;
        var ModelLoadable = (function (_super) {
            __extends(ModelLoadable, _super);
            function ModelLoadable(game, url) {
                var _this = _super.call(this, game.meshes, game.materialLoader) || this;
                _this.loadProgress = 0;
                _this.url = url;
                return _this;
            }
            ModelLoadable.prototype.getLoadProgress = function () {
                return this.loadProgress;
            };
            ModelLoadable.prototype.isLoaded = function () {
                return this.meshData != null;
            };
            ModelLoadable.prototype.getMaterial = function (index) {
                return this.materials[index];
            };
            ModelLoadable.prototype.getMeshData = function () {
                return this.meshData;
            };
            ModelLoadable.prototype.getMeshHandles = function () {
                var _this = this;
                if (this.handles != null)
                    return this.handles;
                return this.handles = this.meshManager.addMeshData(this.meshData, function (i) { return _this.getMaterial(i); });
            };
            ModelLoadable.prototype.loadNext = function (callback) {
                var _this = this;
                if (this.isLoaded()) {
                    callback(false);
                    return;
                }
                Facepunch.Http.getJson(this.url, function (info) {
                    var materials = [];
                    for (var i = 0, iEnd = info.materials.length; i < iEnd; ++i) {
                        var matUrl = Facepunch.Http.getAbsUrl(info.materials[i], _this.url);
                        var mat = materials[i] = _this.materialLoader.load(matUrl);
                        mat.addDependent(_this);
                    }
                    _this.materials = materials;
                    _this.meshData = WebGame.MeshManager.decompress(info.meshData);
                    _this.loadProgress = 1;
                    _this.dispatchOnLoadCallbacks();
                    callback(false);
                }, function (error) {
                    callback(false);
                }, function (loaded, total) {
                    if (total !== undefined) {
                        _this.loadProgress = loaded / total;
                    }
                });
            };
            return ModelLoadable;
        }(Model));
        WebGame.ModelLoadable = ModelLoadable;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var ModelLoader = (function (_super) {
            __extends(ModelLoader, _super);
            function ModelLoader(game) {
                var _this = _super.call(this) || this;
                _this.game = game;
                return _this;
            }
            ModelLoader.prototype.onCreateItem = function (url) {
                return new WebGame.ModelLoadable(this.game, url);
            };
            return ModelLoader;
        }(Facepunch.Loader));
        WebGame.ModelLoader = ModelLoader;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var ShaderManager = (function () {
            function ShaderManager(context) {
                this.namedPrograms = {};
                this.ctorPrograms = [];
                this.context = context;
            }
            ShaderManager.prototype.resetUniformCache = function () {
                for (var i = 0, iEnd = this.ctorPrograms.length; i < iEnd; ++i) {
                    this.ctorPrograms[i].program.resetUniformCache();
                }
            };
            ShaderManager.prototype.getFromName = function (name) {
                var program = this.namedPrograms[name];
                if (program !== undefined)
                    return program;
                var nameParts = name.split(".");
                var target = window;
                for (var i = 0; i < nameParts.length; ++i) {
                    target = target[nameParts[i]];
                }
                var Type = target;
                if (Type === undefined) {
                    console.warn("Unknown shader name '" + name + "'.");
                    return this.namedPrograms[name] = null;
                }
                return this.namedPrograms[name] = this.getFromCtor(Type);
            };
            ShaderManager.prototype.getFromCtor = function (ctor) {
                for (var i = 0, iEnd = this.ctorPrograms.length; i < iEnd; ++i) {
                    var ctorProgram = this.ctorPrograms[i];
                    if (ctorProgram.ctor === ctor)
                        return ctorProgram.program;
                }
                var program = new ctor(this.context);
                this.ctorPrograms.push({ ctor: ctor, program: program });
                return program;
            };
            ShaderManager.prototype.get = function (nameOrCtor) {
                if (typeof nameOrCtor === "string") {
                    return this.getFromName(nameOrCtor);
                }
                else {
                    return this.getFromCtor(nameOrCtor);
                }
            };
            ShaderManager.prototype.createMaterial = function (ctor, isDynamic) {
                return new WebGame.Material(this.getFromCtor(ctor), isDynamic);
            };
            ShaderManager.prototype.dispose = function () {
                for (var name_4 in this.namedPrograms) {
                    if (this.namedPrograms.hasOwnProperty(name_4)) {
                        this.namedPrograms[name_4].dispose();
                    }
                }
                this.namedPrograms = {};
            };
            return ShaderManager;
        }());
        WebGame.ShaderManager = ShaderManager;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var ShaderProgram = (function () {
            function ShaderProgram(context) {
                this.id = ShaderProgram.nextId++;
                this.compiled = false;
                this.vertIncludes = [];
                this.fragIncludes = [];
                this.nextTextureUnit = 0;
                this.attribNames = {};
                this.attribIds = [];
                this.attribLocations = {};
                this.attribStates = {};
                this.uniforms = [];
                this.sortOrder = 0;
                this.context = context;
                this.name = this.constructor.name;
            }
            ShaderProgram.prototype.toString = function () {
                return this.name;
            };
            ShaderProgram.prototype.createMaterialProperties = function () {
                return {};
            };
            ShaderProgram.prototype.reserveNextTextureUnit = function () {
                return this.nextTextureUnit++;
            };
            ShaderProgram.prototype.resetUniformCache = function () {
                for (var i = 0; i < this.uniforms.length; ++i) {
                    this.uniforms[i].reset();
                }
            };
            ShaderProgram.prototype.dispose = function () {
                if (this.program !== undefined) {
                    this.context.deleteProgram(this.program);
                    this.program = undefined;
                }
            };
            ShaderProgram.prototype.compareTo = function (other) {
                if (other === this)
                    return 0;
                var orderCompare = this.sortOrder - other.sortOrder;
                if (orderCompare !== 0)
                    return orderCompare;
                return this.id - other.id;
            };
            ShaderProgram.prototype.compareMaterials = function (a, b) {
                return a.id - b.id;
            };
            ShaderProgram.prototype.getProgram = function () {
                if (this.program === undefined) {
                    return this.program = this.context.createProgram();
                }
                return this.program;
            };
            ShaderProgram.prototype.bufferAttribPointer = function (buf, attrib, stride, offset) {
                var loc = this.attribLocations[attrib.id];
                if (loc === undefined)
                    return;
                buf.vertexAttribPointer(loc, attrib.size, attrib.type, attrib.normalized, stride, offset);
            };
            ShaderProgram.prototype.isCompiled = function () {
                return this.compiled;
            };
            ShaderProgram.prototype.addAttribute = function (name, attrib) {
                this.attribNames[name] = attrib;
            };
            ShaderProgram.prototype.addUniform = function (name, ctor) {
                var uniform = new ctor(this, name);
                this.uniforms.push(uniform);
                return uniform;
            };
            ShaderProgram.formatSource = function (source) {
                var lines = source.replace(/\r\n/g, "\n").split("\n");
                while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
                    lines.splice(lines.length - 1, 1);
                }
                while (lines.length > 0 && lines[0].trim().length === 0) {
                    lines.splice(0, 1);
                }
                if (lines.length === 0)
                    return "";
                var indentLength = 0;
                var firstLine = lines[0];
                for (var i = 0, iEnd = firstLine.length; i < iEnd; ++i) {
                    if (firstLine.charAt(i) === " ") {
                        ++indentLength;
                    }
                    else
                        break;
                }
                for (var i = 0, iEnd = lines.length; i < iEnd; ++i) {
                    var line = lines[i];
                    if (line.substr(0, indentLength).trim().length === 0) {
                        lines[i] = line.substr(indentLength);
                    }
                }
                return lines.join("\r\n");
            };
            ShaderProgram.prototype.includeShaderSource = function (type, source) {
                source = ShaderProgram.formatSource(source);
                switch (type) {
                    case WebGLRenderingContext.VERTEX_SHADER:
                        this.vertIncludes.push(source);
                        break;
                    case WebGLRenderingContext.FRAGMENT_SHADER:
                        this.fragIncludes.push(source);
                        break;
                }
            };
            ShaderProgram.prototype.compileShader = function (type, source) {
                var gl = this.context;
                var shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    var error = "Shader compilation error:\n" + gl.getShaderInfoLog(shader);
                    gl.deleteShader(shader);
                    console.log(source);
                    throw error;
                }
                return shader;
            };
            ShaderProgram.prototype.findAttribLocation = function (name, attrib) {
                var gl = this.context;
                var loc = gl.getAttribLocation(this.program, name);
                if (loc === -1) {
                    console.warn("Unable to find attribute with name '" + name + "'.");
                    return;
                }
                this.attribIds.push(attrib.id);
                this.attribLocations[attrib.id] = loc;
                this.attribStates[attrib.id] = false;
            };
            ShaderProgram.prototype.compile = function () {
                if (this.isCompiled()) {
                    throw new Error("ShaderProgram is already compiled.");
                }
                var gl = this.context;
                var vertSource = this.vertIncludes.join("\r\n\r\n");
                var fragSource = this.fragIncludes.join("\r\n\r\n");
                var vert = this.compileShader(gl.VERTEX_SHADER, vertSource);
                var frag = this.compileShader(gl.FRAGMENT_SHADER, fragSource);
                var prog = this.getProgram();
                gl.attachShader(prog, vert);
                gl.attachShader(prog, frag);
                gl.linkProgram(prog);
                gl.deleteShader(vert);
                gl.deleteShader(frag);
                if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                    throw "Program linking error: " + gl.getProgramInfoLog(prog);
                }
                for (var name_5 in this.attribNames) {
                    if (this.attribNames.hasOwnProperty(name_5)) {
                        this.findAttribLocation(name_5, this.attribNames[name_5]);
                    }
                }
                this.compiled = true;
            };
            ShaderProgram.prototype.bufferEnableAttributes = function (buf, attribs) {
                for (var i = this.attribIds.length - 1; i >= 0; --i) {
                    var id = this.attribIds[i];
                    if (!this.attribStates[id])
                        continue;
                    var found = false;
                    if (attribs != null) {
                        for (var j = 0, jEnd = attribs.length; j < jEnd; ++j) {
                            if (attribs[j].id == id) {
                                found = true;
                                break;
                            }
                        }
                    }
                    if (!found) {
                        this.attribStates[id] = false;
                        buf.disableVertexAttribArray(this.attribLocations[id]);
                    }
                }
                if (attribs == null)
                    return;
                for (var i = 0, iEnd = attribs.length; i < iEnd; ++i) {
                    var attrib = attribs[i];
                    if (this.attribStates[attrib.id] === false) {
                        this.attribStates[attrib.id] = true;
                        buf.enableVertexAttribArray(this.attribLocations[attrib.id]);
                    }
                }
            };
            ShaderProgram.prototype.bufferDisableAttributes = function (buf) {
                this.bufferEnableAttributes(buf, null);
            };
            ShaderProgram.prototype.bufferSetup = function (buf) {
                buf.useProgram(this);
            };
            ShaderProgram.prototype.bufferModelMatrix = function (buf, value) { };
            ShaderProgram.prototype.bufferMaterial = function (buf, material) { };
            return ShaderProgram;
        }());
        ShaderProgram.nextId = 0;
        WebGame.ShaderProgram = ShaderProgram;
        var BaseMaterialProps = (function () {
            function BaseMaterialProps() {
                this.noCull = false;
            }
            return BaseMaterialProps;
        }());
        WebGame.BaseMaterialProps = BaseMaterialProps;
        var BaseShaderProgram = (function (_super) {
            __extends(BaseShaderProgram, _super);
            function BaseShaderProgram(context, ctor) {
                var _this = _super.call(this, context) || this;
                _this.materialPropsCtor = ctor;
                return _this;
            }
            BaseShaderProgram.prototype.createMaterialProperties = function () {
                return new this.materialPropsCtor();
            };
            BaseShaderProgram.prototype.bufferMaterial = function (buf, material) {
                var _this = this;
                var props = material.properties;
                if (material.isDynamic) {
                    buf.dynamicMaterial(function (buf) { return _this.bufferMaterialProps(buf, props); });
                }
                else {
                    this.bufferMaterialProps(buf, props);
                }
            };
            BaseShaderProgram.prototype.bufferMaterialProps = function (buf, props) {
                var gl = this.context;
                if (props.noCull) {
                    buf.disable(gl.CULL_FACE);
                }
                else {
                    buf.enable(gl.CULL_FACE);
                }
            };
            return BaseShaderProgram;
        }(ShaderProgram));
        WebGame.BaseShaderProgram = BaseShaderProgram;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Shaders;
        (function (Shaders) {
            var ComposeFrame = (function (_super) {
                __extends(ComposeFrame, _super);
                function ComposeFrame(context) {
                    var _this = _super.call(this, context) || this;
                    var gl = context;
                    _this.includeShaderSource(gl.VERTEX_SHADER, "\n                        attribute vec2 aScreenPos;\n\n                        varying vec2 vScreenPos;\n\n                        void main()\n                        {\n                            vScreenPos = aScreenPos * 0.5 + vec2(0.5, 0.5);\n                            gl_Position = vec4(aScreenPos, 0, 1);\n                        }");
                    _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                        #extension GL_EXT_frag_depth : enable\n\n                        precision mediump float;\n\n                        varying vec2 vScreenPos;\n\n                        uniform sampler2D uFrameColor;\n                        uniform sampler2D uFrameDepth;\n\n                        void main()\n                        {\n                            vec4 sample = texture2D(uFrameColor, vScreenPos);\n                            float depth = texture2D(uFrameDepth, vScreenPos).r;\n\n                            if (sample.a <= 0.004 || depth >= 1.0) discard;\n\n                            gl_FragColor = sample;\n                            gl_FragDepthEXT = depth;\n                        }");
                    _this.addAttribute("aScreenPos", WebGame.VertexAttribute.uv);
                    _this.frameColor = _this.addUniform("uFrameColor", WebGame.UniformSampler);
                    _this.frameDepth = _this.addUniform("uFrameDepth", WebGame.UniformSampler);
                    _this.compile();
                    return _this;
                }
                ComposeFrame.prototype.bufferSetup = function (buf) {
                    _super.prototype.bufferSetup.call(this, buf);
                    this.frameColor.bufferParameter(buf, WebGame.Camera.opaqueColorParam);
                    this.frameDepth.bufferParameter(buf, WebGame.Camera.opaqueDepthParam);
                    var gl = this.context;
                    buf.disable(gl.CULL_FACE);
                    buf.depthMask(true);
                };
                return ComposeFrame;
            }(WebGame.ShaderProgram));
            Shaders.ComposeFrame = ComposeFrame;
        })(Shaders = WebGame.Shaders || (WebGame.Shaders = {}));
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Shaders;
        (function (Shaders) {
            var DebugLineProps = (function (_super) {
                __extends(DebugLineProps, _super);
                function DebugLineProps() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.noCull = true;
                    _this.color0 = new Facepunch.Vector3(1.0, 1.0, 1.0);
                    _this.color1 = new Facepunch.Vector3(1.0, 1.0, 1.0);
                    _this.phase = 0;
                    _this.frequency = 1;
                    return _this;
                }
                return DebugLineProps;
            }(WebGame.BaseMaterialProps));
            Shaders.DebugLineProps = DebugLineProps;
            var DebugLine = (function (_super) {
                __extends(DebugLine, _super);
                function DebugLine(context) {
                    var _this = _super.call(this, context, DebugLineProps) || this;
                    var gl = context;
                    _this.includeShaderSource(gl.VERTEX_SHADER, "\n                        attribute vec3 aPosition;\n                        attribute float aProgress;\n\n                        varying float vProgress;\n\n                        uniform mat4 uProjection;\n                        uniform mat4 uView;\n                        uniform mat4 uModel;\n\n                        void main()\n                        {\n                            vProgress = aProgress;\n\n                            gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);\n                        }");
                    _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                        precision mediump float;\n\n                        varying float vProgress;\n\n                        uniform vec4 uTime;\n                        uniform vec3 uColor0;\n                        uniform vec3 uColor1;\n                        uniform float uPhase;\n                        uniform float uFrequency;\n\n                        void main()\n                        {\n                            gl_FragColor = vec4(mod(vProgress - uPhase - uTime.x * uFrequency, 2.0) < 1.0 ? uColor0 : uColor1, 1.0);\n                        }");
                    _this.addAttribute("aPosition", WebGame.VertexAttribute.position);
                    _this.addAttribute("aProgress", WebGame.VertexAttribute.alpha);
                    _this.projectionMatrix = _this.addUniform("uProjection", WebGame.UniformMatrix4);
                    _this.viewMatrix = _this.addUniform("uView", WebGame.UniformMatrix4);
                    _this.modelMatrix = _this.addUniform("uModel", WebGame.UniformMatrix4);
                    _this.time = _this.addUniform("uTime", WebGame.Uniform4F);
                    _this.color0 = _this.addUniform("uColor0", WebGame.Uniform3F);
                    _this.color1 = _this.addUniform("uColor1", WebGame.Uniform3F);
                    _this.phase = _this.addUniform("uPhase", WebGame.Uniform1F);
                    _this.frequency = _this.addUniform("uFrequency", WebGame.Uniform1F);
                    _this.compile();
                    return _this;
                }
                DebugLine.prototype.bufferSetup = function (buf) {
                    _super.prototype.bufferSetup.call(this, buf);
                    this.projectionMatrix.bufferParameter(buf, WebGame.Camera.projectionMatrixParam);
                    this.viewMatrix.bufferParameter(buf, WebGame.Camera.viewMatrixParam);
                    this.time.bufferParameter(buf, WebGame.Game.timeInfoParam);
                    var gl = this.context;
                    buf.enable(gl.DEPTH_TEST);
                    buf.depthMask(true);
                    buf.disable(gl.BLEND);
                };
                DebugLine.prototype.bufferModelMatrix = function (buf, value) {
                    _super.prototype.bufferModelMatrix.call(this, buf, value);
                    this.modelMatrix.bufferValue(buf, false, value);
                };
                DebugLine.prototype.bufferMaterialProps = function (buf, props) {
                    _super.prototype.bufferMaterialProps.call(this, buf, props);
                    var gl = this.context;
                    this.color0.bufferValue(buf, props.color0.x, props.color0.y, props.color0.z);
                    this.color1.bufferValue(buf, props.color1.x, props.color1.y, props.color1.z);
                    this.phase.bufferValue(buf, props.phase);
                    this.frequency.bufferValue(buf, props.frequency);
                };
                return DebugLine;
            }(WebGame.BaseShaderProgram));
            Shaders.DebugLine = DebugLine;
        })(Shaders = WebGame.Shaders || (WebGame.Shaders = {}));
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Shaders;
        (function (Shaders) {
            var Error = (function (_super) {
                __extends(Error, _super);
                function Error(context) {
                    var _this = _super.call(this, context) || this;
                    var gl = context;
                    _this.includeShaderSource(gl.VERTEX_SHADER, "\n                        attribute vec3 aPosition;\n                        attribute vec2 aTextureCoord;\n\n                        varying vec2 vTextureCoord;\n\n                        uniform mat4 uProjection;\n                        uniform mat4 uView;\n                        uniform mat4 uModel;\n\n                        void main()\n                        {\n                            gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);\n                            \n                            vTextureCoord = aTextureCoord;\n                        }");
                    _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                        precision mediump float;\n\n                        varying vec2 vTextureCoord;\n\n                        uniform sampler2D uErrorTexture;\n\n                        void main()\n                        {\n                            gl_FragColor = vec4(texture2D(uErrorTexture, vTextureCoord).rgb, 1.0);\n                        }");
                    _this.addAttribute("aPosition", WebGame.VertexAttribute.position);
                    _this.addAttribute("aTextureCoord", WebGame.VertexAttribute.uv);
                    _this.projectionMatrix = _this.addUniform("uProjection", WebGame.UniformMatrix4);
                    _this.viewMatrix = _this.addUniform("uView", WebGame.UniformMatrix4);
                    _this.modelMatrix = _this.addUniform("uModel", WebGame.UniformMatrix4);
                    _this.errorTexture = _this.addUniform("uErrorTexture", WebGame.UniformSampler);
                    _this.compile();
                    return _this;
                }
                Error.prototype.bufferSetup = function (buf) {
                    _super.prototype.bufferSetup.call(this, buf);
                    this.projectionMatrix.bufferParameter(buf, WebGame.Camera.projectionMatrixParam);
                    this.viewMatrix.bufferParameter(buf, WebGame.Camera.viewMatrixParam);
                    var gl = this.context;
                    this.errorTexture.bufferValue(buf, WebGame.TextureUtils.getErrorTexture(gl));
                    buf.enable(gl.CULL_FACE);
                    buf.enable(gl.DEPTH_TEST);
                    buf.depthMask(true);
                    buf.disable(gl.BLEND);
                };
                Error.prototype.bufferModelMatrix = function (buf, value) {
                    _super.prototype.bufferModelMatrix.call(this, buf, value);
                    this.modelMatrix.bufferValue(buf, false, value);
                };
                return Error;
            }(WebGame.ShaderProgram));
            Shaders.Error = Error;
        })(Shaders = WebGame.Shaders || (WebGame.Shaders = {}));
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Shaders;
        (function (Shaders) {
            var ModelBaseMaterialProps = (function (_super) {
                __extends(ModelBaseMaterialProps, _super);
                function ModelBaseMaterialProps() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.baseTexture = null;
                    _this.noFog = false;
                    _this.translucent = false;
                    _this.shadowCast = true;
                    return _this;
                }
                return ModelBaseMaterialProps;
            }(WebGame.BaseMaterialProps));
            Shaders.ModelBaseMaterialProps = ModelBaseMaterialProps;
            var ModelBase = (function (_super) {
                __extends(ModelBase, _super);
                function ModelBase(context, ctor) {
                    var _this = _super.call(this, context, ctor) || this;
                    var gl = context;
                    _this.includeShaderSource(gl.VERTEX_SHADER, "\n                        attribute vec3 aPosition;\n                        attribute vec2 aTextureCoord;\n\n                        varying float vDepth;\n                        varying vec2 vTextureCoord;\n\n                        uniform mat4 uProjection;\n                        uniform mat4 uView;\n                        uniform mat4 uModel;\n\n                        void Base_main()\n                        {\n                            vec4 viewPos = uView * uModel * vec4(aPosition, 1.0);\n\n                            gl_Position = uProjection * viewPos;\n                            \n                            vDepth = -viewPos.z;\n                            vTextureCoord = aTextureCoord;\n                        }");
                    _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                        precision mediump float;\n\n                        varying float vDepth;\n                        varying vec2 vTextureCoord;\n\n                        uniform sampler2D uBaseTexture;\n\n                        // x: time in seconds, y, z, w: unused\n                        uniform vec4 uTime;\n\n                        // x: near fog density, y: far plane fog density, z: min density, w: max density\n                        uniform vec4 uFogParams;\n                        uniform vec3 uFogColor;\n                        uniform float uNoFog;\n\n                        vec3 ApplyFog(vec3 inColor)\n                        {\n                            if (uNoFog > 0.5) return inColor;\n\n                            float fogDensity = uFogParams.x + uFogParams.y * vDepth;\n\n                            fogDensity = min(max(fogDensity, uFogParams.z), uFogParams.w);\n\n                            return mix(inColor, uFogColor, fogDensity);\n                        }");
                    _this.addAttribute("aPosition", WebGame.VertexAttribute.position);
                    _this.addAttribute("aTextureCoord", WebGame.VertexAttribute.uv);
                    _this.projectionMatrix = _this.addUniform("uProjection", WebGame.UniformMatrix4);
                    _this.viewMatrix = _this.addUniform("uView", WebGame.UniformMatrix4);
                    _this.modelMatrix = _this.addUniform("uModel", WebGame.UniformMatrix4);
                    _this.baseTexture = _this.addUniform("uBaseTexture", WebGame.UniformSampler);
                    _this.baseTexture.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                    _this.time = _this.addUniform("uTime", WebGame.Uniform4F);
                    _this.fogParams = _this.addUniform("uFogParams", WebGame.Uniform4F);
                    _this.fogColor = _this.addUniform("uFogColor", WebGame.Uniform3F);
                    _this.noFog = _this.addUniform("uNoFog", WebGame.Uniform1F);
                    return _this;
                }
                ModelBase.prototype.bufferSetup = function (buf) {
                    _super.prototype.bufferSetup.call(this, buf);
                    this.projectionMatrix.bufferParameter(buf, WebGame.Camera.projectionMatrixParam);
                    this.viewMatrix.bufferParameter(buf, WebGame.Camera.viewMatrixParam);
                    this.time.bufferParameter(buf, WebGame.Game.timeInfoParam);
                    this.fogParams.bufferParameter(buf, WebGame.Fog.fogInfoParam);
                    this.fogColor.bufferParameter(buf, WebGame.Fog.fogColorParam);
                };
                ModelBase.prototype.bufferModelMatrix = function (buf, value) {
                    _super.prototype.bufferModelMatrix.call(this, buf, value);
                    this.modelMatrix.bufferValue(buf, false, value);
                };
                ModelBase.prototype.bufferMaterialProps = function (buf, props) {
                    _super.prototype.bufferMaterialProps.call(this, buf, props);
                    this.baseTexture.bufferValue(buf, props.baseTexture);
                    this.noFog.bufferValue(buf, props.noFog ? 1 : 0);
                    var gl = this.context;
                    buf.enable(gl.DEPTH_TEST);
                    if (props.translucent) {
                        buf.depthMask(false);
                        buf.enable(gl.BLEND);
                        buf.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                    }
                    else {
                        buf.depthMask(true);
                        buf.disable(gl.BLEND);
                    }
                };
                return ModelBase;
            }(WebGame.BaseShaderProgram));
            Shaders.ModelBase = ModelBase;
        })(Shaders = WebGame.Shaders || (WebGame.Shaders = {}));
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Shaders;
        (function (Shaders) {
            var VertexLitGenericMaterialProps = (function (_super) {
                __extends(VertexLitGenericMaterialProps, _super);
                function VertexLitGenericMaterialProps() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.alpha = 1.0;
                    _this.alphaTest = false;
                    return _this;
                }
                return VertexLitGenericMaterialProps;
            }(Shaders.ModelBaseMaterialProps));
            Shaders.VertexLitGenericMaterialProps = VertexLitGenericMaterialProps;
            var VertexLitGeneric = (function (_super) {
                __extends(VertexLitGeneric, _super);
                function VertexLitGeneric(context) {
                    var _this = _super.call(this, context, VertexLitGenericMaterialProps) || this;
                    var gl = context;
                    _this.addAttribute("aColor", WebGame.VertexAttribute.rgb);
                    _this.includeShaderSource(gl.VERTEX_SHADER, "\n                        attribute vec3 aColor;\n\n                        varying vec3 vColor;\n\n                        void main()\n                        {\n                            Base_main();\n                            vColor = aColor * (1.0 / 255.0);\n                        }");
                    _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                        varying vec3 vColor;\n\n                        uniform float uAlpha;\n\n                        uniform float uAlphaTest;\n                        uniform float uTranslucent;\n\n                        void main()\n                        {\n                            vec4 texSample = texture2D(uBaseTexture, vTextureCoord);\n                            if (texSample.a < uAlphaTest - 0.5) discard;\n\n                            vec3 color = ApplyFog(texSample.rgb * vColor);\n\n                            gl_FragColor = vec4(color, mix(1.0, texSample.a, uTranslucent) * uAlpha);\n                        }");
                    _this.alpha = _this.addUniform("uAlpha", WebGame.Uniform1F);
                    _this.alphaTest = _this.addUniform("uAlphaTest", WebGame.Uniform1F);
                    _this.translucent = _this.addUniform("uTranslucent", WebGame.Uniform1F);
                    _this.compile();
                    return _this;
                }
                VertexLitGeneric.prototype.bufferMaterialProps = function (buf, props) {
                    _super.prototype.bufferMaterialProps.call(this, buf, props);
                    this.alpha.bufferValue(buf, props.alpha);
                    this.alphaTest.bufferValue(buf, props.alphaTest ? 1 : 0);
                    this.translucent.bufferValue(buf, props.translucent ? 1 : 0);
                };
                return VertexLitGeneric;
            }(Shaders.ModelBase));
            Shaders.VertexLitGeneric = VertexLitGeneric;
        })(Shaders = WebGame.Shaders || (WebGame.Shaders = {}));
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var ShadowCamera = (function (_super) {
            __extends(ShadowCamera, _super);
            function ShadowCamera(game, targetCamera) {
                var _this = _super.call(this, game, 1, 1, 0, 1) || this;
                _this.game = game;
                _this.targetCamera = targetCamera;
                return _this;
            }
            ShadowCamera.prototype.addToFrustumBounds = function (vec, bounds) {
                vec.applyMatrix4(this.targetCamera.getMatrix());
                vec.applyMatrix4(this.getInverseMatrix());
                bounds.addPoint(vec);
            };
            ShadowCamera.prototype.getFrustumBounds = function (near, far, bounds) {
                bounds.min.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
                bounds.max.set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
                var perspCamera = this.targetCamera;
                if (perspCamera.getFov === undefined) {
                    throw "Not implement for non-perspective cameras";
                }
                var yScale = Math.tan(perspCamera.getFov() * 0.5);
                var xScale = yScale * perspCamera.getAspect();
                var xNear = xScale * near;
                var yNear = yScale * near;
                var xFar = xScale * far;
                var yFar = yScale * far;
                var vec = ShadowCamera.getFrustumBounds_vec;
                this.addToFrustumBounds(vec.set(xNear, yNear, near, 1), bounds);
                this.addToFrustumBounds(vec.set(-xNear, yNear, near, 1), bounds);
                this.addToFrustumBounds(vec.set(xNear, -yNear, near, 1), bounds);
                this.addToFrustumBounds(vec.set(-xNear, -yNear, near, 1), bounds);
                this.addToFrustumBounds(vec.set(xFar, yFar, far, 1), bounds);
                this.addToFrustumBounds(vec.set(-xFar, yFar, far, 1), bounds);
                this.addToFrustumBounds(vec.set(xFar, -yFar, far, 1), bounds);
                this.addToFrustumBounds(vec.set(-xFar, -yFar, far, 1), bounds);
            };
            ShadowCamera.prototype.bufferCascadeBegin = function (lightRotation, near, far) {
                var bounds = ShadowCamera.renderShadows_bounds;
                var vec1 = ShadowCamera.renderShadows_vec1;
                var vec2 = ShadowCamera.renderShadows_vec2;
                vec1.set(0, 0, 1);
                this.targetCamera.applyRotationTo(vec1);
                vec1.multiplyScalar((near + far) * 0.5);
                this.targetCamera.getPosition(vec2);
                vec1.add(vec2);
                this.setRotation(lightRotation);
                this.setPosition(vec1);
                this.getFrustumBounds(near, far, bounds);
                var xDiff = bounds.max.x - bounds.min.x;
                var yDiff = bounds.max.y - bounds.min.y;
                var zDiff = bounds.max.z - bounds.min.z;
                // TODO: Reposition based on bounds
                this.setSize(zDiff);
                this.setAspect(xDiff / zDiff);
            };
            ShadowCamera.prototype.bufferCascadeEnd = function () {
            };
            return ShadowCamera;
        }(WebGame.OrthographicCamera));
        ShadowCamera.getFrustumBounds_vec = new Facepunch.Vector4();
        ShadowCamera.renderShadows_bounds = new Facepunch.Box3();
        ShadowCamera.renderShadows_vec1 = new Facepunch.Vector3();
        ShadowCamera.renderShadows_vec2 = new Facepunch.Vector3();
        WebGame.ShadowCamera = ShadowCamera;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
/// <reference path="DrawableEntity.ts"/>
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var StaticProp = (function (_super) {
            __extends(StaticProp, _super);
            function StaticProp() {
                return _super.call(this, true) || this;
            }
            StaticProp.prototype.setColorTint = function (color) {
                if (this.tint != null)
                    this.tint.copy(color);
                else
                    this.tint = new Facepunch.Vector3().copy(color);
            };
            StaticProp.prototype.setModel = function (model) {
                var _this = this;
                if (this.model === model)
                    return;
                if (this.model != null) {
                    this.model.removeUsage(this);
                }
                this.model = model;
                if (model == null) {
                    this.drawable.clearMeshHandles();
                    return;
                }
                this.model.addUsage(this);
                model.addOnLoadCallback(function (mdl) { return _this.onModelLoaded(mdl); });
            };
            StaticProp.prototype.onModelLoaded = function (model) {
                var _this = this;
                if (model !== this.model)
                    return;
                this.drawable.clearMeshHandles();
                var meshData = WebGame.MeshManager.clone(model.getMeshData());
                var transform = this.getMatrix();
                WebGame.MeshManager.transform4F(meshData, WebGame.VertexAttribute.position, function (pos) { return pos.applyMatrix4(transform); }, 1);
                WebGame.MeshManager.transform4F(meshData, WebGame.VertexAttribute.normal, function (norm) { return norm.applyMatrix4(transform); }, 0);
                if (this.tint != null) {
                    WebGame.MeshManager.transform3F(meshData, WebGame.VertexAttribute.rgb, function (rgb) { return rgb.multiply(_this.tint); });
                }
                this.drawable.addMeshHandles(model.meshManager.addMeshData(meshData, function (index) { return model.getMaterial(index); }));
            };
            StaticProp.prototype.getModel = function () {
                return this.model;
            };
            return StaticProp;
        }(WebGame.DrawableEntity));
        WebGame.StaticProp = StaticProp;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
/// <reference path="RenderResource.ts"/>
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Texture = (function (_super) {
            __extends(Texture, _super);
            function Texture() {
                var _this = _super.call(this) || this;
                _this.id = Texture.nextId++;
                return _this;
            }
            Texture.prototype.isLoaded = function () {
                return this.getHandle() !== undefined;
            };
            Texture.prototype.getFrameCount = function () {
                return 1;
            };
            Texture.prototype.dispose = function () { };
            return Texture;
        }(WebGame.RenderResource));
        Texture.nextId = 1;
        WebGame.Texture = Texture;
        var TextureFormat;
        (function (TextureFormat) {
            TextureFormat[TextureFormat["Alpha"] = WebGLRenderingContext.ALPHA] = "Alpha";
            TextureFormat[TextureFormat["Rgb"] = WebGLRenderingContext.RGB] = "Rgb";
            TextureFormat[TextureFormat["Rgba"] = WebGLRenderingContext.RGBA] = "Rgba";
            TextureFormat[TextureFormat["DepthComponent"] = WebGLRenderingContext.DEPTH_COMPONENT] = "DepthComponent";
            TextureFormat[TextureFormat["Luminance"] = WebGLRenderingContext.LUMINANCE] = "Luminance";
        })(TextureFormat = WebGame.TextureFormat || (WebGame.TextureFormat = {}));
        var TextureDataType;
        (function (TextureDataType) {
            TextureDataType[TextureDataType["Uint8"] = WebGLRenderingContext.UNSIGNED_BYTE] = "Uint8";
            TextureDataType[TextureDataType["Uint16"] = WebGLRenderingContext.UNSIGNED_SHORT] = "Uint16";
            TextureDataType[TextureDataType["Uint32"] = WebGLRenderingContext.UNSIGNED_INT] = "Uint32";
            TextureDataType[TextureDataType["Float"] = WebGLRenderingContext.FLOAT] = "Float";
        })(TextureDataType = WebGame.TextureDataType || (WebGame.TextureDataType = {}));
        var TextureTarget;
        (function (TextureTarget) {
            TextureTarget[TextureTarget["Texture2D"] = WebGLRenderingContext.TEXTURE_2D] = "Texture2D";
            TextureTarget[TextureTarget["TextureCubeMap"] = WebGLRenderingContext.TEXTURE_CUBE_MAP] = "TextureCubeMap";
        })(TextureTarget = WebGame.TextureTarget || (WebGame.TextureTarget = {}));
        var TextureWrapMode;
        (function (TextureWrapMode) {
            TextureWrapMode[TextureWrapMode["ClampToEdge"] = WebGLRenderingContext.CLAMP_TO_EDGE] = "ClampToEdge";
            TextureWrapMode[TextureWrapMode["Repeat"] = WebGLRenderingContext.REPEAT] = "Repeat";
            TextureWrapMode[TextureWrapMode["MirroredRepeat"] = WebGLRenderingContext.MIRRORED_REPEAT] = "MirroredRepeat";
        })(TextureWrapMode = WebGame.TextureWrapMode || (WebGame.TextureWrapMode = {}));
        var TextureMinFilter;
        (function (TextureMinFilter) {
            TextureMinFilter[TextureMinFilter["Nearest"] = WebGLRenderingContext.NEAREST] = "Nearest";
            TextureMinFilter[TextureMinFilter["Linear"] = WebGLRenderingContext.LINEAR] = "Linear";
            TextureMinFilter[TextureMinFilter["NearestMipmapNearest"] = WebGLRenderingContext.NEAREST_MIPMAP_NEAREST] = "NearestMipmapNearest";
            TextureMinFilter[TextureMinFilter["LinearMipmapNearest"] = WebGLRenderingContext.LINEAR_MIPMAP_NEAREST] = "LinearMipmapNearest";
            TextureMinFilter[TextureMinFilter["NearestMipmapLinear"] = WebGLRenderingContext.NEAREST_MIPMAP_LINEAR] = "NearestMipmapLinear";
            TextureMinFilter[TextureMinFilter["LinearMipmapLinear"] = WebGLRenderingContext.LINEAR_MIPMAP_LINEAR] = "LinearMipmapLinear";
        })(TextureMinFilter = WebGame.TextureMinFilter || (WebGame.TextureMinFilter = {}));
        var TextureMagFilter;
        (function (TextureMagFilter) {
            TextureMagFilter[TextureMagFilter["Nearest"] = TextureMinFilter.Nearest] = "Nearest";
            TextureMagFilter[TextureMagFilter["Linear"] = TextureMinFilter.Linear] = "Linear";
        })(TextureMagFilter = WebGame.TextureMagFilter || (WebGame.TextureMagFilter = {}));
        var TextureParameterType;
        (function (TextureParameterType) {
            TextureParameterType[TextureParameterType["Integer"] = WebGLRenderingContext.INT] = "Integer";
            TextureParameterType[TextureParameterType["Float"] = WebGLRenderingContext.FLOAT] = "Float";
        })(TextureParameterType = WebGame.TextureParameterType || (WebGame.TextureParameterType = {}));
        var TextureParameter;
        (function (TextureParameter) {
            TextureParameter[TextureParameter["WrapS"] = WebGLRenderingContext.TEXTURE_WRAP_S] = "WrapS";
            TextureParameter[TextureParameter["WrapT"] = WebGLRenderingContext.TEXTURE_WRAP_T] = "WrapT";
            TextureParameter[TextureParameter["MinFilter"] = WebGLRenderingContext.TEXTURE_MIN_FILTER] = "MinFilter";
            TextureParameter[TextureParameter["MagFilter"] = WebGLRenderingContext.TEXTURE_MAG_FILTER] = "MagFilter";
        })(TextureParameter = WebGame.TextureParameter || (WebGame.TextureParameter = {}));
        var RenderTexture = (function (_super) {
            __extends(RenderTexture, _super);
            function RenderTexture(context, target, format, type, width, height) {
                var _this = _super.call(this) || this;
                _this.context = context;
                _this.target = target;
                _this.format = format;
                _this.type = type;
                _this.handle = context.createTexture();
                _this.setWrapMode(TextureWrapMode.ClampToEdge);
                _this.setFilter(TextureMinFilter.Linear, TextureMagFilter.Nearest);
                _this.resize(width, height);
                return _this;
            }
            RenderTexture.prototype.hasMipLevel = function (level) {
                return level === 0;
            };
            RenderTexture.prototype.getWidth = function (level) {
                return level === 0 ? this.width : undefined;
            };
            RenderTexture.prototype.getHeight = function (level) {
                return level === 0 ? this.height : undefined;
            };
            RenderTexture.prototype.setWrapMode = function (wrapS, wrapT) {
                if (wrapT === undefined)
                    wrapT = wrapS;
                var gl = this.context;
                gl.bindTexture(this.target, this.handle);
                gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, wrapS);
                gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, wrapT);
                gl.bindTexture(this.target, null);
            };
            RenderTexture.prototype.setFilter = function (minFilter, magFilter) {
                var gl = this.context;
                gl.bindTexture(this.target, this.handle);
                gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, minFilter);
                gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, magFilter);
                gl.bindTexture(this.target, null);
            };
            RenderTexture.prototype.getTarget = function () {
                return this.target;
            };
            RenderTexture.prototype.getHandle = function (frame) {
                return this.handle;
            };
            RenderTexture.prototype.resize = function (width, height) {
                if (this.width === width && this.height === height)
                    return;
                if (width === undefined || height === undefined) {
                    throw new Error("Width or height value is undefined.");
                }
                var gl = this.context;
                this.width = width;
                this.height = height;
                gl.bindTexture(this.target, this.handle);
                gl.texImage2D(this.target, 0, this.format, width, height, 0, this.format, this.type, null);
                gl.bindTexture(this.target, null);
                this.onResize(width, height);
            };
            RenderTexture.prototype.onResize = function (width, height) { };
            RenderTexture.prototype.dispose = function () {
                if (this.handle === undefined)
                    return;
                this.context.deleteTexture(this.handle);
                this.handle = undefined;
            };
            return RenderTexture;
        }(Texture));
        WebGame.RenderTexture = RenderTexture;
        var PixelData = (function () {
            function PixelData(format, width, height, ctor) {
                this.width = width;
                this.height = height;
                switch (format) {
                    case TextureFormat.Alpha:
                    case TextureFormat.Luminance:
                    case TextureFormat.DepthComponent:
                        this.channels = 1;
                        break;
                    case TextureFormat.Rgb:
                        this.channels = 3;
                        break;
                    case TextureFormat.Rgba:
                        this.channels = 4;
                        break;
                    default:
                        throw new Error("Texture format not implemented.");
                }
                this.values = new ctor(this.channels * width * height);
            }
            return PixelData;
        }());
        WebGame.PixelData = PixelData;
        var ProceduralTexture2D = (function (_super) {
            __extends(ProceduralTexture2D, _super);
            function ProceduralTexture2D(context, width, height, format, type) {
                var _this = _super.call(this, context, TextureTarget.Texture2D, format === undefined ? TextureFormat.Rgba : format, type === undefined ? TextureDataType.Uint8 : type, width, height) || this;
                _this.setWrapMode(TextureWrapMode.Repeat);
                return _this;
            }
            ProceduralTexture2D.prototype.setImage = function (image) {
                this.resize(image.width, image.height);
                var gl = this.context;
                gl.bindTexture(this.target, this.getHandle());
                gl.texSubImage2D(this.target, 0, 0, 0, this.format, this.type, image);
                gl.bindTexture(this.target, null);
            };
            ProceduralTexture2D.prototype.copyFrom = function (tex) {
                if (!tex.hasMipLevel(0))
                    throw new Error("The given texture to copy isn't fully loaded.");
                var gl = this.context;
                var buf = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.getHandle(), 0);
                if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    gl.deleteFramebuffer(buf);
                    throw new Error("Failed to copy texture (unable to create frame buffer).");
                }
                if (tex !== this) {
                    this.resize(tex.getWidth(0), tex.getHeight(0));
                }
                gl.readPixels(0, 0, this.pixels.width, this.pixels.height, this.format, this.type, this.pixels.values);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.deleteFramebuffer(buf);
            };
            ProceduralTexture2D.prototype.toString = function () {
                return this.name != null ? this.name : "[ProceduralTexture2D " + this.pixels.width + "x" + this.pixels.height + "]";
            };
            ProceduralTexture2D.prototype.setPixelRgb = function (x, y, rgb) {
                var buffer = ProceduralTexture2D.channelBuffer;
                buffer[0] = (rgb >> 16) & 0xff;
                buffer[1] = (rgb >> 8) & 0xff;
                buffer[2] = rgb & 0xff;
                buffer[3] = 0xff;
                this.setPixel(x, y, buffer);
            };
            ProceduralTexture2D.prototype.setPixelRgba = function (x, y, rgba) {
                var buffer = ProceduralTexture2D.channelBuffer;
                buffer[0] = (rgba >> 24) & 0xff;
                buffer[1] = (rgba >> 16) & 0xff;
                buffer[2] = (rgba >> 8) & 0xff;
                buffer[3] = rgba & 0xff;
                this.setPixel(x, y, buffer);
            };
            ProceduralTexture2D.prototype.setPixelColor = function (x, y, color) {
                var buffer = ProceduralTexture2D.channelBuffer;
                buffer[0] = color.r;
                buffer[1] = color.g;
                buffer[2] = color.b;
                buffer[3] = color.a === undefined ? 0xff : color.a;
                this.setPixel(x, y, buffer);
            };
            ProceduralTexture2D.prototype.setPixel = function (x, y, channels) {
                var pixels = this.pixels;
                var index = (x + y * pixels.width) * pixels.channels;
                var channelCount = pixels.channels < channels.length
                    ? pixels.channels : channels.length;
                for (var i = 0; i < channelCount; ++i) {
                    pixels.values[index + i] = channels[i];
                }
            };
            ProceduralTexture2D.prototype.getPixelColor = function (x, y, target) {
                var buffer = ProceduralTexture2D.channelBuffer;
                buffer[0] = buffer[1] = buffer[2] = 0;
                buffer[3] = 0xff;
                this.getPixel(x, y, buffer, 0);
                if (target == null)
                    return { r: buffer[0], g: buffer[1], b: buffer[2], a: buffer[3] };
                target.r = buffer[0];
                target.g = buffer[1];
                target.b = buffer[2];
                target.a = buffer[3];
                return target;
            };
            ProceduralTexture2D.prototype.getPixel = function (x, y, target, dstIndex) {
                var pixels = this.pixels;
                if (target == null)
                    target = new Array(pixels.channels);
                if (dstIndex === undefined)
                    dstIndex = 0;
                var index = (x + y * pixels.width) * pixels.channels;
                var channelCount = pixels.channels < target.length
                    ? pixels.channels : target.length;
                for (var i = 0; i < channelCount; ++i) {
                    target[dstIndex + i] = pixels.values[index + i];
                }
                return target;
            };
            ProceduralTexture2D.prototype.setPixels = function (x, y, width, height, values) {
                var pixels = this.pixels;
                if (x < 0 || x + width > pixels.width || y < 0 || y + height > pixels.height) {
                    throw new Error("Image region out of bounds.");
                }
                var imageValues = pixels.values;
                var channels = pixels.channels;
                if (values.length < width * height * channels) {
                    throw new Error("Expected at least " + width * height * channels + " values.");
                }
                var rowLength = pixels.width * channels;
                var scanLength = width * channels;
                var startIndex = (x + y * pixels.width) * channels;
                var i = 0;
                for (var row = y, rowEnd = y + height; row < rowEnd; ++row, startIndex += rowLength) {
                    for (var index = startIndex, indexEnd = index + scanLength; index < indexEnd; index += channels) {
                        imageValues[index] = values[i++];
                        imageValues[index + 1] = values[i++];
                        imageValues[index + 2] = values[i++];
                        imageValues[index + 3] = values[i++];
                    }
                }
            };
            ProceduralTexture2D.prototype.writePixels = function () {
                var gl = this.context;
                gl.bindTexture(this.target, this.getHandle());
                gl.texImage2D(this.target, 0, this.format, this.pixels.width, this.pixels.height, 0, this.format, this.type, this.pixels.values);
                gl.bindTexture(this.target, null);
            };
            ProceduralTexture2D.prototype.readPixels = function (frameBuffer) {
                if (frameBuffer == null) {
                    this.copyFrom(this);
                }
                else {
                    var tex = frameBuffer.getColorTexture();
                    var width = tex.getWidth(0);
                    var height = tex.getHeight(0);
                    if (tex !== this)
                        this.resize(width, height);
                    var gl = this.context;
                    frameBuffer.begin();
                    gl.readPixels(0, 0, width, height, this.format, this.type, this.pixels.values);
                    frameBuffer.end();
                }
            };
            ProceduralTexture2D.prototype.onResize = function (width, height) {
                switch (this.type) {
                    case TextureDataType.Uint8:
                        this.pixels = new PixelData(this.format, width, height, Uint8Array);
                        break;
                    case TextureDataType.Uint16:
                        this.pixels = new PixelData(this.format, width, height, Uint16Array);
                        break;
                    case TextureDataType.Uint32:
                        this.pixels = new PixelData(this.format, width, height, Uint32Array);
                        break;
                    case TextureDataType.Float:
                        this.pixels = new PixelData(this.format, width, height, Float32Array);
                        break;
                    default:
                        throw new Error("Texture data type not implemented.");
                }
            };
            return ProceduralTexture2D;
        }(RenderTexture));
        ProceduralTexture2D.channelBuffer = [0, 0, 0, 0];
        WebGame.ProceduralTexture2D = ProceduralTexture2D;
        var TextureUtils = (function () {
            function TextureUtils() {
            }
            TextureUtils.getWhiteTexture = function (context) {
                if (this.whiteTexture != null)
                    return this.whiteTexture;
                this.whiteTexture = new ProceduralTexture2D(context, 1, 1);
                this.whiteTexture.name = "WHITE";
                this.whiteTexture.setPixelRgb(0, 0, 0xffffff);
                this.whiteTexture.writePixels();
                return this.whiteTexture;
            };
            TextureUtils.getBlackTexture = function (context) {
                if (this.blackTexture != null)
                    return this.blackTexture;
                this.blackTexture = new ProceduralTexture2D(context, 1, 1);
                this.blackTexture.name = "BLACK";
                this.blackTexture.setPixelRgb(0, 0, 0x000000);
                this.blackTexture.writePixels();
                return this.blackTexture;
            };
            TextureUtils.getTranslucentTexture = function (context) {
                if (this.translucentTexture != null)
                    return this.translucentTexture;
                this.translucentTexture = new ProceduralTexture2D(context, 1, 1);
                this.translucentTexture.name = "TRANSLUCENT";
                this.translucentTexture.setPixelRgba(0, 0, 0x00000000);
                this.translucentTexture.writePixels();
                return this.translucentTexture;
            };
            TextureUtils.getErrorTexture = function (context) {
                if (this.errorTexture != null)
                    return this.errorTexture;
                var size = 64;
                this.errorTexture = new ProceduralTexture2D(context, size, size);
                this.errorTexture.name = "ERROR";
                for (var y = 0; y < size; ++y) {
                    for (var x = 0; x < size; ++x) {
                        var magenta = ((x >> 4) & 1) === ((y >> 4) & 1);
                        this.errorTexture.setPixelRgb(x, y, magenta ? 0xff00ff : 0x000000);
                    }
                }
                this.errorTexture.writePixels();
                return this.errorTexture;
            };
            return TextureUtils;
        }());
        WebGame.TextureUtils = TextureUtils;
        var TextureFilter;
        (function (TextureFilter) {
            TextureFilter[TextureFilter["Nearest"] = WebGLRenderingContext.NEAREST] = "Nearest";
            TextureFilter[TextureFilter["Linear"] = WebGLRenderingContext.LINEAR] = "Linear";
        })(TextureFilter = WebGame.TextureFilter || (WebGame.TextureFilter = {}));
        var TextureLoadable = (function (_super) {
            __extends(TextureLoadable, _super);
            function TextureLoadable(context, url) {
                var _this = _super.call(this) || this;
                _this.nextElement = 0;
                _this.readyFrameCount = 0;
                _this.loadProgress = 0;
                _this.context = context;
                _this.url = url;
                if (/\.(png|jpe?g)$/i.test(_this.url)) {
                    _this.loadFromInfo({
                        target: TextureTarget.Texture2D,
                        params: {
                            filter: TextureFilter.Linear,
                            mipmap: true
                        },
                        frames: 1,
                        elements: [
                            {
                                level: 0,
                                url: url
                            }
                        ]
                    });
                }
                return _this;
            }
            TextureLoadable.prototype.getLoadProgress = function () {
                return this.info == null ? 0 : Math.min(1, (this.nextElement + this.loadProgress) / this.info.elements.length);
            };
            TextureLoadable.prototype.hasMipLevel = function (level) {
                var elems = this.info.elements;
                for (var i = 0, iEnd = this.nextElement; i < iEnd; ++i) {
                    if (elems[i].level === level)
                        return true;
                }
                return false;
            };
            TextureLoadable.prototype.isLoaded = function () {
                return this.frameCount !== undefined && this.readyFrameCount >= this.frameCount;
            };
            TextureLoadable.prototype.getWidth = function (level) {
                if (level === 0)
                    return this.level0Width;
                if (this.info == null)
                    return undefined;
                return this.info.width >> level;
            };
            TextureLoadable.prototype.getHeight = function (level) {
                if (level === 0)
                    return this.level0Height;
                if (this.info == null)
                    return undefined;
                return this.info.height >> level;
            };
            TextureLoadable.prototype.getFrameCount = function () {
                return this.frameCount;
            };
            TextureLoadable.prototype.toString = function () {
                return "[TextureLoadable " + this.url + "]";
            };
            TextureLoadable.prototype.getTarget = function () {
                if (this.info == null)
                    throw new Error("Attempted to get target of an unloaded texture.");
                return this.target;
            };
            TextureLoadable.prototype.getHandle = function (frame) {
                var frames = this.frameHandles;
                return frames == null ? undefined
                    : frame === undefined || this.frameCount === 1 ? frames[0]
                        : frames[frame % this.frameCount];
            };
            TextureLoadable.prototype.getLoadPriority = function () {
                if (_super.prototype.getLoadPriority.call(this) === 0)
                    return 0;
                if (this.info == null || this.nextElement >= this.info.elements.length)
                    return 256;
                var elems = this.info.elements;
                return (elems[this.nextElement].level + 1) / (elems[0].level + 1);
            };
            TextureLoadable.prototype.canLoadImmediately = function (index) {
                return this.info.elements != null && index < this.info.elements.length && this.info.elements[index].url == null;
            };
            TextureLoadable.prototype.applyTexParameters = function () {
                var gl = this.context;
                var params = this.info.params;
                gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, Facepunch.WebGl.decodeConst(params.wrapS, TextureWrapMode.Repeat));
                gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, Facepunch.WebGl.decodeConst(params.wrapT, TextureWrapMode.Repeat));
                this.filter = Facepunch.WebGl.decodeConst(params.filter, TextureFilter.Linear);
                this.mipmap = params.mipmap === undefined ? false : params.mipmap;
                gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, this.filter);
                gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, this.filter);
            };
            TextureLoadable.prototype.getOrCreateHandle = function (frame) {
                if (this.frameHandles === undefined) {
                    this.frameHandles = new Array(this.frameCount);
                }
                frame = frame % this.frameCount;
                var handle = this.frameHandles[frame];
                if (handle !== undefined)
                    return handle;
                var gl = this.context;
                handle = this.frameHandles[frame] = gl.createTexture();
                if (this.info.params != null) {
                    gl.bindTexture(this.target, handle);
                    this.applyTexParameters();
                    gl.bindTexture(this.target, null);
                }
                return handle;
            };
            TextureLoadable.prototype.loadColorElement = function (target, level, color) {
                var width = Math.max(1, this.info.width >> level);
                var height = Math.max(1, this.info.height >> level);
                var pixelCount = width * height;
                var valuesSize = pixelCount * 4;
                var values = TextureLoadable.pixelBuffer;
                if (values == null || values.length < valuesSize) {
                    values = TextureLoadable.pixelBuffer = new Uint8Array(valuesSize);
                }
                var r = color.r;
                var g = color.g;
                var b = color.b;
                var a = color.a == undefined ? 1 : color.a;
                for (var i = 0; i < pixelCount; ++i) {
                    var index = i * 4;
                    values[index + 0] = Math.round(r * 255);
                    values[index + 1] = Math.round(g * 255);
                    values[index + 2] = Math.round(b * 255);
                    values[index + 3] = Math.round(a * 255);
                }
                var gl = this.context;
                gl.texImage2D(target, level, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);
                if (level > 0) {
                    gl.texImage2D(target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);
                }
                this.level0Width = width;
                this.level0Height = height;
                return true;
            };
            TextureLoadable.prototype.loadImageElement = function (target, level, image) {
                var gl = this.context;
                gl.texImage2D(target, level, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                if (level > 0) {
                    gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                }
                else {
                    this.info.width = image.width;
                    this.info.height = image.height;
                }
                this.level0Width = image.width;
                this.level0Height = image.height;
                return true;
            };
            TextureLoadable.prototype.loadElement = function (element, value) {
                var target = Facepunch.WebGl.decodeConst(element.target != undefined ? element.target : this.info.target);
                var frame = element.frame || 0;
                var handle = this.getOrCreateHandle(frame);
                var gl = this.context;
                this.loadProgress = 0;
                gl.bindTexture(this.target, handle);
                var success = false;
                if (element.color != null) {
                    success = this.loadColorElement(target, element.level, element.color);
                }
                else if (value != null) {
                    success = this.loadImageElement(target, element.level, value);
                }
                else {
                    console.error("Attempted to load a null texture element.");
                    success = false;
                }
                if (this.readyFrameCount < this.frameCount) {
                    var readyFrames = this.readyFrames;
                    if (readyFrames == null) {
                        readyFrames = this.readyFrames = new Array(this.frameCount);
                    }
                    if (!readyFrames[frame]) {
                        readyFrames[frame] = true;
                        ++this.readyFrameCount;
                    }
                }
                if (element.level === 0 && this.mipmap) {
                    var minFilter = this.filter === TextureFilter.Nearest
                        ? TextureMinFilter.NearestMipmapLinear
                        : TextureMinFilter.LinearMipmapLinear;
                    if (this.info.elements.length === 1) {
                        gl.generateMipmap(this.target);
                    }
                    gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, minFilter);
                    gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                }
                gl.bindTexture(this.target, null);
                return success;
            };
            TextureLoadable.prototype.loadFromInfo = function (info) {
                this.info = info;
                this.frameCount = info.frames || 1;
                this.target = Facepunch.WebGl.decodeConst(info.target);
                for (var frame = 0; frame < this.frameCount; ++frame) {
                    this.getOrCreateHandle(frame);
                }
                while (this.canLoadImmediately(this.nextElement)) {
                    this.loadElement(info.elements[this.nextElement++]);
                }
                if (this.isLoaded()) {
                    this.dispatchOnLoadCallbacks();
                }
            };
            TextureLoadable.prototype.loadNext = function (callback) {
                var _this = this;
                if (this.info == null) {
                    Facepunch.Http.getJson(this.url, function (info) {
                        _this.loadFromInfo(info);
                        callback(info.elements != null && _this.nextElement < info.elements.length);
                    }, function (error) {
                        callback(false);
                    });
                    return;
                }
                if (this.info.elements == null || this.nextElement >= this.info.elements.length) {
                    callback(false);
                    return;
                }
                var info = this.info;
                var element = info.elements[this.nextElement++];
                var url = Facepunch.Http.getAbsUrl(element.url, this.url);
                Facepunch.Http.getImage(url, function (image) {
                    _this.loadElement(element, image);
                    while (_this.canLoadImmediately(_this.nextElement)) {
                        _this.loadElement(info.elements[_this.nextElement++]);
                    }
                    if (_this.isLoaded()) {
                        _this.dispatchOnLoadCallbacks();
                    }
                    callback(info.elements != null && _this.nextElement < info.elements.length);
                }, function (error) {
                    callback(false);
                }, function (loaded, total) {
                    if (total !== undefined) {
                        _this.loadProgress = loaded / total;
                    }
                });
            };
            return TextureLoadable;
        }(Texture));
        WebGame.TextureLoadable = TextureLoadable;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var TextureLoader = (function (_super) {
            __extends(TextureLoader, _super);
            function TextureLoader(context) {
                var _this = _super.call(this) || this;
                _this.context = context;
                return _this;
            }
            TextureLoader.prototype.onCreateItem = function (url) {
                return new WebGame.TextureLoadable(this.context, url);
            };
            return TextureLoader;
        }(Facepunch.Loader));
        WebGame.TextureLoader = TextureLoader;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Uniform = (function () {
            function Uniform(program, name) {
                this.isSampler = false;
                this.program = program;
                this.name = name;
                this.context = program.context;
            }
            Uniform.prototype.toString = function () {
                return this.name;
            };
            Uniform.prototype.getLocation = function () {
                if (this.location !== undefined)
                    return this.location;
                if (!this.program.isCompiled())
                    return undefined;
                return this.location = this.context.getUniformLocation(this.program.getProgram(), this.name);
            };
            Uniform.prototype.reset = function () {
                this.parameter = undefined;
            };
            Uniform.prototype.bufferParameter = function (buf, param) {
                if (this.parameter === param)
                    return;
                this.parameter = param;
                buf.setUniformParameter(this, param);
            };
            return Uniform;
        }());
        WebGame.Uniform = Uniform;
        var Uniform1F = (function (_super) {
            __extends(Uniform1F, _super);
            function Uniform1F() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Uniform1F.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.x = undefined;
            };
            Uniform1F.prototype.bufferValue = function (buf, x) {
                if (!buf.immediate && this.x === x)
                    return;
                this.x = x;
                buf.setUniform1F(this, x);
            };
            Uniform1F.prototype.set = function (x) {
                this.context.uniform1f(this.getLocation(), x);
            };
            return Uniform1F;
        }(Uniform));
        WebGame.Uniform1F = Uniform1F;
        var Uniform1I = (function (_super) {
            __extends(Uniform1I, _super);
            function Uniform1I() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Uniform1I.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.x = undefined;
            };
            Uniform1I.prototype.bufferValue = function (buf, x) {
                if (!buf.immediate && this.x === x)
                    return;
                this.x = x;
                buf.setUniform1I(this, x);
            };
            Uniform1I.prototype.set = function (x) {
                this.context.uniform1i(this.getLocation(), x);
            };
            return Uniform1I;
        }(Uniform));
        WebGame.Uniform1I = Uniform1I;
        var Uniform2F = (function (_super) {
            __extends(Uniform2F, _super);
            function Uniform2F() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Uniform2F.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.x = undefined;
                this.y = undefined;
            };
            Uniform2F.prototype.bufferValue = function (buf, x, y) {
                if (!buf.immediate && this.x === x && this.y === y)
                    return;
                this.x = x;
                this.y = y;
                buf.setUniform2F(this, x, y);
            };
            Uniform2F.prototype.set = function (x, y) {
                this.context.uniform2f(this.getLocation(), x, y);
            };
            return Uniform2F;
        }(Uniform));
        WebGame.Uniform2F = Uniform2F;
        var Uniform3F = (function (_super) {
            __extends(Uniform3F, _super);
            function Uniform3F() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Uniform3F.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.x = undefined;
                this.y = undefined;
                this.z = undefined;
            };
            Uniform3F.prototype.bufferValue = function (buf, x, y, z) {
                if (!buf.immediate && this.x === x && this.y === y && this.z === z)
                    return;
                this.x = x;
                this.y = y;
                this.z = z;
                buf.setUniform3F(this, x, y, z);
            };
            Uniform3F.prototype.set = function (x, y, z) {
                this.context.uniform3f(this.getLocation(), x, y, z);
            };
            return Uniform3F;
        }(Uniform));
        WebGame.Uniform3F = Uniform3F;
        var Uniform4F = (function (_super) {
            __extends(Uniform4F, _super);
            function Uniform4F() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Uniform4F.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.x = undefined;
                this.y = undefined;
                this.z = undefined;
                this.w = undefined;
            };
            Uniform4F.prototype.bufferValue = function (buf, x, y, z, w) {
                if (!buf.immediate && this.x === x && this.y === y && this.z === z && this.w === w)
                    return;
                this.x = x;
                this.y = y;
                this.z = z;
                this.w = w;
                buf.setUniform4F(this, x, y, z, w);
            };
            Uniform4F.prototype.set = function (x, y, z, w) {
                this.context.uniform4f(this.getLocation(), x, y, z, w);
            };
            return Uniform4F;
        }(Uniform));
        WebGame.Uniform4F = Uniform4F;
        var UniformSampler = (function (_super) {
            __extends(UniformSampler, _super);
            function UniformSampler(program, name) {
                var _this = _super.call(this, program, name) || this;
                _this.isSampler = true;
                _this.texUnit = program.reserveNextTextureUnit();
                return _this;
            }
            UniformSampler.prototype.getSizeUniform = function () {
                if (this.sizeUniform != null)
                    return this.sizeUniform;
                return this.sizeUniform = this.program.addUniform(this + "_Size", Uniform4F);
            };
            UniformSampler.prototype.hasSizeUniform = function () {
                return this.sizeUniform != null;
            };
            UniformSampler.prototype.getTexUnit = function () {
                return this.texUnit;
            };
            UniformSampler.prototype.setDefault = function (tex) {
                this.default = tex;
            };
            UniformSampler.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.value = undefined;
            };
            UniformSampler.prototype.bufferValue = function (buf, tex) {
                if (tex == null || !tex.isLoaded()) {
                    tex = this.default;
                }
                buf.bindTexture(this.texUnit, tex);
                if (!buf.immediate && this.value !== this.texUnit) {
                    this.value = this.texUnit;
                    buf.setUniform1I(this, this.texUnit);
                }
                if (this.sizeUniform == null)
                    return;
                if (tex != null) {
                    buf.setUniformTextureSize(this.sizeUniform, tex);
                }
                else {
                    this.sizeUniform.bufferValue(buf, 1, 1, 1, 1);
                }
            };
            UniformSampler.prototype.set = function (tex) {
                if (tex == null || !tex.isLoaded()) {
                    tex = this.default;
                }
                this.context.activeTexture(this.context.TEXTURE0 + this.texUnit);
                this.context.bindTexture(tex.getTarget(), tex.getHandle());
                this.context.uniform1i(this.getLocation(), this.texUnit);
                var width = tex.getWidth(0);
                var height = tex.getHeight(0);
                this.sizeUniform.set(width, height, 1 / width, 1 / height);
            };
            return UniformSampler;
        }(Uniform));
        WebGame.UniformSampler = UniformSampler;
        var UniformMatrix4 = (function (_super) {
            __extends(UniformMatrix4, _super);
            function UniformMatrix4() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            UniformMatrix4.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.transpose = undefined;
                this.values = undefined;
            };
            UniformMatrix4.prototype.bufferValue = function (buf, transpose, values) {
                if (!buf.immediate && this.transpose === transpose && this.values === values)
                    return;
                this.transpose = transpose;
                this.values = values;
                buf.setUniformMatrix4(this, transpose, values);
            };
            UniformMatrix4.prototype.set = function (transpose, values) {
                this.context.uniformMatrix4fv(this.getLocation(), transpose, values);
            };
            return UniformMatrix4;
        }(Uniform));
        WebGame.UniformMatrix4 = UniformMatrix4;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var AttributeType;
        (function (AttributeType) {
            AttributeType[AttributeType["Float"] = WebGLRenderingContext.FLOAT] = "Float";
        })(AttributeType = WebGame.AttributeType || (WebGame.AttributeType = {}));
        var VertexAttribute = (function () {
            function VertexAttribute(size, type, normalized) {
                this.id = VertexAttribute.nextId++;
                this.size = size;
                this.type = Facepunch.WebGl.decodeConst(type);
                this.normalized = normalized === true;
            }
            VertexAttribute.compare = function (a, b) {
                return a.id - b.id;
            };
            return VertexAttribute;
        }());
        VertexAttribute.nextId = 1;
        VertexAttribute.position = new VertexAttribute(3, AttributeType.Float, false);
        VertexAttribute.normal = new VertexAttribute(3, AttributeType.Float, true);
        VertexAttribute.uv = new VertexAttribute(2, AttributeType.Float, false);
        VertexAttribute.uv2 = new VertexAttribute(2, AttributeType.Float, false);
        VertexAttribute.rgb = new VertexAttribute(3, AttributeType.Float, false);
        VertexAttribute.rgba = new VertexAttribute(4, AttributeType.Float, false);
        VertexAttribute.alpha = new VertexAttribute(1, AttributeType.Float, false);
        WebGame.VertexAttribute = VertexAttribute;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
