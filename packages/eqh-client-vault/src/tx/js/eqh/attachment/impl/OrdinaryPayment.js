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
            var OrdinaryPayment = (function (_super) {
                __extends(OrdinaryPayment, _super);
                function OrdinaryPayment() {
                    return _super.call(this, (0 | 0)) || this;
                }
                /**
                 *
                 * @return {number}
                 */
                OrdinaryPayment.prototype.getMySize = function () {
                    return 0;
                };
                /**
                 *
                 * @param {java.nio.ByteBuffer} buffer
                 */
                OrdinaryPayment.prototype.putMyBytes = function (buffer) {
                };
                /**
                 *
                 * @return {boolean}
                 */
                OrdinaryPayment.prototype.canHaveRecipient = function () {
                    return true;
                };
                /**
                 *
                 * @return {*}
                 */
                OrdinaryPayment.prototype.getBaselineFee = function () {
                    return new eqh.Fee.ConstantFee(eqh.Constants.ONE_EQH);
                };
                return OrdinaryPayment;
            }(eqh.attachment.Attachment));
            impl.OrdinaryPayment = OrdinaryPayment;
            OrdinaryPayment["__class"] = "eqh.attachment.impl.OrdinaryPayment";
            OrdinaryPayment["__interfaces"] = ["eqh.attachment.Appendix"];
        })(impl = attachment.impl || (attachment.impl = {}));
    })(attachment = eqh.attachment || (eqh.attachment = {}));
})(eqh || (eqh = {}));
