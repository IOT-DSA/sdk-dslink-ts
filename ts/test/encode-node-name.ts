import {encodeNodeName} from '../src/utils/node-name';
import {assert} from 'chai';

describe('encode node name', function () {
  it('encode', function () {
    assert.equal(encodeNodeName('/?*:|"<>%\\'), '%2f%3f%2a%3a%7c%22%3c%3e%25%5c');
    assert.equal(encodeNodeName('!&^()-+'), '!&^()-+');
  });
});
