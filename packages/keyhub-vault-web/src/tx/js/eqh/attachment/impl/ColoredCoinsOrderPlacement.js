var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var attachment;
    (function (attachment) {
        var impl;
        (function (impl) {
            var ColoredCoinsOrderPlacement = (function (_super) {
                __extends(ColoredCoinsOrderPlacement, _super);
                function ColoredCoinsOrderPlacement(assetId, quantityQNT, priceNQT) {
                    var _this = this;
                    if (((typeof assetId === 'number') || assetId === null) && ((typeof quantityQNT === 'number') || quantityQNT === null) && ((typeof priceNQT === 'number') || priceNQT === null)) {
                        var __args = Array.prototype.slice.call(arguments);
                        _this = _super.call(this) || this;
                        if (_this.assetId === undefined)
                            _this.assetId = 0;
                        if (_this.quantityQNT === undefined)
                            _this.quantityQNT = 0;
                        if (_this.priceNQT === undefined)
                            _this.priceNQT = 0;
                        if (_this.assetId === undefined)
                            _this.assetId = 0;
                        if (_this.quantityQNT === undefined)
                            _this.quantityQNT = 0;
                        if (_this.priceNQT === undefined)
                            _this.priceNQT = 0;
                        (function () {
                            _this.assetId = assetId;
                            _this.quantityQNT = quantityQNT;
                            _this.priceNQT = priceNQT;
                        })();
                    }
                    else if (assetId === undefined && quantityQNT === undefined && priceNQT === undefined) {
                        var __args = Array.prototype.slice.call(arguments);
                        _this = _super.call(this) || this;
                        if (_this.assetId === undefined)
                            _this.assetId = 0;
                        if (_this.quantityQNT === undefined)
                            _this.quantityQNT = 0;
                        if (_this.priceNQT === undefined)
                            _this.priceNQT = 0;
                        if (_this.assetId === undefined)
                            _this.assetId = 0;
                        if (_this.quantityQNT === undefined)
                            _this.quantityQNT = 0;
                        if (_this.priceNQT === undefined)
                            _this.priceNQT = 0;
                    }
                    else
                        throw new Error('invalid overload');
                    return _this;
                }
                /**
                 *
                 * @return {number}
                 */
                ColoredCoinsOrderPlacement.prototype.getMySize = function () {
                    return 8 + 8 + 8;
                };
                /**
                 *
                 * @param {java.nio.ByteBuffer} buffer
                 */
                ColoredCoinsOrderPlacement.prototype.putMyBytes = function (buffer) {
                    buffer.putLong(this.assetId);
                    buffer.putLong(this.quantityQNT);
                    buffer.putLong(this.priceNQT);
                };
                /**
                 *
                 * @return {boolean}
                 */
                ColoredCoinsOrderPlacement.prototype.canHaveRecipient = function () {
                    return false;
                };
                ColoredCoinsOrderPlacement.prototype.getAssetId = function () {
                    return this.assetId;
                };
                ColoredCoinsOrderPlacement.prototype.setAssetId = function (assetId) {
                    this.assetId = assetId;
                };
                ColoredCoinsOrderPlacement.prototype.getQuantityQNT = function () {
                    return this.quantityQNT;
                };
                ColoredCoinsOrderPlacement.prototype.setQuantityQNT = function (quantityQNT) {
                    this.quantityQNT = quantityQNT;
                };
                ColoredCoinsOrderPlacement.prototype.getPriceNQT = function () {
                    return this.priceNQT;
                };
                ColoredCoinsOrderPlacement.prototype.setPriceNQT = function (priceNQT) {
                    this.priceNQT = priceNQT;
                };
                /**
                 *
                 * @return {*}
                 */
                ColoredCoinsOrderPlacement.prototype.getBaselineFee = function () {
                    return new eqh.Fee.ConstantFee(eqh.Constants.ONE_EQH);
                };
                return ColoredCoinsOrderPlacement;
            }(eqh.attachment.Attachment));
            impl.ColoredCoinsOrderPlacement = ColoredCoinsOrderPlacement;
            ColoredCoinsOrderPlacement["__class"] = "eqh.attachment.impl.ColoredCoinsOrderPlacement";
            ColoredCoinsOrderPlacement["__interfaces"] = ["eqh.attachment.Appendix"];
        })(impl = attachment.impl || (attachment.impl = {}));
    })(attachment = eqh.attachment || (eqh.attachment = {}));
})(eqh || (eqh = {}));
