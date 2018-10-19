var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var EqhException = (function (_super) {
        __extends(EqhException, _super);
        function EqhException(message, cause) {
            var _this = this;
            if (((typeof message === 'string') || message === null) && ((cause != null && cause instanceof Error) || cause === null)) {
                var __args = Array.prototype.slice.call(arguments);
                _this = _super.call(this, message) || this;
                _this.message = message;
                Object.setPrototypeOf(_this, EqhException.prototype);
            }
            else if (((typeof message === 'string') || message === null) && cause === undefined) {
                var __args = Array.prototype.slice.call(arguments);
                _this = _super.call(this, message) || this;
                _this.message = message;
                Object.setPrototypeOf(_this, EqhException.prototype);
            }
            else if (((message != null && message instanceof Error) || message === null) && cause === undefined) {
                var __args = Array.prototype.slice.call(arguments);
                var cause_1 = __args[0];
                _this = _super.call(this, cause_1) || this;
                _this.message = cause_1;
                Object.setPrototypeOf(_this, EqhException.prototype);
            }
            else if (message === undefined && cause === undefined) {
                var __args = Array.prototype.slice.call(arguments);
                _this = _super.call(this) || this;
                Object.setPrototypeOf(_this, EqhException.prototype);
            }
            else
                throw new Error('invalid overload');
            return _this;
        }
        return EqhException;
    }(Error));
    eqh.EqhException = EqhException;
    EqhException["__class"] = "eqh.EqhException";
    EqhException["__interfaces"] = ["java.io.Serializable"];
    (function (EqhException) {
        var ValidationException = (function (_super) {
            __extends(ValidationException, _super);
            function ValidationException(message, cause) {
                var _this = this;
                if (((typeof message === 'string') || message === null) && ((cause != null && cause instanceof Error) || cause === null)) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message, cause) || this;
                    Object.setPrototypeOf(_this, ValidationException.prototype);
                }
                else if (((typeof message === 'string') || message === null) && cause === undefined) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message) || this;
                    Object.setPrototypeOf(_this, ValidationException.prototype);
                }
                else
                    throw new Error('invalid overload');
                return _this;
            }
            return ValidationException;
        }(eqh.EqhException));
        EqhException.ValidationException = ValidationException;
        ValidationException["__class"] = "eqh.EqhException.ValidationException";
        ValidationException["__interfaces"] = ["java.io.Serializable"];
        var NotYetEncryptedException = (function (_super) {
            __extends(NotYetEncryptedException, _super);
            function NotYetEncryptedException(message, cause) {
                var _this = this;
                if (((typeof message === 'string') || message === null) && ((cause != null && cause instanceof Error) || cause === null)) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message, cause) || this;
                    Object.setPrototypeOf(_this, NotYetEncryptedException.prototype);
                }
                else if (((typeof message === 'string') || message === null) && cause === undefined) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message) || this;
                    Object.setPrototypeOf(_this, NotYetEncryptedException.prototype);
                }
                else
                    throw new Error('invalid overload');
                return _this;
            }
            return NotYetEncryptedException;
        }(java.lang.IllegalStateException));
        EqhException.NotYetEncryptedException = NotYetEncryptedException;
        NotYetEncryptedException["__class"] = "eqh.EqhException.NotYetEncryptedException";
        NotYetEncryptedException["__interfaces"] = ["java.io.Serializable"];
        var StopException = (function (_super) {
            __extends(StopException, _super);
            function StopException(message, cause) {
                var _this = this;
                if (((typeof message === 'string') || message === null) && ((cause != null && cause instanceof Error) || cause === null)) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message, cause) || this;
                    Object.setPrototypeOf(_this, StopException.prototype);
                }
                else if (((typeof message === 'string') || message === null) && cause === undefined) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message) || this;
                    Object.setPrototypeOf(_this, StopException.prototype);
                }
                else
                    throw new Error('invalid overload');
                return _this;
            }
            return StopException;
        }(java.lang.RuntimeException));
        EqhException.StopException = StopException;
        StopException["__class"] = "eqh.EqhException.StopException";
        StopException["__interfaces"] = ["java.io.Serializable"];
        var EqhIOException = (function (_super) {
            __extends(EqhIOException, _super);
            function EqhIOException(message, cause) {
                var _this = this;
                if (((typeof message === 'string') || message === null) && ((cause != null && cause instanceof Error) || cause === null)) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message, cause) || this;
                    Object.setPrototypeOf(_this, EqhIOException.prototype);
                }
                else if (((typeof message === 'string') || message === null) && cause === undefined) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message) || this;
                    Object.setPrototypeOf(_this, EqhIOException.prototype);
                }
                else
                    throw new Error('invalid overload');
                return _this;
            }
            return EqhIOException;
        }(java.io.IOException));
        EqhException.EqhIOException = EqhIOException;
        EqhIOException["__class"] = "eqh.EqhException.EqhIOException";
        EqhIOException["__interfaces"] = ["java.io.Serializable"];
        var NotCurrentlyValidException = (function (_super) {
            __extends(NotCurrentlyValidException, _super);
            function NotCurrentlyValidException(message, cause) {
                var _this = this;
                if (((typeof message === 'string') || message === null) && ((cause != null && cause instanceof Error) || cause === null)) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message, cause) || this;
                    Object.setPrototypeOf(_this, NotCurrentlyValidException.prototype);
                }
                else if (((typeof message === 'string') || message === null) && cause === undefined) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message) || this;
                    Object.setPrototypeOf(_this, NotCurrentlyValidException.prototype);
                }
                else
                    throw new Error('invalid overload');
                return _this;
            }
            return NotCurrentlyValidException;
        }(EqhException.ValidationException));
        EqhException.NotCurrentlyValidException = NotCurrentlyValidException;
        NotCurrentlyValidException["__class"] = "eqh.EqhException.NotCurrentlyValidException";
        NotCurrentlyValidException["__interfaces"] = ["java.io.Serializable"];
        var NotValidException = (function (_super) {
            __extends(NotValidException, _super);
            function NotValidException(message, cause) {
                var _this = this;
                if (((typeof message === 'string') || message === null) && ((cause != null && cause instanceof Error) || cause === null)) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message, cause) || this;
                    Object.setPrototypeOf(_this, NotValidException.prototype);
                }
                else if (((typeof message === 'string') || message === null) && cause === undefined) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message) || this;
                    Object.setPrototypeOf(_this, NotValidException.prototype);
                }
                else
                    throw new Error('invalid overload');
                return _this;
            }
            return NotValidException;
        }(EqhException.ValidationException));
        EqhException.NotValidException = NotValidException;
        NotValidException["__class"] = "eqh.EqhException.NotValidException";
        NotValidException["__interfaces"] = ["java.io.Serializable"];
        var ExistingTransactionException = (function (_super) {
            __extends(ExistingTransactionException, _super);
            function ExistingTransactionException(message) {
                var _this = _super.call(this, message) || this;
                Object.setPrototypeOf(_this, ExistingTransactionException.prototype);
                return _this;
            }
            return ExistingTransactionException;
        }(EqhException.NotCurrentlyValidException));
        EqhException.ExistingTransactionException = ExistingTransactionException;
        ExistingTransactionException["__class"] = "eqh.EqhException.ExistingTransactionException";
        ExistingTransactionException["__interfaces"] = ["java.io.Serializable"];
        var NotYetEnabledException = (function (_super) {
            __extends(NotYetEnabledException, _super);
            function NotYetEnabledException(message, throwable) {
                var _this = this;
                if (((typeof message === 'string') || message === null) && ((throwable != null && throwable instanceof Error) || throwable === null)) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message, throwable) || this;
                    Object.setPrototypeOf(_this, NotYetEnabledException.prototype);
                }
                else if (((typeof message === 'string') || message === null) && throwable === undefined) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message) || this;
                    Object.setPrototypeOf(_this, NotYetEnabledException.prototype);
                }
                else
                    throw new Error('invalid overload');
                return _this;
            }
            return NotYetEnabledException;
        }(EqhException.NotCurrentlyValidException));
        EqhException.NotYetEnabledException = NotYetEnabledException;
        NotYetEnabledException["__class"] = "eqh.EqhException.NotYetEnabledException";
        NotYetEnabledException["__interfaces"] = ["java.io.Serializable"];
        var AccountControlException = (function (_super) {
            __extends(AccountControlException, _super);
            function AccountControlException(message, cause) {
                var _this = this;
                if (((typeof message === 'string') || message === null) && ((cause != null && cause instanceof Error) || cause === null)) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message, cause) || this;
                    Object.setPrototypeOf(_this, AccountControlException.prototype);
                }
                else if (((typeof message === 'string') || message === null) && cause === undefined) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message) || this;
                    Object.setPrototypeOf(_this, AccountControlException.prototype);
                }
                else
                    throw new Error('invalid overload');
                return _this;
            }
            return AccountControlException;
        }(EqhException.NotCurrentlyValidException));
        EqhException.AccountControlException = AccountControlException;
        AccountControlException["__class"] = "eqh.EqhException.AccountControlException";
        AccountControlException["__interfaces"] = ["java.io.Serializable"];
        var InsufficientBalanceException = (function (_super) {
            __extends(InsufficientBalanceException, _super);
            function InsufficientBalanceException(message, cause) {
                var _this = this;
                if (((typeof message === 'string') || message === null) && ((cause != null && cause instanceof Error) || cause === null)) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message, cause) || this;
                    Object.setPrototypeOf(_this, InsufficientBalanceException.prototype);
                }
                else if (((typeof message === 'string') || message === null) && cause === undefined) {
                    var __args = Array.prototype.slice.call(arguments);
                    _this = _super.call(this, message) || this;
                    Object.setPrototypeOf(_this, InsufficientBalanceException.prototype);
                }
                else
                    throw new Error('invalid overload');
                return _this;
            }
            return InsufficientBalanceException;
        }(EqhException.NotCurrentlyValidException));
        EqhException.InsufficientBalanceException = InsufficientBalanceException;
        InsufficientBalanceException["__class"] = "eqh.EqhException.InsufficientBalanceException";
        InsufficientBalanceException["__interfaces"] = ["java.io.Serializable"];
    })(EqhException = eqh.EqhException || (eqh.EqhException = {}));
})(eqh || (eqh = {}));
