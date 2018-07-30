var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var attachment;
    (function (attachment_1) {
        var impl;
        (function (impl) {
            var AccountProperty = (function (_super) {
                __extends(AccountProperty, _super);
                function AccountProperty(property, value) {
                    var _this = this;
                    if (((typeof property === 'string') || property === null) && ((typeof value === 'string') || value === null)) {
                        var __args = Array.prototype.slice.call(arguments);
                        _this = _super.call(this) || this;
                        if (_this.property === undefined)
                            _this.property = null;
                        if (_this.value === undefined)
                            _this.value = null;
                        _this.ACCOUNT_PROPERTY_FEE = new AccountProperty.AccountProperty$0(_this, eqh.Constants.ONE_EQH, eqh.Constants.ONE_EQH, 32);
                        if (_this.property === undefined)
                            _this.property = null;
                        if (_this.value === undefined)
                            _this.value = null;
                        (function () {
                            _this.property = property;
                            _this.value = value;
                        })();
                    }
                    else if (property === undefined && value === undefined) {
                        var __args = Array.prototype.slice.call(arguments);
                        _this = _super.call(this) || this;
                        if (_this.property === undefined)
                            _this.property = null;
                        if (_this.value === undefined)
                            _this.value = null;
                        _this.ACCOUNT_PROPERTY_FEE = new AccountProperty.AccountProperty$0(_this, eqh.Constants.ONE_EQH, eqh.Constants.ONE_EQH, 32);
                        if (_this.property === undefined)
                            _this.property = null;
                        if (_this.value === undefined)
                            _this.value = null;
                    }
                    else
                        throw new Error('invalid overload');
                    return _this;
                }
                AccountProperty.prototype.getVersion = function () {
                    return this.version;
                };
                /**
                 *
                 * @return {boolean}
                 */
                AccountProperty.prototype.canHaveRecipient = function () {
                    return true;
                };
                /**
                 *
                 * @param {java.nio.ByteBuffer} buffer
                 */
                AccountProperty.prototype.putMyBytes = function (buffer) {
                    var property = eqh.util.Convert.toBytes(this.property);
                    var value = eqh.util.Convert.toBytes(this.value);
                    buffer.put((property.length | 0));
                    buffer.put(property);
                    buffer.put((value.length | 0));
                    buffer.put(value);
                };
                /**
                 *
                 * @return {number}
                 */
                AccountProperty.prototype.getMySize = function () {
                    return 1 + eqh.util.Convert.toBytes(this.property).length + 1 + eqh.util.Convert.toBytes(this.value).length;
                };
                AccountProperty.prototype.getProperty = function () {
                    return this.property;
                };
                AccountProperty.prototype.setProperty = function (property) {
                    this.property = property;
                };
                AccountProperty.prototype.getValue = function () {
                    return this.value;
                };
                AccountProperty.prototype.setValue = function (value) {
                    this.value = value;
                };
                /**
                 *
                 * @return {*}
                 */
                AccountProperty.prototype.getBaselineFee = function () {
                    return this.ACCOUNT_PROPERTY_FEE;
                };
                return AccountProperty;
            }(eqh.attachment.Attachment));
            impl.AccountProperty = AccountProperty;
            AccountProperty["__class"] = "eqh.attachment.impl.AccountProperty";
            AccountProperty["__interfaces"] = ["eqh.attachment.Appendix"];
            (function (AccountProperty) {
                var AccountProperty$0 = (function (_super) {
                    __extends(AccountProperty$0, _super);
                    function AccountProperty$0(__parent, __arg0, __arg1, __arg2) {
                        var _this = _super.call(this, __arg0, __arg1, __arg2) || this;
                        _this.__parent = __parent;
                        return _this;
                    }
                    /**
                     *
                     * @param {eqh.TransactionImpl} transaction
                     * @param {*} appendage
                     * @return {number}
                     */
                    AccountProperty$0.prototype.getSize = function (transaction, appendage) {
                        var attachment = transaction.getAttachment();
                        return attachment.getValue().length;
                    };
                    return AccountProperty$0;
                }(eqh.Fee.SizeBasedFee));
                AccountProperty.AccountProperty$0 = AccountProperty$0;
                AccountProperty$0["__interfaces"] = ["eqh.Fee"];
            })(AccountProperty = impl.AccountProperty || (impl.AccountProperty = {}));
        })(impl = attachment_1.impl || (attachment_1.impl = {}));
    })(attachment = eqh.attachment || (eqh.attachment = {}));
})(eqh || (eqh = {}));
