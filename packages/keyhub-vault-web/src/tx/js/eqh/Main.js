/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var Main = (function () {
        function Main() {
        }
        Main.main = function (args) {
            var deadlineValue = "1440";
            var referencedTransactionFullHash = "d94baf764f0b7e47dbbe30c5aef1694fef6dfd2ecc7c86e29eefee7e6d1b2b39";
            var publicKeyValue = "cd64c80d48c64609e74361df1f89f0b40644f8f9e3a21c05dbae28e9ed0b2a14";
            var feeNqt = "0";
            var ecBlockHeightString = "2772";
            var ecBlockIdString = "17321329645912574173";
            var recipientId = 7085494951750991876;
            var amountNQT = 1;
            console.info("SEND MONEY");
            var sm = new eqh.transaction.SendMoney(publicKeyValue, ecBlockHeightString, ecBlockIdString, null, deadlineValue, recipientId, amountNQT);
            console.info(sm.createUnsignedBytes());
            console.info("\n\n\n");
            console.info("ASK ORDER");
            var pao = new eqh.transaction.PlaceAskOrder(publicKeyValue, ecBlockHeightString, ecBlockIdString, null, deadlineValue, "6889644787748004524", "1000000", "100");
            console.info(pao.createUnsignedBytes());
            console.info("\n\n\n");
            console.info("BID ORDER");
            var pbd = new eqh.transaction.PlaceBidOrder(publicKeyValue, ecBlockHeightString, ecBlockIdString, null, deadlineValue, "6889644787748004524", "1000000", "100");
            console.info(pbd.createUnsignedBytes());
            console.info("\n\n\n");
            console.info("SET ACCOUNT PROPERTY");
            var sap = new eqh.transaction.SetAccountProperty(publicKeyValue, ecBlockHeightString, ecBlockIdString, null, deadlineValue, recipientId, "$$Trader", "1");
            console.info(sap.createUnsignedBytes());
            console.info("\n\n\n");
        };
        return Main;
    }());
    eqh.Main = Main;
    Main["__class"] = "eqh.Main";
})(eqh || (eqh = {}));
eqh.Main.main(null);
