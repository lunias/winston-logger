const logger = require('./logger')(module);

const test = () => {

  logger.error('error');
  logger.debug('debug');
  logger.debug('debug', true);
  logger.warn('warn');
  logger.warn('warn', true);
  logger.data('data');
  logger.info('info');

  console.log('----------------------------------------');

  logger.info('info');
  logger.data('data');
  logger.warn('warn', true);
  logger.warn('warn');
  logger.debug('debug', true);
  logger.debug('debug');
  logger.error('error');

  console.log('----------------------------------------');

  const o = {
    data1: 'test',
    data2: 100,
    data3: {
      hello: 'world'
    },
    data4: [1, 2, 3]
  };

  logger.info(o);
  logger.data(o);
  logger.warn(o);
  logger.debug(o);
  logger.debug('test', true, o, o);
  logger.info('test', o, o, o);
};

test();
