/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var attachment;
    (function (attachment) {
        var Attachment = (function () {
            function Attachment(version) {
                var _this = this;
                this.version = 1;
                if (((typeof version === 'number') || version === null)) {
                    var __args = Array.prototype.slice.call(arguments);
                    this.version = 1;
                    (function () {
                        _this.version = version;
                    })();
                }
                else if (version === undefined) {
                    var __args = Array.prototype.slice.call(arguments);
                    this.version = 1;
                    (function () {
                        _this.version = 1;
                    })();
                }
                else
                    throw new Error('invalid overload');
            }
            Attachment.prototype.getSize = function () {
                return this.getMySize() + (this.version > 0 ? 1 : 0);
            };
            Attachment.prototype.putBytes = function (buffer) {
                if (this.version > 0) {
                    buffer.put(this.version);
                }
                this.putMyBytes(buffer);
            };
            return Attachment;
        }());
        attachment.Attachment = Attachment;
        Attachment["__class"] = "eqh.attachment.Attachment";
        Attachment["__interfaces"] = ["eqh.attachment.Appendix"];
    })(attachment = eqh.attachment || (eqh.attachment = {}));
})(eqh || (eqh = {}));
