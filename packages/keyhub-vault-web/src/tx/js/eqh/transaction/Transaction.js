/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var transaction;
    (function (transaction) {
        var Transaction = (function () {
            function Transaction(type, subType) {
                if (this.type === undefined)
                    this.type = 0;
                if (this.subType === undefined)
                    this.subType = 0;
                if (this.publicKeyValue === undefined)
                    this.publicKeyValue = null;
                if (this.ecBlockHeightString === undefined)
                    this.ecBlockHeightString = null;
                if (this.ecBlockIdString === undefined)
                    this.ecBlockIdString = null;
                if (this.deadlineValue === undefined)
                    this.deadlineValue = null;
                if (this.feeNqt === undefined)
                    this.feeNqt = null;
                if (this.referencedTransactionFullHash === undefined)
                    this.referencedTransactionFullHash = null;
                this.type = type;
                this.subType = subType;
            }
            Transaction.prototype.setPublicKeyValue = function (publicKeyValue) {
                this.publicKeyValue = publicKeyValue;
            };
            Transaction.prototype.getEcBlockHeightString = function () {
                return this.ecBlockHeightString;
            };
            Transaction.prototype.setEcBlockHeightString = function (ecBlockHeightString) {
                this.ecBlockHeightString = ecBlockHeightString;
            };
            Transaction.prototype.getEcBlockIdString = function () {
                return this.ecBlockIdString;
            };
            Transaction.prototype.setEcBlockIdString = function (ecBlockIdString) {
                this.ecBlockIdString = ecBlockIdString;
            };
            Transaction.prototype.getDeadlineValue = function () {
                return this.deadlineValue;
            };
            Transaction.prototype.setDeadlineValue = function (deadlineValue) {
                this.deadlineValue = deadlineValue;
            };
            Transaction.prototype.getFeeNqt = function () {
                return this.feeNqt;
            };
            Transaction.prototype.setFeeNqt = function (feeNqt) {
                this.feeNqt = feeNqt;
            };
            Transaction.prototype.getType = function () {
                return this.type;
            };
            Transaction.prototype.setType = function (type) {
                this.type = type;
            };
            Transaction.prototype.getSubType = function () {
                return this.subType;
            };
            Transaction.prototype.setSubType = function (subType) {
                this.subType = subType;
            };
            return Transaction;
        }());
        transaction.Transaction = Transaction;
        Transaction["__class"] = "eqh.transaction.Transaction";
    })(transaction = eqh.transaction || (eqh.transaction = {}));
})(eqh || (eqh = {}));
