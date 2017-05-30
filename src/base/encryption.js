"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Crypto = require("crypto");
class DHParams {
}
exports.DHParams = DHParams;
class Encryption {
    constructor() {
        // An entire openssl key is of this form with DER format, then base64 encoded
        // SEQUENCE(2 elem)
        //   SEQUENCE(2 elem)
        //      OBJECT IDENTIFIER1.2.840.10045.2.1 (ecPublicKey)
        //      OBJECT IDENTIFIER1.3.132.0.34 (P-384)
        // BIT STRING(776 bit) long key here
        // Nodejs Crypto key buffer only contains the value in the bitstring, excluding type and length
        // Therefore, we tack on the rest (this hex nonsense) so openssl knows what we're talking about
        this.asn1HeaderHex = '3076301006072a8648ce3d020106052b81040022036200';
        this.dhCurve = 'secp384r1';
        this.keySize = 32;
        this.blockSize = 16;
        this.cipherAlg = 'aes-256-cfb8';
        this.hashAlg = 'sha256';
    }
    beginDHExchange() {
        this.ecdh = Crypto.createECDH(this.dhCurve);
        let result = new DHParams();
        result.publicKey = this.ecdh.generateKeys('hex', 'uncompressed');
        // The returned value is the bitstring portion of the key, tack this header on and it, base64 encode it and it becomes a blob ready for openssl
        result.publicKey = new Buffer(this.asn1HeaderHex + result.publicKey, 'hex').toString('base64');
        let rawSalt = Crypto.randomBytes(this.blockSize);
        result.salt = rawSalt.toString('base64');
        this.salt = rawSalt;
        return result;
    }
    completeDHExchange(publicKey) {
        let publicBuffer = new Buffer(publicKey, 'base64');
        // Cut off the header. Buffer is bytes, and header is in hex, where 2 characters are a byte
        publicBuffer = publicBuffer.slice(this.asn1HeaderHex.length / 2);
        let shared = this.ecdh.computeSecret(publicBuffer);
        let salted = Buffer.concat([this.salt, shared]);
        let hasher = Crypto.createHash(this.hashAlg);
        hasher.update(salted);
        this.cipherKey = hasher.digest();
        this.cipherIV = this.cipherKey.slice(0, this.blockSize);
        this.cipher = Crypto.createCipheriv(this.cipherAlg, this.cipherKey, this.cipherIV);
        this.decipher = Crypto.createDecipheriv(this.cipherAlg, this.cipherKey, this.cipherIV);
        this.cipher.setAutoPadding(false);
        this.decipher.setAutoPadding(false);
        return true;
    }
    encrypt(plainText) {
        return this.cipher.update(plainText, 'utf8');
    }
    decrypt(cipherText) {
        let buff = this.decipher.update(cipherText);
        return buff.toString('utf8');
    }
    enabled() {
        return this.cipher != null;
    }
    disable() {
        this.cipher = null;
        this.decipher = null;
    }
}
exports.Encryption = Encryption;
//# sourceMappingURL=encryption.js.map