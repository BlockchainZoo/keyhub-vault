var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var transaction;
    (function (transaction) {
        var PlaceAskOrder = (function (_super) {
            __extends(PlaceAskOrder, _super);
            function PlaceAskOrder(publicKeyValue, ecBlockHeightString, ecBlockIdString, referencedTransactionFullHash, deadlineValue, assetIdString, quantityNQTString, priceNQTString) {
                var _this = _super.call(this, (2 | 0), (2 | 0)) || this;
                if (_this.assetIdString === undefined)
                    _this.assetIdString = null;
                if (_this.quantityNQTString === undefined)
                    _this.quantityNQTString = null;
                if (_this.priceNQTString === undefined)
                    _this.priceNQTString = null;
                _this.publicKeyValue = eqh.util.Convert.parseHexString(publicKeyValue);
                _this.ecBlockHeightString = ecBlockHeightString;
                _this.ecBlockIdString = ecBlockIdString;
                _this.deadlineValue = deadlineValue;
                _this.assetIdString = assetIdString;
                _this.quantityNQTString = quantityNQTString;
                _this.priceNQTString = priceNQTString;
                _this.referencedTransactionFullHash = referencedTransactionFullHash;
                return _this;
            }
            PlaceAskOrder.prototype.createUnsignedBytes = function () {
                var unsignedBytes = "";
                var createTransaction = new eqh.http.CreateTransaction();
                var assetId = null;
                var quantityNQT = null;
                var priceNQT = null;
                try {
                    assetId = eqh.http.ParameterParser.getUnsignedLong(this.assetIdString, false);
                    quantityNQT = eqh.http.ParameterParser.getQuantityQNT(this.quantityNQTString);
                    priceNQT = eqh.http.ParameterParser.getPriceNQT(this.priceNQTString);
                }
                catch (e) {
                    console.error(e.message, e);
                }
                ;
                var attachment = new eqh.attachment.impl.ColoredCoinsOrderPlacement(assetId, quantityNQT, priceNQT);
                try {
                    unsignedBytes = createTransaction.createTransaction(this.type, this.subType, this.deadlineValue, this.referencedTransactionFullHash, this.publicKeyValue, "0", this.ecBlockHeightString, this.ecBlockIdString, 0, 0, attachment);
                }
                catch (e) {
                    console.error(e.message, e);
                }
                ;
                return unsignedBytes;
            };
            return PlaceAskOrder;
        }(eqh.transaction.Transaction));
        transaction.PlaceAskOrder = PlaceAskOrder;
        PlaceAskOrder["__class"] = "eqh.transaction.PlaceAskOrder";
    })(transaction = eqh.transaction || (eqh.transaction = {}));
})(eqh || (eqh = {}));
