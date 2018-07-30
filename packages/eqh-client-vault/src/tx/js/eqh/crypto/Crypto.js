/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var crypto;
    (function (crypto) {
        var Crypto = (function () {
            function Crypto() {
            }
            Crypto.getMessageDigest = function (algorithm) {
                try {
                    return java.security.MessageDigest.getInstance(algorithm);
                }
                catch (e) {
                    throw new java.lang.RuntimeException(e.message, e);
                }
                ;
            };
            Crypto.sign = function (message, secretPhrase) {
                var P = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(32);
                var s = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(32);
                var digest = Crypto.sha256();
                eqh.crypto.Curve25519.keygen(P, s, digest.digest(eqh.util.Convert.toBytes(eqh.Constants.SECRETPHRASE_PREFIX + secretPhrase)));
                var m = digest.digest(message);
                digest.update(m);
                var x = digest.digest(s);
                var Y = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(32);
                eqh.crypto.Curve25519.keygen(Y, null, x);
                digest.update(m);
                var h = digest.digest(Y);
                var v = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(32);
                eqh.crypto.Curve25519.sign(v, h, x, s);
                var signature = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(64);
                java.lang.System.arraycopy(v, 0, signature, 0, 32);
                java.lang.System.arraycopy(h, 0, signature, 32, 32);
                return signature;
            };
            Crypto.sha256 = function () {
                return Crypto.getMessageDigest("SHA-256");
            };
            Crypto.getPublicKey = function (secretPhrase) {
                var publicKey = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(32);
                eqh.crypto.Curve25519.keygen(publicKey, null, Crypto.sha256().digest(eqh.util.Convert.toBytes(eqh.Constants.SECRETPHRASE_PREFIX + secretPhrase)));
                return publicKey;
            };
            return Crypto;
        }());
        crypto.Crypto = Crypto;
        Crypto["__class"] = "eqh.crypto.Crypto";
    })(crypto = eqh.crypto || (eqh.crypto = {}));
})(eqh || (eqh = {}));
