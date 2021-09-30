import {encodeNodeName, decodeNodeName} from '../src/utils/node-name';
import {assert} from 'chai';

describe('encode node name', function () {
  it('encode', function () {
    assert.equal(encodeNodeName('/?*:|"<>%\\'), '%2F%3F%2A%3A%7C%22%3C%3E%25%5C');
    assert.equal(encodeNodeName('!&^()-+'), '!&^()-+');
  });
  it('decode', function () {
    assert.equal(decodeNodeName('%2f%3f%2a%3a%7c%22%3c%3e%25%5c'), '/?*:|"<>%\\');
    assert.equal(decodeNodeName('!&^()-+'), '!&^()-+');
  });
});
