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
        var SetAccountProperty = (function (_super) {
            __extends(SetAccountProperty, _super);
            function SetAccountProperty(publicKeyValue, ecBlockHeightString, ecBlockIdString, referencedTransactionFullHash, deadlineValue, recipientId, property, value) {
                var _this = _super.call(this, (1 | 0), (10 | 0)) || this;
                if (_this.recipientId === undefined)
                    _this.recipientId = null;
                if (_this.amountNQT === undefined)
                    _this.amountNQT = null;
                if (_this.property === undefined)
                    _this.property = null;
                if (_this.value === undefined)
                    _this.value = null;
                _this.publicKeyValue = eqh.util.Convert.parseHexString(publicKeyValue);
                _this.ecBlockHeightString = ecBlockHeightString;
                _this.ecBlockIdString = ecBlockIdString;
                _this.recipientId = recipientId;
                _this.deadlineValue = deadlineValue;
                _this.amountNQT = 0;
                _this.referencedTransactionFullHash = referencedTransactionFullHash;
                _this.property = property;
                _this.value = value;
                return _this;
            }
            SetAccountProperty.prototype.createUnsignedBytes = function () {
                var unsignedBytes = "";
                var createTransaction = new eqh.http.CreateTransaction();
                var attachment = new eqh.attachment.impl.AccountProperty(this.property, this.value);
                try {
                    unsignedBytes = createTransaction.createTransaction(this.type, this.subType, this.deadlineValue, this.referencedTransactionFullHash, this.publicKeyValue, "0", this.ecBlockHeightString, this.ecBlockIdString, this.recipientId, this.amountNQT, attachment);
                }
                catch (e) {
                    console.error(e.message, e);
                }
                ;
                return unsignedBytes;
            };
            return SetAccountProperty;
        }(eqh.transaction.Transaction));
        transaction.SetAccountProperty = SetAccountProperty;
        SetAccountProperty["__class"] = "eqh.transaction.SetAccountProperty";
    })(transaction = eqh.transaction || (eqh.transaction = {}));
})(eqh || (eqh = {}));
