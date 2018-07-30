/* Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org */
var eqh;
(function (eqh) {
    var TransactionImpl = (function () {
        function TransactionImpl(builder, secretPhrase) {
            /*private*/ this.height = javaemul.internal.IntegerHelper.MAX_VALUE;
            /*private*/ this.blockTimestamp = -1;
            /*private*/ this.index = -1;
            /*private*/ this.__bytes = null;
            if (this.deadline === undefined)
                this.deadline = 0;
            if (this.senderPublicKey === undefined)
                this.senderPublicKey = null;
            if (this.recipientId === undefined)
                this.recipientId = 0;
            if (this.amountNQT === undefined)
                this.amountNQT = 0;
            if (this.feeNQT === undefined)
                this.feeNQT = 0;
            if (this.referencedTransactionFullHash === undefined)
                this.referencedTransactionFullHash = null;
            if (this.ecBlockHeight === undefined)
                this.ecBlockHeight = 0;
            if (this.ecBlockId === undefined)
                this.ecBlockId = 0;
            if (this.version === undefined)
                this.version = 0;
            if (this.type === undefined)
                this.type = 0;
            if (this.subType === undefined)
                this.subType = 0;
            if (this.attachment === undefined)
                this.attachment = null;
            if (this.appendages === undefined)
                this.appendages = null;
            if (this.appendagesSize === undefined)
                this.appendagesSize = 0;
            if (this.timestamp === undefined)
                this.timestamp = 0;
            if (this.signature === undefined)
                this.signature = null;
            if (this.blockId === undefined)
                this.blockId = 0;
            if (this.id === undefined)
                this.id = 0;
            if (this.stringId === undefined)
                this.stringId = null;
            if (this.senderId === undefined)
                this.senderId = 0;
            if (this.fullHash === undefined)
                this.fullHash = null;
            this.timestamp = builder.__timestamp;
            this.deadline = builder.deadline;
            this.senderPublicKey = builder.senderPublicKey;
            this.recipientId = builder.__recipientId;
            this.amountNQT = builder.amountNQT;
            this.referencedTransactionFullHash = builder.__referencedTransactionFullHash;
            this.version = builder.version;
            this.type = builder.type;
            this.subType = builder.subType;
            this.blockId = builder.__blockId;
            this.height = builder.__height;
            this.index = builder.__index;
            this.id = builder.__id;
            this.senderId = builder.__senderId;
            this.blockTimestamp = builder.__blockTimestamp;
            this.fullHash = builder.__fullHash;
            this.ecBlockHeight = builder.__ecBlockHeight;
            this.ecBlockId = builder.__ecBlockId;
            var list = (new java.util.ArrayList());
            if ((this.attachment = builder.attachment) != null) {
                list.add(this.attachment);
            }
            this.appendages = java.util.Collections.unmodifiableList(list);
            var appendagesSize = 0;
            for (var index121 = this.appendages.iterator(); index121.hasNext();) {
                var appendage = index121.next();
                {
                    appendagesSize += appendage.getSize();
                }
            }
            this.appendagesSize = appendagesSize;
            this.feeNQT = this.calculateNQTFee();
            if (builder.__signature != null && secretPhrase != null) {
                throw new eqh.EqhException.NotValidException("Transaction is already signed");
            }
            else if (builder.__signature != null) {
                this.signature = builder.__signature;
            }
            else if (secretPhrase != null) {
                if (this.getSenderPublicKey() != null && !java.util.Arrays.equals(this.senderPublicKey, eqh.crypto.Crypto.getPublicKey(secretPhrase))) {
                    throw new eqh.EqhException.NotValidException("Secret phrase doesn\'t match transaction sender public key");
                }
                this.signature = eqh.crypto.Crypto.sign(this.bytes(), secretPhrase);
                this.__bytes = null;
            }
            else {
                this.signature = null;
            }
        }
        TransactionImpl.prototype.getHeight = function () {
            return this.height;
        };
        TransactionImpl.prototype.getSignature = function () {
            return this.signature;
        };
        TransactionImpl.prototype.getVersion = function () {
            return this.version;
        };
        TransactionImpl.prototype.getTimestamp = function () {
            return this.timestamp;
        };
        TransactionImpl.prototype.getSenderPublicKey = function () {
            return this.senderPublicKey;
        };
        TransactionImpl.prototype.getBytes = function () {
            return java.util.Arrays.copyOf(this.bytes(), this.__bytes.length);
        };
        TransactionImpl.prototype.getAttachment = function () {
            return this.attachment;
        };
        TransactionImpl.prototype.calculateNQTFee = function () {
            var totalFee = 0;
            for (var index122 = this.appendages.iterator(); index122.hasNext();) {
                var appendage = index122.next();
                {
                    var fee = appendage.getBaselineFee();
                    totalFee += fee.getFee(this, appendage);
                }
            }
            if (this.referencedTransactionFullHash != null) {
                totalFee += eqh.Constants.ONE_EQH;
            }
            return totalFee;
        };
        TransactionImpl.prototype.bytes = function () {
            if (this.__bytes == null) {
                try {
                    var buffer = java.nio.ByteBuffer.allocate(this.getSize());
                    buffer.order(java.nio.ByteOrder.LITTLE_ENDIAN);
                    buffer.put((this.type | 0));
                    buffer.put((((this.version << 4) | (this.subType | 0)) | 0));
                    buffer.putInt(this.timestamp);
                    buffer.putShort(this.deadline);
                    buffer.put(this.getSenderPublicKey());
                    buffer.putLong(this.recipientId);
                    if (this.useNQT()) {
                        buffer.putLong(this.amountNQT);
                        buffer.putLong(this.feeNQT);
                        if (this.referencedTransactionFullHash != null) {
                            buffer.put(this.referencedTransactionFullHash);
                        }
                        else {
                            buffer.put((function (s) { var a = []; while (s-- > 0)
                                a.push(0); return a; })(32));
                        }
                    }
                    buffer.put(this.signature != null ? this.signature : (function (s) { var a = []; while (s-- > 0)
                        a.push(0); return a; })(64));
                    if (this.version > 0) {
                        buffer.putInt(this.getFlags());
                        buffer.putInt(this.ecBlockHeight);
                        buffer.putLong(this.ecBlockId);
                    }
                    for (var index123 = this.appendages.iterator(); index123.hasNext();) {
                        var appendage = index123.next();
                        {
                            appendage.putBytes(buffer);
                        }
                    }
                    this.__bytes = buffer.array();
                }
                catch (e) {
                    if (this.signature != null) {
                        console.info("signature exist");
                    }
                    throw e;
                }
                ;
            }
            return this.__bytes;
        };
        TransactionImpl.prototype.getUnsignedBytes = function () {
            return this.zeroSignature(this.getBytes());
        };
        TransactionImpl.prototype.getSize = function () {
            return this.signatureOffset() + 64 + (this.version > 0 ? 4 + 4 + 8 : 0) + this.appendagesSize;
        };
        TransactionImpl.prototype.signatureOffset = function () {
            return 1 + 1 + 4 + 2 + 32 + 8 + (this.useNQT() ? 8 + 8 + 32 : 4 + 4 + 8);
        };
        TransactionImpl.prototype.useNQT = function () {
            return true;
        };
        TransactionImpl.prototype.zeroSignature = function (data) {
            var start = this.signatureOffset();
            for (var i = start; i < start + 64; i++) {
                data[i] = 0;
            }
            ;
            return data;
        };
        TransactionImpl.prototype.getFlags = function () {
            var flags = 0;
            return flags;
        };
        return TransactionImpl;
    }());
    eqh.TransactionImpl = TransactionImpl;
    TransactionImpl["__class"] = "eqh.TransactionImpl";
    (function (TransactionImpl) {
        var BuilderImpl = (function () {
            function BuilderImpl(version, type, subType, senderPublicKey, amountNQT, feeNQT, deadline, attachment) {
                this.__height = javaemul.internal.IntegerHelper.MAX_VALUE;
                this.__timestamp = javaemul.internal.IntegerHelper.MAX_VALUE;
                this.__blockTimestamp = -1;
                this.ecBlockSet = false;
                this.__index = -1;
                if (this.deadline === undefined)
                    this.deadline = 0;
                if (this.senderPublicKey === undefined)
                    this.senderPublicKey = null;
                if (this.amountNQT === undefined)
                    this.amountNQT = 0;
                if (this.feeNQT === undefined)
                    this.feeNQT = 0;
                if (this.version === undefined)
                    this.version = 0;
                if (this.type === undefined)
                    this.type = 0;
                if (this.subType === undefined)
                    this.subType = 0;
                if (this.attachment === undefined)
                    this.attachment = null;
                if (this.__recipientId === undefined)
                    this.__recipientId = 0;
                if (this.__referencedTransactionFullHash === undefined)
                    this.__referencedTransactionFullHash = null;
                if (this.__signature === undefined)
                    this.__signature = null;
                if (this.__blockId === undefined)
                    this.__blockId = 0;
                if (this.__id === undefined)
                    this.__id = 0;
                if (this.__senderId === undefined)
                    this.__senderId = 0;
                if (this.__fullHash === undefined)
                    this.__fullHash = null;
                if (this.__ecBlockHeight === undefined)
                    this.__ecBlockHeight = 0;
                if (this.__ecBlockId === undefined)
                    this.__ecBlockId = 0;
                this.version = version;
                this.type = type;
                this.subType = subType;
                this.deadline = deadline;
                this.senderPublicKey = senderPublicKey;
                this.amountNQT = amountNQT;
                this.attachment = attachment;
                this.feeNQT = feeNQT;
            }
            BuilderImpl.prototype.build = function (secretPhrase) {
                if (this.__timestamp === javaemul.internal.IntegerHelper.MAX_VALUE) {
                    this.__timestamp = eqh.util.Convert.toEpochTime(java.lang.System.currentTimeMillis());
                }
                return new eqh.TransactionImpl(this, secretPhrase);
            };
            BuilderImpl.prototype.recipientId = function (recipientId) {
                this.__recipientId = recipientId;
                return this;
            };
            BuilderImpl.prototype.referencedTransactionFullHash = function (referencedTransactionFullHash) {
                this.__referencedTransactionFullHash = eqh.util.Convert.parseHexString(referencedTransactionFullHash);
                return this;
            };
            BuilderImpl.prototype.timestamp = function (timestamp) {
                this.__timestamp = timestamp;
                return this;
            };
            BuilderImpl.prototype.ecBlockHeight = function (height) {
                this.__ecBlockHeight = height;
                this.ecBlockSet = true;
                return this;
            };
            BuilderImpl.prototype.ecBlockId = function (blockId) {
                this.__ecBlockId = blockId;
                this.ecBlockSet = true;
                return this;
            };
            BuilderImpl.prototype.id = function (id) {
                this.__id = id;
                return this;
            };
            BuilderImpl.prototype.signature = function (signature) {
                this.__signature = signature;
                return this;
            };
            BuilderImpl.prototype.blockId = function (blockId) {
                this.__blockId = blockId;
                return this;
            };
            BuilderImpl.prototype.height = function (height) {
                this.__height = height;
                return this;
            };
            BuilderImpl.prototype.senderId = function (senderId) {
                this.__senderId = senderId;
                return this;
            };
            BuilderImpl.prototype.fullHash = function (fullHash) {
                this.__fullHash = fullHash;
                return this;
            };
            BuilderImpl.prototype.blockTimestamp = function (blockTimestamp) {
                this.__blockTimestamp = blockTimestamp;
                return this;
            };
            BuilderImpl.prototype.index = function (index) {
                this.__index = index;
                return this;
            };
            return BuilderImpl;
        }());
        TransactionImpl.BuilderImpl = BuilderImpl;
        BuilderImpl["__class"] = "eqh.TransactionImpl.BuilderImpl";
    })(TransactionImpl = eqh.TransactionImpl || (eqh.TransactionImpl = {}));
})(eqh || (eqh = {}));
