/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var http;
    (function (http) {
        var ParameterParser = (function () {
            function ParameterParser() {
            }
            ParameterParser.getInt = function (name, min, max, isMandatory) {
                var paramValue = eqh.util.Convert.emptyToNull(name);
                if (paramValue == null) {
                    if (isMandatory) {
                        throw new Error("NameMissing");
                    }
                    return 0;
                }
                try {
                    var value = javaemul.internal.IntegerHelper.parseInt(paramValue);
                    if (value < min || value > max) {
                        throw new Error("IncorrectRange");
                    }
                    return value;
                }
                catch (e) {
                    throw new Error("RuntimeError");
                }
                ;
            };
            ParameterParser.getLong = function (name, min, max, isMandatory) {
                var paramValue = eqh.util.Convert.emptyToNull(name);
                if (paramValue == null) {
                    if (isMandatory) {
                        throw new Error("NameMissing");
                    }
                    return 0;
                }
                try {
                    var value = javaemul.internal.LongHelper.parseLong(paramValue);
                    if (value < min || value > max) {
                        throw new Error("IncorrectRange");
                    }
                    return value;
                }
                catch (e) {
                    throw new Error("RuntimeError");
                }
                ;
            };
            ParameterParser.getQuantityQNT = function (number) {
                return ParameterParser.getLong(number, 1, eqh.Constants.MAX_ASSET_QUANTITY_QNT, true);
            };
            ParameterParser.getPriceNQT = function (number) {
                return ParameterParser.getLong(number, 1, eqh.Constants.MAX_BALANCE_NQT_$LI$(), true);
            };
            ParameterParser.getUnsignedLong = function (name, isMandatory) {
                var paramValue = eqh.util.Convert.emptyToNull(name);
                if (paramValue == null) {
                    if (isMandatory) {
                        throw new Error("NameMissing");
                    }
                    return 0;
                }
                try {
                    var value = eqh.util.Convert.parseUnsignedLong(paramValue);
                    if (value === 0) {
                        throw new Error("IncorrectRange");
                    }
                    return value;
                }
                catch (e) {
                    throw new Error("RuntimeError");
                }
                ;
            };
            ParameterParser.getFeeNQT = function (feeNQT) {
                return ParameterParser.getLong(feeNQT, 0, eqh.Constants.MAX_BALANCE_NQT_$LI$(), true);
            };
            return ParameterParser;
        }());
        http.ParameterParser = ParameterParser;
        ParameterParser["__class"] = "eqh.http.ParameterParser";
    })(http = eqh.http || (eqh.http = {}));
})(eqh || (eqh = {}));
