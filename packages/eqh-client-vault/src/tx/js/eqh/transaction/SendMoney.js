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
        var SendMoney = (function (_super) {
            __extends(SendMoney, _super);
            function SendMoney(publicKeyValue, ecBlockHeightString, ecBlockIdString, referencedTransactionFullHash, deadlineValue, recipientId, amountNQT) {
                var _this = _super.call(this, (0 | 0), (0 | 0)) || this;
                if (_this.recipientId === undefined)
                    _this.recipientId = null;
                if (_this.amountNQT === undefined)
                    _this.amountNQT = null;
                _this.publicKeyValue = eqh.util.Convert.parseHexString(publicKeyValue);
                _this.ecBlockHeightString = ecBlockHeightString;
                _this.ecBlockIdString = ecBlockIdString;
                _this.recipientId = recipientId;
                _this.deadlineValue = deadlineValue;
                _this.amountNQT = amountNQT;
                _this.referencedTransactionFullHash = referencedTransactionFullHash;
                return _this;
            }
            SendMoney.prototype.createUnsignedBytes = function () {
                var unsignedBytes = "";
                var createTransaction = new eqh.http.CreateTransaction();
                var attachment = new eqh.attachment.impl.OrdinaryPayment();
                try {
                    unsignedBytes = createTransaction.createTransaction(this.type, this.subType, this.deadlineValue, this.referencedTransactionFullHash, this.publicKeyValue, "0", this.ecBlockHeightString, this.ecBlockIdString, this.recipientId, this.amountNQT, attachment);
                }
                catch (e) {
                    console.error(e.message, e);
                }
                ;
                return unsignedBytes;
            };
            return SendMoney;
        }(eqh.transaction.Transaction));
        transaction.SendMoney = SendMoney;
        SendMoney["__class"] = "eqh.transaction.SendMoney";
    })(transaction = eqh.transaction || (eqh.transaction = {}));
})(eqh || (eqh = {}));
