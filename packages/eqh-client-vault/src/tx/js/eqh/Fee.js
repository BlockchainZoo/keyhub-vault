/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var Fee;
    (function (Fee) {
        var ConstantFee = (function () {
            function ConstantFee(fee) {
                if (this.fee === undefined)
                    this.fee = 0;
                this.fee = fee;
            }
            /**
             *
             * @param {eqh.TransactionImpl} transaction
             * @param {*} appendage
             * @return {number}
             */
            ConstantFee.prototype.getFee = function (transaction, appendage) {
                return (function (n) { return n < 0 ? Math.ceil(n) : Math.floor(n); })(this.fee / eqh.Constants.REDUCTOR_FEE);
            };
            return ConstantFee;
        }());
        Fee.ConstantFee = ConstantFee;
        ConstantFee["__class"] = "eqh.Fee.ConstantFee";
        ConstantFee["__interfaces"] = ["eqh.Fee"];
        var SizeBasedFee = (function () {
            function SizeBasedFee(constantFee, feePerSize, unitSize) {
                var _this = this;
                if (((typeof constantFee === 'number') || constantFee === null) && ((typeof feePerSize === 'number') || feePerSize === null) && ((typeof unitSize === 'number') || unitSize === null)) {
                    var __args = Array.prototype.slice.call(arguments);
                    if (this.constantFee === undefined)
                        this.constantFee = 0;
                    if (this.feePerSize === undefined)
                        this.feePerSize = 0;
                    if (this.unitSize === undefined)
                        this.unitSize = 0;
                    if (this.constantFee === undefined)
                        this.constantFee = 0;
                    if (this.feePerSize === undefined)
                        this.feePerSize = 0;
                    if (this.unitSize === undefined)
                        this.unitSize = 0;
                    (function () {
                        _this.constantFee = constantFee;
                        _this.feePerSize = feePerSize;
                        _this.unitSize = unitSize;
                    })();
                }
                else if (((typeof constantFee === 'number') || constantFee === null) && ((typeof feePerSize === 'number') || feePerSize === null) && unitSize === undefined) {
                    var __args = Array.prototype.slice.call(arguments);
                    {
                        var __args_1 = Array.prototype.slice.call(arguments);
                        var unitSize_1 = 1024;
                        if (this.constantFee === undefined)
                            this.constantFee = 0;
                        if (this.feePerSize === undefined)
                            this.feePerSize = 0;
                        if (this.unitSize === undefined)
                            this.unitSize = 0;
                        if (this.constantFee === undefined)
                            this.constantFee = 0;
                        if (this.feePerSize === undefined)
                            this.feePerSize = 0;
                        if (this.unitSize === undefined)
                            this.unitSize = 0;
                        (function () {
                            _this.constantFee = constantFee;
                            _this.feePerSize = feePerSize;
                            _this.unitSize = unitSize_1;
                        })();
                    }
                }
                else if (((typeof constantFee === 'number') || constantFee === null) && feePerSize === undefined && unitSize === undefined) {
                    var __args = Array.prototype.slice.call(arguments);
                    var feePerSize_1 = __args[0];
                    {
                        var __args_2 = Array.prototype.slice.call(arguments);
                        var constantFee_1 = 0;
                        {
                            var __args_3 = Array.prototype.slice.call(arguments);
                            var unitSize_2 = 1024;
                            if (this.constantFee === undefined)
                                this.constantFee = 0;
                            if (this.feePerSize === undefined)
                                this.feePerSize = 0;
                            if (this.unitSize === undefined)
                                this.unitSize = 0;
                            if (this.constantFee === undefined)
                                this.constantFee = 0;
                            if (this.feePerSize === undefined)
                                this.feePerSize = 0;
                            if (this.unitSize === undefined)
                                this.unitSize = 0;
                            (function () {
                                _this.constantFee = constantFee_1;
                                _this.feePerSize = feePerSize_1;
                                _this.unitSize = unitSize_2;
                            })();
                        }
                    }
                }
                else
                    throw new Error('invalid overload');
            }
            /**
             *
             * @param {eqh.TransactionImpl} transaction
             * @param {*} appendage
             * @return {number}
             */
            SizeBasedFee.prototype.getFee = function (transaction, appendage) {
                var height = transaction.getHeight();
                var size = this.getSize(transaction, appendage) - 1;
                if (size < 0) {
                    return (function (n) { return n < 0 ? Math.ceil(n) : Math.floor(n); })(this.constantFee / eqh.Constants.REDUCTOR_FEE);
                }
                var constantFee = 0;
                var feePerSize = 0;
                var fee = 0;
                if (height <= eqh.Constants.NEW_FEE_CALCULATION_BLOCK) {
                    constantFee = (function (n) { return n < 0 ? Math.ceil(n) : Math.floor(n); })((this.constantFee < eqh.Constants.ONE_EQH ? eqh.Constants.ONE_EQH : this.constantFee) / eqh.Constants.REDUCTOR_FEE);
                    feePerSize = this.feePerSize;
                    fee = (constantFee + (function (n) { return n < 0 ? Math.ceil(n) : Math.floor(n); })(((function (n) { return n < 0 ? Math.ceil(n) : Math.floor(n); })(((size / this.unitSize | 0))) * feePerSize) / eqh.Constants.REDUCTOR_FEE));
                    return fee < (function (n) { return n < 0 ? Math.ceil(n) : Math.floor(n); })(eqh.Constants.ONE_EQH / eqh.Constants.REDUCTOR_FEE) ? (function (n) { return n < 0 ? Math.ceil(n) : Math.floor(n); })(eqh.Constants.ONE_EQH / eqh.Constants.REDUCTOR_FEE) : fee;
                }
                if (this.constantFee === 0)
                    constantFee = 0;
                else
                    constantFee = (function (n) { return n < 0 ? Math.ceil(n) : Math.floor(n); })((this.constantFee < eqh.Constants.ONE_EQH ? eqh.Constants.ONE_EQH : this.constantFee) / eqh.Constants.REDUCTOR_FEE);
                if (this.feePerSize === 0)
                    feePerSize = 0;
                else
                    feePerSize = (function (n) { return n < 0 ? Math.ceil(n) : Math.floor(n); })((this.feePerSize < eqh.Constants.ONE_EQH ? eqh.Constants.ONE_EQH : this.feePerSize) / eqh.Constants.REDUCTOR_FEE);
                fee = (constantFee + ((function (n) { return n < 0 ? Math.ceil(n) : Math.floor(n); })(((size / this.unitSize | 0))) * feePerSize));
                if (fee !== 0) {
                    fee = (function (n) { return n < 0 ? Math.ceil(n) : Math.floor(n); })((fee < eqh.Constants.ONE_EQH ? eqh.Constants.ONE_EQH : fee) / eqh.Constants.REDUCTOR_FEE);
                }
                return fee;
            };
            return SizeBasedFee;
        }());
        Fee.SizeBasedFee = SizeBasedFee;
        SizeBasedFee["__class"] = "eqh.Fee.SizeBasedFee";
        SizeBasedFee["__interfaces"] = ["eqh.Fee"];
    })(Fee = eqh.Fee || (eqh.Fee = {}));
})(eqh || (eqh = {}));
