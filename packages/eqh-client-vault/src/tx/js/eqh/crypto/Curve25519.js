/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var crypto;
    (function (crypto) {
        var Curve25519 = (function () {
            function Curve25519() {
            }
            Curve25519.ZERO_$LI$ = function () { if (Curve25519.ZERO == null)
                Curve25519.ZERO = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; return Curve25519.ZERO; };
            ;
            Curve25519.PRIME_$LI$ = function () { if (Curve25519.PRIME == null)
                Curve25519.PRIME = [(237 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (255 | 0), (127 | 0)]; return Curve25519.PRIME; };
            ;
            Curve25519.ORDER_$LI$ = function () { if (Curve25519.ORDER == null)
                Curve25519.ORDER = [(237 | 0), (211 | 0), (245 | 0), (92 | 0), (26 | 0), (99 | 0), (18 | 0), (88 | 0), (214 | 0), (156 | 0), (247 | 0), (162 | 0), (222 | 0), (249 | 0), (222 | 0), (20 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (16 | 0)]; return Curve25519.ORDER; };
            ;
            /**
             * KEY AGREEMENT
             * @param {Array} k
             */
            Curve25519.clamp = function (k) {
                k[31] &= 127;
                k[31] |= 64;
                k[0] &= 248;
            };
            Curve25519.keygen = function (P, s, k) {
                Curve25519.clamp(k);
                Curve25519.core(P, s, k, null);
            };
            Curve25519.curve = function (Z, k, P) {
                Curve25519.core(Z, null, k, P);
            };
            /**
             * DIGITAL SIGNATURES
             * @param {Array} v
             * @param {Array} h
             * @param {Array} x
             * @param {Array} s
             * @return {boolean}
             */
            Curve25519.sign = function (v, h, x, s) {
                var w;
                var i;
                var h1 = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(32);
                var x1 = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(32);
                var tmp1 = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(64);
                var tmp2 = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(64);
                Curve25519.cpy32(h1, h);
                Curve25519.cpy32(x1, x);
                var tmp3 = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(32);
                Curve25519.divmod(tmp3, h1, 32, Curve25519.ORDER_$LI$(), 32);
                Curve25519.divmod(tmp3, x1, 32, Curve25519.ORDER_$LI$(), 32);
                Curve25519.mula_small(v, x1, 0, h1, 32, -1);
                Curve25519.mula_small(v, v, 0, Curve25519.ORDER_$LI$(), 32, 1);
                Curve25519.mula32(tmp1, v, s, 32, 1);
                Curve25519.divmod(tmp2, tmp1, 64, Curve25519.ORDER_$LI$(), 32);
                for (w = 0, i = 0; i < 32; i++)
                    w |= v[i] = tmp1[i];
                return w !== 0;
            };
            Curve25519.verify = function (Y, v, h, P) {
                var d = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(32);
                var p = [new Curve25519.long10(), new Curve25519.long10()];
                var s = [new Curve25519.long10(), new Curve25519.long10()];
                var yx = [new Curve25519.long10(), new Curve25519.long10(), new Curve25519.long10()];
                var yz = [new Curve25519.long10(), new Curve25519.long10(), new Curve25519.long10()];
                var t1 = [new Curve25519.long10(), new Curve25519.long10(), new Curve25519.long10()];
                var t2 = [new Curve25519.long10(), new Curve25519.long10(), new Curve25519.long10()];
                var vi = 0;
                var hi = 0;
                var di = 0;
                var nvh = 0;
                var i;
                var j;
                var k;
                Curve25519.set(p[0], 9);
                Curve25519.unpack(p[1], P);
                Curve25519.x_to_y2(t1[0], t2[0], p[1]);
                Curve25519.sqrt(t1[0], t2[0]);
                j = Curve25519.is_negative(t1[0]);
                t2[0]._0 += 39420360;
                Curve25519.mul(t2[1], Curve25519.BASE_2Y_$LI$(), t1[0]);
                Curve25519.sub(t1[j], t2[0], t2[1]);
                Curve25519.add(t1[1 - j], t2[0], t2[1]);
                Curve25519.cpy(t2[0], p[1]);
                t2[0]._0 -= 9;
                Curve25519.sqr(t2[1], t2[0]);
                Curve25519.recip(t2[0], t2[1], 0);
                Curve25519.mul(s[0], t1[0], t2[0]);
                Curve25519.sub(s[0], s[0], p[1]);
                s[0]._0 -= 9 + 486662;
                Curve25519.mul(s[1], t1[1], t2[0]);
                Curve25519.sub(s[1], s[1], p[1]);
                s[1]._0 -= 9 + 486662;
                Curve25519.mul_small(s[0], s[0], 1);
                Curve25519.mul_small(s[1], s[1], 1);
                for (i = 0; i < 32; i++) {
                    vi = (vi >> 8) ^ (v[i] & 255) ^ ((v[i] & 255) << 1);
                    hi = (hi >> 8) ^ (h[i] & 255) ^ ((h[i] & 255) << 1);
                    nvh = ~(vi ^ hi);
                    di = (nvh & (di & 128) >> 7) ^ vi;
                    di ^= nvh & (di & 1) << 1;
                    di ^= nvh & (di & 2) << 1;
                    di ^= nvh & (di & 4) << 1;
                    di ^= nvh & (di & 8) << 1;
                    di ^= nvh & (di & 16) << 1;
                    di ^= nvh & (di & 32) << 1;
                    di ^= nvh & (di & 64) << 1;
                    d[i] = (di | 0);
                }
                ;
                di = ((nvh & (di & 128) << 1) ^ vi) >> 8;
                Curve25519.set(yx[0], 1);
                Curve25519.cpy(yx[1], p[di]);
                Curve25519.cpy(yx[2], s[0]);
                Curve25519.set(yz[0], 0);
                Curve25519.set(yz[1], 1);
                Curve25519.set(yz[2], 1);
                vi = 0;
                hi = 0;
                for (i = 32; i-- !== 0;) {
                    vi = (vi << 8) | (v[i] & 255);
                    hi = (hi << 8) | (h[i] & 255);
                    di = (di << 8) | (d[i] & 255);
                    for (j = 8; j-- !== 0;) {
                        Curve25519.mont_prep(t1[0], t2[0], yx[0], yz[0]);
                        Curve25519.mont_prep(t1[1], t2[1], yx[1], yz[1]);
                        Curve25519.mont_prep(t1[2], t2[2], yx[2], yz[2]);
                        k = ((vi ^ vi >> 1) >> j & 1) + ((hi ^ hi >> 1) >> j & 1);
                        Curve25519.mont_dbl(yx[2], yz[2], t1[k], t2[k], yx[0], yz[0]);
                        k = (di >> j & 2) ^ ((di >> j & 1) << 1);
                        Curve25519.mont_add(t1[1], t2[1], t1[k], t2[k], yx[1], yz[1], p[di >> j & 1]);
                        Curve25519.mont_add(t1[2], t2[2], t1[0], t2[0], yx[2], yz[2], s[((vi ^ hi) >> j & 2) >> 1]);
                    }
                    ;
                }
                ;
                k = (vi & 1) + (hi & 1);
                Curve25519.recip(t1[0], yz[k], 0);
                Curve25519.mul(t1[1], yx[k], t1[0]);
                Curve25519.pack(t1[1], Y);
            };
            Curve25519.isCanonicalSignature = function (v) {
                var vCopy = java.util.Arrays.copyOfRange(v, 0, 32);
                var tmp = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(32);
                Curve25519.divmod(tmp, vCopy, 32, Curve25519.ORDER_$LI$(), 32);
                for (var i = 0; i < 32; i++) {
                    if (v[i] !== vCopy[i])
                        return false;
                }
                ;
                return true;
            };
            Curve25519.isCanonicalPublicKey = function (publicKey) {
                if (publicKey.length !== 32) {
                    return false;
                }
                var publicKeyUnpacked = new Curve25519.long10();
                Curve25519.unpack(publicKeyUnpacked, publicKey);
                var publicKeyCopy = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(32);
                Curve25519.pack(publicKeyUnpacked, publicKeyCopy);
                for (var i = 0; i < 32; i++) {
                    if (publicKeyCopy[i] !== publicKey[i]) {
                        return false;
                    }
                }
                ;
                return true;
            };
            /**
             * radix 2^8 math
             * @param {Array} d
             * @param {Array} s
             * @private
             */
            Curve25519.cpy32 = function (d, s) {
                var i;
                for (i = 0; i < 32; i++)
                    d[i] = s[i];
            };
            Curve25519.mula_small = function (p, q, m, x, n, z) {
                var v = 0;
                for (var i = 0; i < n; ++i) {
                    v += (q[i + m] & 255) + z * (x[i] & 255);
                    p[i + m] = (v | 0);
                    v >>= 8;
                }
                ;
                return v;
            };
            Curve25519.mula32 = function (p, x, y, t, z) {
                var n = 31;
                var w = 0;
                var i = 0;
                for (; i < t; i++) {
                    var zy = z * (y[i] & 255);
                    w += Curve25519.mula_small(p, p, i, x, n, zy) + (p[i + n] & 255) + zy * (x[n] & 255);
                    p[i + n] = (w | 0);
                    w >>= 8;
                }
                ;
                p[i + n] = ((w + (p[i + n] & 255)) | 0);
                return w >> 8;
            };
            Curve25519.divmod = function (q, r, n, d, t) {
                var rn = 0;
                var dt = ((d[t - 1] & 255) << 8);
                if (t > 1) {
                    dt |= (d[t - 2] & 255);
                }
                while ((n-- >= t)) {
                    var z = (rn << 16) | ((r[n] & 255) << 8);
                    if (n > 0) {
                        z |= (r[n - 1] & 255);
                    }
                    z /= dt;
                    rn += Curve25519.mula_small(r, r, n - t + 1, d, t, -z);
                    q[n - t + 1] = (((z + rn) & 255) | 0);
                    Curve25519.mula_small(r, r, n - t + 1, d, t, -rn);
                    rn = (r[n] & 255);
                    r[n] = 0;
                }
                ;
                r[t - 1] = (rn | 0);
            };
            Curve25519.numsize = function (x, n) {
                while ((n-- !== 0 && x[n] === 0))
                    ;
                return n + 1;
            };
            Curve25519.egcd32 = function (x, y, a, b) {
                var an;
                var bn = 32;
                var qn;
                var i;
                for (i = 0; i < 32; i++)
                    x[i] = y[i] = 0;
                x[0] = 1;
                an = Curve25519.numsize(a, 32);
                if (an === 0)
                    return y;
                var temp = (function (s) { var a = []; while (s-- > 0)
                    a.push(0); return a; })(32);
                while ((true)) {
                    qn = bn - an + 1;
                    Curve25519.divmod(temp, b, bn, a, an);
                    bn = Curve25519.numsize(b, bn);
                    if (bn === 0)
                        return x;
                    Curve25519.mula32(y, x, temp, qn, -1);
                    qn = an - bn + 1;
                    Curve25519.divmod(temp, a, an, b, bn);
                    an = Curve25519.numsize(a, an);
                    if (an === 0)
                        return y;
                    Curve25519.mula32(x, y, temp, qn, -1);
                }
                ;
            };
            Curve25519.unpack = function (x, m) {
                x._0 = ((m[0] & 255)) | ((m[1] & 255)) << 8 | (m[2] & 255) << 16 | ((m[3] & 255) & 3) << 24;
                x._1 = ((m[3] & 255) & ~3) >> 2 | (m[4] & 255) << 6 | (m[5] & 255) << 14 | ((m[6] & 255) & 7) << 22;
                x._2 = ((m[6] & 255) & ~7) >> 3 | (m[7] & 255) << 5 | (m[8] & 255) << 13 | ((m[9] & 255) & 31) << 21;
                x._3 = ((m[9] & 255) & ~31) >> 5 | (m[10] & 255) << 3 | (m[11] & 255) << 11 | ((m[12] & 255) & 63) << 19;
                x._4 = ((m[12] & 255) & ~63) >> 6 | (m[13] & 255) << 2 | (m[14] & 255) << 10 | (m[15] & 255) << 18;
                x._5 = (m[16] & 255) | (m[17] & 255) << 8 | (m[18] & 255) << 16 | ((m[19] & 255) & 1) << 24;
                x._6 = ((m[19] & 255) & ~1) >> 1 | (m[20] & 255) << 7 | (m[21] & 255) << 15 | ((m[22] & 255) & 7) << 23;
                x._7 = ((m[22] & 255) & ~7) >> 3 | (m[23] & 255) << 5 | (m[24] & 255) << 13 | ((m[25] & 255) & 15) << 21;
                x._8 = ((m[25] & 255) & ~15) >> 4 | (m[26] & 255) << 4 | (m[27] & 255) << 12 | ((m[28] & 255) & 63) << 20;
                x._9 = ((m[28] & 255) & ~63) >> 6 | (m[29] & 255) << 2 | (m[30] & 255) << 10 | (m[31] & 255) << 18;
            };
            Curve25519.is_overflow = function (x) {
                return (((x._0 > Curve25519.P26 - 19)) && ((x._1 & x._3 & x._5 & x._7 & x._9) === Curve25519.P25) && ((x._2 & x._4 & x._6 & x._8) === Curve25519.P26)) || (x._9 > Curve25519.P25);
            };
            Curve25519.pack = function (x, m) {
                var ld = 0;
                var ud = 0;
                var t;
                ld = (Curve25519.is_overflow(x) ? 1 : 0) - ((x._9 < 0) ? 1 : 0);
                ud = ld * -(Curve25519.P25 + 1);
                ld *= 19;
                t = ld + x._0 + (x._1 << 26);
                m[0] = (t | 0);
                m[1] = ((t >> 8) | 0);
                m[2] = ((t >> 16) | 0);
                m[3] = ((t >> 24) | 0);
                t = (t >> 32) + (x._2 << 19);
                m[4] = (t | 0);
                m[5] = ((t >> 8) | 0);
                m[6] = ((t >> 16) | 0);
                m[7] = ((t >> 24) | 0);
                t = (t >> 32) + (x._3 << 13);
                m[8] = (t | 0);
                m[9] = ((t >> 8) | 0);
                m[10] = ((t >> 16) | 0);
                m[11] = ((t >> 24) | 0);
                t = (t >> 32) + (x._4 << 6);
                m[12] = (t | 0);
                m[13] = ((t >> 8) | 0);
                m[14] = ((t >> 16) | 0);
                m[15] = ((t >> 24) | 0);
                t = (t >> 32) + x._5 + (x._6 << 25);
                m[16] = (t | 0);
                m[17] = ((t >> 8) | 0);
                m[18] = ((t >> 16) | 0);
                m[19] = ((t >> 24) | 0);
                t = (t >> 32) + (x._7 << 19);
                m[20] = (t | 0);
                m[21] = ((t >> 8) | 0);
                m[22] = ((t >> 16) | 0);
                m[23] = ((t >> 24) | 0);
                t = (t >> 32) + (x._8 << 12);
                m[24] = (t | 0);
                m[25] = ((t >> 8) | 0);
                m[26] = ((t >> 16) | 0);
                m[27] = ((t >> 24) | 0);
                t = (t >> 32) + ((x._9 + ud) << 6);
                m[28] = (t | 0);
                m[29] = ((t >> 8) | 0);
                m[30] = ((t >> 16) | 0);
                m[31] = ((t >> 24) | 0);
            };
            Curve25519.cpy = function (out, __in) {
                out._0 = __in._0;
                out._1 = __in._1;
                out._2 = __in._2;
                out._3 = __in._3;
                out._4 = __in._4;
                out._5 = __in._5;
                out._6 = __in._6;
                out._7 = __in._7;
                out._8 = __in._8;
                out._9 = __in._9;
            };
            Curve25519.set = function (out, __in) {
                out._0 = __in;
                out._1 = 0;
                out._2 = 0;
                out._3 = 0;
                out._4 = 0;
                out._5 = 0;
                out._6 = 0;
                out._7 = 0;
                out._8 = 0;
                out._9 = 0;
            };
            Curve25519.add = function (xy, x, y) {
                xy._0 = x._0 + y._0;
                xy._1 = x._1 + y._1;
                xy._2 = x._2 + y._2;
                xy._3 = x._3 + y._3;
                xy._4 = x._4 + y._4;
                xy._5 = x._5 + y._5;
                xy._6 = x._6 + y._6;
                xy._7 = x._7 + y._7;
                xy._8 = x._8 + y._8;
                xy._9 = x._9 + y._9;
            };
            Curve25519.sub = function (xy, x, y) {
                xy._0 = x._0 - y._0;
                xy._1 = x._1 - y._1;
                xy._2 = x._2 - y._2;
                xy._3 = x._3 - y._3;
                xy._4 = x._4 - y._4;
                xy._5 = x._5 - y._5;
                xy._6 = x._6 - y._6;
                xy._7 = x._7 - y._7;
                xy._8 = x._8 - y._8;
                xy._9 = x._9 - y._9;
            };
            Curve25519.mul_small = function (xy, x, y) {
                var t;
                t = (x._8 * y);
                xy._8 = (t & ((1 << 26) - 1));
                t = (t >> 26) + (x._9 * y);
                xy._9 = (t & ((1 << 25) - 1));
                t = 19 * (t >> 25) + (x._0 * y);
                xy._0 = (t & ((1 << 26) - 1));
                t = (t >> 26) + (x._1 * y);
                xy._1 = (t & ((1 << 25) - 1));
                t = (t >> 25) + (x._2 * y);
                xy._2 = (t & ((1 << 26) - 1));
                t = (t >> 26) + (x._3 * y);
                xy._3 = (t & ((1 << 25) - 1));
                t = (t >> 25) + (x._4 * y);
                xy._4 = (t & ((1 << 26) - 1));
                t = (t >> 26) + (x._5 * y);
                xy._5 = (t & ((1 << 25) - 1));
                t = (t >> 25) + (x._6 * y);
                xy._6 = (t & ((1 << 26) - 1));
                t = (t >> 26) + (x._7 * y);
                xy._7 = (t & ((1 << 25) - 1));
                t = (t >> 25) + xy._8;
                xy._8 = (t & ((1 << 26) - 1));
                xy._9 += (t >> 26);
                return xy;
            };
            Curve25519.mul = function (xy, x, y) {
                var x_0 = x._0;
                var x_1 = x._1;
                var x_2 = x._2;
                var x_3 = x._3;
                var x_4 = x._4;
                var x_5 = x._5;
                var x_6 = x._6;
                var x_7 = x._7;
                var x_8 = x._8;
                var x_9 = x._9;
                var y_0 = y._0;
                var y_1 = y._1;
                var y_2 = y._2;
                var y_3 = y._3;
                var y_4 = y._4;
                var y_5 = y._5;
                var y_6 = y._6;
                var y_7 = y._7;
                var y_8 = y._8;
                var y_9 = y._9;
                var t;
                t = (x_0 * y_8) + (x_2 * y_6) + (x_4 * y_4) + (x_6 * y_2) + (x_8 * y_0) + 2 * ((x_1 * y_7) + (x_3 * y_5) + (x_5 * y_3) + (x_7 * y_1)) + 38 * (x_9 * y_9);
                xy._8 = (t & ((1 << 26) - 1));
                t = (t >> 26) + (x_0 * y_9) + (x_1 * y_8) + (x_2 * y_7) + (x_3 * y_6) + (x_4 * y_5) + (x_5 * y_4) + (x_6 * y_3) + (x_7 * y_2) + (x_8 * y_1) + (x_9 * y_0);
                xy._9 = (t & ((1 << 25) - 1));
                t = (x_0 * y_0) + 19 * ((t >> 25) + (x_2 * y_8) + (x_4 * y_6) + (x_6 * y_4) + (x_8 * y_2)) + 38 * ((x_1 * y_9) + (x_3 * y_7) + (x_5 * y_5) + (x_7 * y_3) + (x_9 * y_1));
                xy._0 = (t & ((1 << 26) - 1));
                t = (t >> 26) + (x_0 * y_1) + (x_1 * y_0) + 19 * ((x_2 * y_9) + (x_3 * y_8) + (x_4 * y_7) + (x_5 * y_6) + (x_6 * y_5) + (x_7 * y_4) + (x_8 * y_3) + (x_9 * y_2));
                xy._1 = (t & ((1 << 25) - 1));
                t = (t >> 25) + (x_0 * y_2) + (x_2 * y_0) + 19 * ((x_4 * y_8) + (x_6 * y_6) + (x_8 * y_4)) + 2 * (x_1 * y_1) + 38 * ((x_3 * y_9) + (x_5 * y_7) + (x_7 * y_5) + (x_9 * y_3));
                xy._2 = (t & ((1 << 26) - 1));
                t = (t >> 26) + (x_0 * y_3) + (x_1 * y_2) + (x_2 * y_1) + (x_3 * y_0) + 19 * ((x_4 * y_9) + (x_5 * y_8) + (x_6 * y_7) + (x_7 * y_6) + (x_8 * y_5) + (x_9 * y_4));
                xy._3 = (t & ((1 << 25) - 1));
                t = (t >> 25) + (x_0 * y_4) + (x_2 * y_2) + (x_4 * y_0) + 19 * ((x_6 * y_8) + (x_8 * y_6)) + 2 * ((x_1 * y_3) + (x_3 * y_1)) + 38 * ((x_5 * y_9) + (x_7 * y_7) + (x_9 * y_5));
                xy._4 = (t & ((1 << 26) - 1));
                t = (t >> 26) + (x_0 * y_5) + (x_1 * y_4) + (x_2 * y_3) + (x_3 * y_2) + (x_4 * y_1) + (x_5 * y_0) + 19 * ((x_6 * y_9) + (x_7 * y_8) + (x_8 * y_7) + (x_9 * y_6));
                xy._5 = (t & ((1 << 25) - 1));
                t = (t >> 25) + (x_0 * y_6) + (x_2 * y_4) + (x_4 * y_2) + (x_6 * y_0) + 19 * (x_8 * y_8) + 2 * ((x_1 * y_5) + (x_3 * y_3) + (x_5 * y_1)) + 38 * ((x_7 * y_9) + (x_9 * y_7));
                xy._6 = (t & ((1 << 26) - 1));
                t = (t >> 26) + (x_0 * y_7) + (x_1 * y_6) + (x_2 * y_5) + (x_3 * y_4) + (x_4 * y_3) + (x_5 * y_2) + (x_6 * y_1) + (x_7 * y_0) + 19 * ((x_8 * y_9) + (x_9 * y_8));
                xy._7 = (t & ((1 << 25) - 1));
                t = (t >> 25) + xy._8;
                xy._8 = (t & ((1 << 26) - 1));
                xy._9 += (t >> 26);
                return xy;
            };
            Curve25519.sqr = function (x2, x) {
                var x_0 = x._0;
                var x_1 = x._1;
                var x_2 = x._2;
                var x_3 = x._3;
                var x_4 = x._4;
                var x_5 = x._5;
                var x_6 = x._6;
                var x_7 = x._7;
                var x_8 = x._8;
                var x_9 = x._9;
                var t;
                t = (x_4 * x_4) + 2 * ((x_0 * x_8) + (x_2 * x_6)) + 38 * (x_9 * x_9) + 4 * ((x_1 * x_7) + (x_3 * x_5));
                x2._8 = (t & ((1 << 26) - 1));
                t = (t >> 26) + 2 * ((x_0 * x_9) + (x_1 * x_8) + (x_2 * x_7) + (x_3 * x_6) + (x_4 * x_5));
                x2._9 = (t & ((1 << 25) - 1));
                t = 19 * (t >> 25) + (x_0 * x_0) + 38 * ((x_2 * x_8) + (x_4 * x_6) + (x_5 * x_5)) + 76 * ((x_1 * x_9) + (x_3 * x_7));
                x2._0 = (t & ((1 << 26) - 1));
                t = (t >> 26) + 2 * (x_0 * x_1) + 38 * ((x_2 * x_9) + (x_3 * x_8) + (x_4 * x_7) + (x_5 * x_6));
                x2._1 = (t & ((1 << 25) - 1));
                t = (t >> 25) + 19 * (x_6 * x_6) + 2 * ((x_0 * x_2) + (x_1 * x_1)) + 38 * (x_4 * x_8) + 76 * ((x_3 * x_9) + (x_5 * x_7));
                x2._2 = (t & ((1 << 26) - 1));
                t = (t >> 26) + 2 * ((x_0 * x_3) + (x_1 * x_2)) + 38 * ((x_4 * x_9) + (x_5 * x_8) + (x_6 * x_7));
                x2._3 = (t & ((1 << 25) - 1));
                t = (t >> 25) + (x_2 * x_2) + 2 * (x_0 * x_4) + 38 * ((x_6 * x_8) + (x_7 * x_7)) + 4 * (x_1 * x_3) + 76 * (x_5 * x_9);
                x2._4 = (t & ((1 << 26) - 1));
                t = (t >> 26) + 2 * ((x_0 * x_5) + (x_1 * x_4) + (x_2 * x_3)) + 38 * ((x_6 * x_9) + (x_7 * x_8));
                x2._5 = (t & ((1 << 25) - 1));
                t = (t >> 25) + 19 * (x_8 * x_8) + 2 * ((x_0 * x_6) + (x_2 * x_4) + (x_3 * x_3)) + 4 * (x_1 * x_5) + 76 * (x_7 * x_9);
                x2._6 = (t & ((1 << 26) - 1));
                t = (t >> 26) + 2 * ((x_0 * x_7) + (x_1 * x_6) + (x_2 * x_5) + (x_3 * x_4)) + 38 * (x_8 * x_9);
                x2._7 = (t & ((1 << 25) - 1));
                t = (t >> 25) + x2._8;
                x2._8 = (t & ((1 << 26) - 1));
                x2._9 += (t >> 26);
                return x2;
            };
            Curve25519.recip = function (y, x, sqrtassist) {
                var t0 = new Curve25519.long10();
                var t1 = new Curve25519.long10();
                var t2 = new Curve25519.long10();
                var t3 = new Curve25519.long10();
                var t4 = new Curve25519.long10();
                var i;
                Curve25519.sqr(t1, x);
                Curve25519.sqr(t2, t1);
                Curve25519.sqr(t0, t2);
                Curve25519.mul(t2, t0, x);
                Curve25519.mul(t0, t2, t1);
                Curve25519.sqr(t1, t0);
                Curve25519.mul(t3, t1, t2);
                Curve25519.sqr(t1, t3);
                Curve25519.sqr(t2, t1);
                Curve25519.sqr(t1, t2);
                Curve25519.sqr(t2, t1);
                Curve25519.sqr(t1, t2);
                Curve25519.mul(t2, t1, t3);
                Curve25519.sqr(t1, t2);
                Curve25519.sqr(t3, t1);
                for (i = 1; i < 5; i++) {
                    Curve25519.sqr(t1, t3);
                    Curve25519.sqr(t3, t1);
                }
                ;
                Curve25519.mul(t1, t3, t2);
                Curve25519.sqr(t3, t1);
                Curve25519.sqr(t4, t3);
                for (i = 1; i < 10; i++) {
                    Curve25519.sqr(t3, t4);
                    Curve25519.sqr(t4, t3);
                }
                ;
                Curve25519.mul(t3, t4, t1);
                for (i = 0; i < 5; i++) {
                    Curve25519.sqr(t1, t3);
                    Curve25519.sqr(t3, t1);
                }
                ;
                Curve25519.mul(t1, t3, t2);
                Curve25519.sqr(t2, t1);
                Curve25519.sqr(t3, t2);
                for (i = 1; i < 25; i++) {
                    Curve25519.sqr(t2, t3);
                    Curve25519.sqr(t3, t2);
                }
                ;
                Curve25519.mul(t2, t3, t1);
                Curve25519.sqr(t3, t2);
                Curve25519.sqr(t4, t3);
                for (i = 1; i < 50; i++) {
                    Curve25519.sqr(t3, t4);
                    Curve25519.sqr(t4, t3);
                }
                ;
                Curve25519.mul(t3, t4, t2);
                for (i = 0; i < 25; i++) {
                    Curve25519.sqr(t4, t3);
                    Curve25519.sqr(t3, t4);
                }
                ;
                Curve25519.mul(t2, t3, t1);
                Curve25519.sqr(t1, t2);
                Curve25519.sqr(t2, t1);
                if (sqrtassist !== 0) {
                    Curve25519.mul(y, x, t2);
                }
                else {
                    Curve25519.sqr(t1, t2);
                    Curve25519.sqr(t2, t1);
                    Curve25519.sqr(t1, t2);
                    Curve25519.mul(y, t1, t0);
                }
            };
            Curve25519.is_negative = function (x) {
                return ((((Curve25519.is_overflow(x) || (x._9 < 0)) ? 1 : 0) ^ (x._0 & 1)) | 0);
            };
            Curve25519.sqrt = function (x, u) {
                var v = new Curve25519.long10();
                var t1 = new Curve25519.long10();
                var t2 = new Curve25519.long10();
                Curve25519.add(t1, u, u);
                Curve25519.recip(v, t1, 1);
                Curve25519.sqr(x, v);
                Curve25519.mul(t2, t1, x);
                t2._0--;
                Curve25519.mul(t1, v, t2);
                Curve25519.mul(x, u, t1);
            };
            /**
             * Elliptic curve
             * @param {eqh.crypto.Curve25519.long10} t1
             * @param {eqh.crypto.Curve25519.long10} t2
             * @param {eqh.crypto.Curve25519.long10} ax
             * @param {eqh.crypto.Curve25519.long10} az
             * @private
             */
            Curve25519.mont_prep = function (t1, t2, ax, az) {
                Curve25519.add(t1, ax, az);
                Curve25519.sub(t2, ax, az);
            };
            Curve25519.mont_add = function (t1, t2, t3, t4, ax, az, dx) {
                Curve25519.mul(ax, t2, t3);
                Curve25519.mul(az, t1, t4);
                Curve25519.add(t1, ax, az);
                Curve25519.sub(t2, ax, az);
                Curve25519.sqr(ax, t1);
                Curve25519.sqr(t1, t2);
                Curve25519.mul(az, t1, dx);
            };
            Curve25519.mont_dbl = function (t1, t2, t3, t4, bx, bz) {
                Curve25519.sqr(t1, t3);
                Curve25519.sqr(t2, t4);
                Curve25519.mul(bx, t1, t2);
                Curve25519.sub(t2, t1, t2);
                Curve25519.mul_small(bz, t2, 121665);
                Curve25519.add(t1, t1, bz);
                Curve25519.mul(bz, t1, t2);
            };
            Curve25519.x_to_y2 = function (t, y2, x) {
                Curve25519.sqr(t, x);
                Curve25519.mul_small(y2, x, 486662);
                Curve25519.add(t, t, y2);
                t._0++;
                Curve25519.mul(y2, t, x);
            };
            Curve25519.core = function (Px, s, k, Gx) {
                var dx = new Curve25519.long10();
                var t1 = new Curve25519.long10();
                var t2 = new Curve25519.long10();
                var t3 = new Curve25519.long10();
                var t4 = new Curve25519.long10();
                var x = [new Curve25519.long10(), new Curve25519.long10()];
                var z = [new Curve25519.long10(), new Curve25519.long10()];
                var i;
                var j;
                if (Gx != null)
                    Curve25519.unpack(dx, Gx);
                else
                    Curve25519.set(dx, 9);
                Curve25519.set(x[0], 1);
                Curve25519.set(z[0], 0);
                Curve25519.cpy(x[1], dx);
                Curve25519.set(z[1], 1);
                for (i = 32; i-- !== 0;) {
                    if (i === 0) {
                        i = 0;
                    }
                    for (j = 8; j-- !== 0;) {
                        var bit1 = (k[i] & 255) >> j & 1;
                        var bit0 = ~(k[i] & 255) >> j & 1;
                        var ax = x[bit0];
                        var az = z[bit0];
                        var bx = x[bit1];
                        var bz = z[bit1];
                        Curve25519.mont_prep(t1, t2, ax, az);
                        Curve25519.mont_prep(t3, t4, bx, bz);
                        Curve25519.mont_add(t1, t2, t3, t4, ax, az, dx);
                        Curve25519.mont_dbl(t1, t2, t3, t4, bx, bz);
                    }
                    ;
                }
                ;
                Curve25519.recip(t1, z[0], 0);
                Curve25519.mul(dx, x[0], t1);
                Curve25519.pack(dx, Px);
                if (s != null) {
                    Curve25519.x_to_y2(t2, t1, dx);
                    Curve25519.recip(t3, z[1], 0);
                    Curve25519.mul(t2, x[1], t3);
                    Curve25519.add(t2, t2, dx);
                    t2._0 += 9 + 486662;
                    dx._0 -= 9;
                    Curve25519.sqr(t3, dx);
                    Curve25519.mul(dx, t2, t3);
                    Curve25519.sub(dx, dx, t1);
                    dx._0 -= 39420360;
                    Curve25519.mul(t1, dx, Curve25519.BASE_R2Y_$LI$());
                    if (Curve25519.is_negative(t1) !== 0)
                        Curve25519.cpy32(s, k);
                    else
                        Curve25519.mula_small(s, Curve25519.ORDER_TIMES_8_$LI$(), 0, k, 32, -1);
                    var temp1 = (function (s) { var a = []; while (s-- > 0)
                        a.push(0); return a; })(32);
                    var temp2 = (function (s) { var a = []; while (s-- > 0)
                        a.push(0); return a; })(64);
                    var temp3 = (function (s) { var a = []; while (s-- > 0)
                        a.push(0); return a; })(64);
                    Curve25519.cpy32(temp1, Curve25519.ORDER_$LI$());
                    Curve25519.cpy32(s, Curve25519.egcd32(temp2, temp3, s, temp1));
                    if ((s[31] & 128) !== 0)
                        Curve25519.mula_small(s, s, 0, Curve25519.ORDER_$LI$(), 32, 1);
                }
            };
            Curve25519.ORDER_TIMES_8_$LI$ = function () { if (Curve25519.ORDER_TIMES_8 == null)
                Curve25519.ORDER_TIMES_8 = [(104 | 0), (159 | 0), (174 | 0), (231 | 0), (210 | 0), (24 | 0), (147 | 0), (192 | 0), (178 | 0), (230 | 0), (188 | 0), (23 | 0), (245 | 0), (206 | 0), (247 | 0), (166 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (0 | 0), (128 | 0)]; return Curve25519.ORDER_TIMES_8; };
            ;
            Curve25519.BASE_2Y_$LI$ = function () { if (Curve25519.BASE_2Y == null)
                Curve25519.BASE_2Y = new Curve25519.long10(39999547, 18689728, 59995525, 1648697, 57546132, 24010086, 19059592, 5425144, 63499247, 16420658); return Curve25519.BASE_2Y; };
            ;
            Curve25519.BASE_R2Y_$LI$ = function () { if (Curve25519.BASE_R2Y == null)
                Curve25519.BASE_R2Y = new Curve25519.long10(5744, 8160848, 4790893, 13779497, 35730846, 12541209, 49101323, 30047407, 40071253, 6226132); return Curve25519.BASE_R2Y; };
            ;
            return Curve25519;
        }());
        Curve25519.KEY_SIZE = 32;
        /**
         * radix 2^25.5 GF(2^255-19) math
         */
        Curve25519.P25 = 33554431;
        Curve25519.P26 = 67108863;
        crypto.Curve25519 = Curve25519;
        Curve25519["__class"] = "eqh.crypto.Curve25519";
        (function (Curve25519) {
            var long10 = (function () {
                function long10(_0, _1, _2, _3, _4, _5, _6, _7, _8, _9) {
                    var _this = this;
                    if (((typeof _0 === 'number') || _0 === null) && ((typeof _1 === 'number') || _1 === null) && ((typeof _2 === 'number') || _2 === null) && ((typeof _3 === 'number') || _3 === null) && ((typeof _4 === 'number') || _4 === null) && ((typeof _5 === 'number') || _5 === null) && ((typeof _6 === 'number') || _6 === null) && ((typeof _7 === 'number') || _7 === null) && ((typeof _8 === 'number') || _8 === null) && ((typeof _9 === 'number') || _9 === null)) {
                        var __args = Array.prototype.slice.call(arguments);
                        if (this._0 === undefined)
                            this._0 = 0;
                        if (this._1 === undefined)
                            this._1 = 0;
                        if (this._2 === undefined)
                            this._2 = 0;
                        if (this._3 === undefined)
                            this._3 = 0;
                        if (this._4 === undefined)
                            this._4 = 0;
                        if (this._5 === undefined)
                            this._5 = 0;
                        if (this._6 === undefined)
                            this._6 = 0;
                        if (this._7 === undefined)
                            this._7 = 0;
                        if (this._8 === undefined)
                            this._8 = 0;
                        if (this._9 === undefined)
                            this._9 = 0;
                        if (this._0 === undefined)
                            this._0 = 0;
                        if (this._1 === undefined)
                            this._1 = 0;
                        if (this._2 === undefined)
                            this._2 = 0;
                        if (this._3 === undefined)
                            this._3 = 0;
                        if (this._4 === undefined)
                            this._4 = 0;
                        if (this._5 === undefined)
                            this._5 = 0;
                        if (this._6 === undefined)
                            this._6 = 0;
                        if (this._7 === undefined)
                            this._7 = 0;
                        if (this._8 === undefined)
                            this._8 = 0;
                        if (this._9 === undefined)
                            this._9 = 0;
                        (function () {
                            _this._0 = _0;
                            _this._1 = _1;
                            _this._2 = _2;
                            _this._3 = _3;
                            _this._4 = _4;
                            _this._5 = _5;
                            _this._6 = _6;
                            _this._7 = _7;
                            _this._8 = _8;
                            _this._9 = _9;
                        })();
                    }
                    else if (_0 === undefined && _1 === undefined && _2 === undefined && _3 === undefined && _4 === undefined && _5 === undefined && _6 === undefined && _7 === undefined && _8 === undefined && _9 === undefined) {
                        var __args = Array.prototype.slice.call(arguments);
                        if (this._0 === undefined)
                            this._0 = 0;
                        if (this._1 === undefined)
                            this._1 = 0;
                        if (this._2 === undefined)
                            this._2 = 0;
                        if (this._3 === undefined)
                            this._3 = 0;
                        if (this._4 === undefined)
                            this._4 = 0;
                        if (this._5 === undefined)
                            this._5 = 0;
                        if (this._6 === undefined)
                            this._6 = 0;
                        if (this._7 === undefined)
                            this._7 = 0;
                        if (this._8 === undefined)
                            this._8 = 0;
                        if (this._9 === undefined)
                            this._9 = 0;
                        if (this._0 === undefined)
                            this._0 = 0;
                        if (this._1 === undefined)
                            this._1 = 0;
                        if (this._2 === undefined)
                            this._2 = 0;
                        if (this._3 === undefined)
                            this._3 = 0;
                        if (this._4 === undefined)
                            this._4 = 0;
                        if (this._5 === undefined)
                            this._5 = 0;
                        if (this._6 === undefined)
                            this._6 = 0;
                        if (this._7 === undefined)
                            this._7 = 0;
                        if (this._8 === undefined)
                            this._8 = 0;
                        if (this._9 === undefined)
                            this._9 = 0;
                    }
                    else
                        throw new Error('invalid overload');
                }
                return long10;
            }());
            Curve25519.long10 = long10;
            long10["__class"] = "eqh.crypto.Curve25519.long10";
        })(Curve25519 = crypto.Curve25519 || (crypto.Curve25519 = {}));
    })(crypto = eqh.crypto || (eqh.crypto = {}));
})(eqh || (eqh = {}));
eqh.crypto.Curve25519.BASE_R2Y_$LI$();
eqh.crypto.Curve25519.BASE_2Y_$LI$();
eqh.crypto.Curve25519.ORDER_TIMES_8_$LI$();
eqh.crypto.Curve25519.ORDER_$LI$();
eqh.crypto.Curve25519.PRIME_$LI$();
eqh.crypto.Curve25519.ZERO_$LI$();
