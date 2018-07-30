/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var util;
    (function (util) {
        var Convert = (function () {
            function Convert() {
            }
            Convert.hexChars_$LI$ = function () { if (Convert.hexChars == null)
                Convert.hexChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']; return Convert.hexChars; };
            ;
            Convert.CURRENCY_NAME_$LI$ = function () { if (Convert.CURRENCY_NAME == null)
                Convert.CURRENCY_NAME = eqh.Constants.COIN_NAME; return Convert.CURRENCY_NAME; };
            ;
            Convert.parseHexString = function (hex) {
                if (hex == null) {
                    return null;
                }
                var bytes = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })((hex.length / 2 | 0));
                for (var i = 0; i < bytes.length; i++) {
                    var char1 = (hex.charAt(i * 2)).charCodeAt(0);
                    char1 = char1 > 96 ? char1 - 87 : char1 - 48;
                    var char2 = (hex.charAt(i * 2 + 1)).charCodeAt(0);
                    char2 = char2 > 96 ? char2 - 87 : char2 - 48;
                    if (char1 < 0 || char2 < 0 || char1 > 15 || char2 > 15) {
                        throw new java.lang.NumberFormatException("Invalid hex number: " + hex);
                    }
                    bytes[i] = (((char1 << 4) + char2) | 0);
                }
                ;
                return bytes;
            };
            Convert.toHexString = function (bytes) {
                if (bytes == null) {
                    return null;
                }
                var chars = (function (s) { var a = []; while (s-- > 0)
                    a.push(null); return a; })(bytes.length * 2);
                for (var i = 0; i < bytes.length; i++) {
                    chars[i * 2] = Convert.hexChars_$LI$()[((bytes[i] >> 4) & 15)];
                    chars[i * 2 + 1] = Convert.hexChars_$LI$()[(bytes[i] & 15)];
                }
                ;
                return new String(chars).toString();
            };
            Convert.parseUnsignedLong = function (number) {
                if (number == null) {
                    return 0;
                }
                return javaemul.internal.LongHelper.parseUnsignedLong(number);
            };
            Convert.toEpochTime = function (currentTime) {
                return (((function (n) { return n < 0 ? Math.ceil(n) : Math.floor(n); })((currentTime - eqh.Constants.EPOCH_BEGINNING + 500) / 1000)) | 0);
            };
            Convert.emptyToNull = function (s) {
                return s == null || s.length === 0 ? null : s;
            };
            Convert.toBytes = function (s) {
                try {
                    return (s).split('').map(function (s) { return s.charCodeAt(0); });
                }
                catch (e) {
                    throw new java.lang.RuntimeException(e.toString(), e);
                }
                ;
            };
            return Convert;
        }());
        util.Convert = Convert;
        Convert["__class"] = "eqh.util.Convert";
    })(util = eqh.util || (eqh.util = {}));
})(eqh || (eqh = {}));
eqh.util.Convert.CURRENCY_NAME_$LI$();
eqh.util.Convert.hexChars_$LI$();
