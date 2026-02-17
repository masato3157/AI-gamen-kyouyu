const crypto = require('crypto');

function generateKey() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    // Remove PEM headers/footers and newlines to get the base64 string
    const publicKeyString = publicKey
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/[\r\n]/g, '');

    // Calculate Extension ID from public key
    // SHA256 of the DER encoded public key (decoded from base64)
    // Then take first 16 bytes (128 bits)
    // Then hex encode, but map 0-15 to a-p (MP3 based encoding? No, chrome uses a-p)

    // Actually, getting the ID from the key manually is tricky.
    // Easier strategy: Just generate the key, put it in manifest.
    // Chrome will calculate the ID.
    // But for the native host manifest, I NEED the ID.

    // Algorithm for ID:
    // 1. Decode base64 public key to buffer (DER)
    // 2. SHA256 hash of that buffer
    // 3. Take first 16 bytes
    // 4. Convert each byte to a letter (0x00 -> 'a', 0x01 -> 'b', ... 0x0f -> 'p') behavior?
    // Chrome ID encoding is base16 but with a-p instead of 0-9a-f.

    const buf = Buffer.from(publicKeyString, 'base64');
    const hash = crypto.createHash('sha256').update(buf).digest();
    const first16 = hash.slice(0, 16);

    let id = '';
    for (const byte of first16) {
        // Each byte is represented by TWO characters in hex, 
        // but chrome extension ID is 32 chars long.
        // Wait, standard algorithm is:
        // SHA256 -> hex string -> first 32 chars -> map 0-9a-f to a-p?
        // Actually it's just base16 of the hash, using a-p.
        // 0->a, 1->b, ... 9->j, a->k, ... f->p.

        const hex = byte.toString(16).padStart(2, '0');
        for (const char of hex) {
            const val = parseInt(char, 16);
            id += String.fromCharCode(97 + val); // 97 is 'a'
        }
    }

    console.log(JSON.stringify({ key: publicKeyString, id: id }));
}

generateKey();
