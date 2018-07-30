/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var http;
    (function (http) {
        var CreateTransaction = (function () {
            function CreateTransaction() {
            }
            CreateTransaction.newTransactionBuilder = function (senderPublicKey, type, subType, amountNQT, feeNQT, deadline, attachment) {
                return new eqh.TransactionImpl.BuilderImpl((1 | 0), type, subType, senderPublicKey, amountNQT, feeNQT, deadline, attachment);
            };
            CreateTransaction.prototype.createTransaction = function (type, subType, deadlineValue, referencedTransactionFullHash, publicKey, feeNqt, ecBlockHeightString, ecBlockIdString, recipientId, amountNQT, attachment) {
                var deadline;
                try {
                    deadline = javaemul.internal.ShortHelper.parseShort(deadlineValue);
                    if (deadline < 1) {
                        return "INCORRECT_DEADLINE";
                    }
                }
                catch (e) {
                    console.error(e.message, e);
                    return "INCORRECT_DEADLINE";
                }
                ;
                var feeNQT = eqh.http.ParameterParser.getFeeNQT(feeNqt);
                var ecBlockHeight = eqh.http.ParameterParser.getInt(ecBlockHeightString, 0, javaemul.internal.IntegerHelper.MAX_VALUE, false);
                var ecBlockId = eqh.http.ParameterParser.getUnsignedLong(ecBlockIdString, false);
                var builder = CreateTransaction.newTransactionBuilder(publicKey, type, subType, amountNQT, feeNQT, deadline, attachment).referencedTransactionFullHash(referencedTransactionFullHash);
                if (attachment.canHaveRecipient()) {
                    builder.recipientId(recipientId);
                }
                if (ecBlockId !== 0) {
                    builder.ecBlockId(ecBlockId);
                    builder.ecBlockHeight(ecBlockHeight);
                }
                var transaction = builder.build(null);
                var result = "";
                try {
                    var unsignedTransactionBytes = transaction.getUnsignedBytes();
                    result = eqh.util.Convert.toHexString(unsignedTransactionBytes);
                }
                catch (ignore) {
                }
                ;
                return result;
            };
            return CreateTransaction;
        }());
        http.CreateTransaction = CreateTransaction;
        CreateTransaction["__class"] = "eqh.http.CreateTransaction";
    })(http = eqh.http || (eqh.http = {}));
})(eqh || (eqh = {}));
