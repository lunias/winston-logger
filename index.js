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

const driverFactory = (platform) => {

    const googleInvokeFn = (intent, lastInvocationData, authState) => {
        console.log('Invoking intent: ' + intent);
        console.log('Last invocation data: ' + JSON.stringify(lastInvocationData));
        console.log('Auth state: ' + authState);
        return {
            visualType: 'Card',
            say: 'Blah',
            state: 'ORDER_STATUS'
        };
    };

    if (platform === 'google') {
        return driver(googleInvokeFn);
    }

    return driver((intent) => console.error('Please add a driver for platform: ' + platform));
};

const driver = (invokeFn, extractDataFn = (result) => result) => {

    const _intents = [];
    const _expectations = [];
    let _lastInvocationData = null;
    let _authState = null;

    const _reset = () => {
        _intents.length = 0;
        _expectations.length = 0;
        _lastInvocationData = null;
        _authState = null;
    };

    const builder = {

        authState: (authState) => {
            _authState = authState;
            return builder;
        },

        intend: (intent) => {
            _intents.push(intent);
            return builder;
        },

        expect: (...expectations) => {
            _expectations.push(expectations);
            return builder;
        },

        go: () => {
            for (let i = 0; i < _intents.length; i++) {
                let result = invokeFn(_intents[i], _lastInvocationData, _authState);
                _lastInvocationData = extractDataFn(result);
                (_expectations[i] || []).forEach(e => {
                    e(result);
                });
            }
            _reset();
        }
    };

    return builder;
};

const E = {
    visualType: (expectation) => (result) => {
        const assert = result.visualType === expectation;
        console.log('VisualType: ' + assert);
    },

    say: (expectation) => (result) => {
        const assert = result.say === expectation;
        console.log('Say: ' + assert);
    },

    state: (expectation) => (result) => {
        const assert = result.state === expectation;
        console.log('State: ' + assert);
    }
};

const googleDriver = driverFactory('google');

googleDriver
    .authState('authenticated')
    .intend('OrderStatus')
    .expect(
        E.visualType('Card'),
        E.say('Blah'),
        E.state('ORDER_STATUS'))
    .intend('Yes')
    .expect(E.say('Blah2'))
    .intend('Yes')
    .expect(E.visualType('List'))
    .go();

googleDriver
    .intend('Sms')
    .go();
