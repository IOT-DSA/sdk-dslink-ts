import {encryptPassword, decryptPassword, initEncryptionSecret} from '../encrypt';
import {assert} from 'chai';

describe('encrypt', function() {
  it('encrypt with no secret', function() {
    initEncryptionSecret(null);
    assert.equal(encryptPassword('123'), '123');
    assert.equal(decryptPassword('123'), '123');
  });

  it('encrypt with secret', function() {
    let buff = Buffer.alloc(32, 47);
    initEncryptionSecret(buff);
    let encrypted = encryptPassword('123');
    assert.equal(encrypted, '\u001Bpw:iC7tlHEF0hZN11JjMFjApw==');
    assert.equal(decryptPassword(encrypted), '123');
  });
});
