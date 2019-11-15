import {Logger} from '../logger';
import {assert} from 'chai';

describe('logger', function() {
  it('levels', function() {
    let logger = new Logger();
    let tagged = logger.tag('a');
    let loggedLevel: number;
    logger.printer = (str: string, level: number) => {
      loggedLevel = level;
    };

    logger.setLevel(Logger.INFO);
    tagged.info('');
    assert.equal(loggedLevel, Logger.INFO);
    tagged.warn('');
    assert.equal(loggedLevel, Logger.WARN);
    tagged.error('');
    assert.equal(loggedLevel, Logger.ERROR);
    tagged.debug('');
    assert.equal(loggedLevel, Logger.ERROR, 'should not be logged');
    tagged.trace('');
    assert.equal(loggedLevel, Logger.ERROR, 'should not be logged');
  });

  it('tag', function() {
    let logger = new Logger();
    let tagged = logger.tag('a');
    let loggedMsg: string;
    logger.printer = (msg: string, level: number) => {
      loggedMsg = msg;
    };

    logger.info('');
    assert.isFalse(loggedMsg.includes('['), 'should not have tag');

    tagged.info('');
    assert.isTrue(loggedMsg.includes(' [a] INFO '), 'should have tag');
  });
});
