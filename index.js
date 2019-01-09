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

    const _stubs = [];
    const _intents = [];
    const _expectations = [];
    let _lastInvocationData = null;
    let _authState = null;

    const _reset = () => {
        _stubs.forEach(i => i.forEach(s => s.restore()));
        _stubs.length = 0;
        _intents.length = 0;
        _expectations.length = 0;
        _lastInvocationData = null;
        _authState = null;
    };

    const builder = {
        stub: (obj, method, fakeFn) => {
            const restoreFn = () => {
                // obj.method.restore();
            };
            const stubFn = () => {
                // sinon.stub(obj, method).callsFake(fakeFn);
            };
            let stubs = _stubs[_intents.length];
            if (!stubs) stubs = [];
            stubs.push({
                stub: () => {
                    restoreFn();
                    stubFn();
                },
                restore: () => {
                    restoreFn();
                }
            });
            return builder;
        },

        authState: (authState) => {
            _authState = authState;
            return builder;
        },

        intend: (intent) => {
            _intents.push(intent);
            return builder;
        },

        expect: (...expectations) => {
            _expectations[_intents.length - 1] = expectations;
            return builder;
        },

        go: () => {
            for (let i = 0; i < _intents.length; i++) {
                (_stubs[i] || []).forEach(s => s.stub());
                let result = invokeFn(_intents[i], _lastInvocationData, _authState);
                (_expectations[i] || []).forEach(e => e(result));
                _lastInvocationData = extractDataFn(result);
            }
            _reset();
        }
    };
    return builder;
};

const E = {
    visualType: (expectation) => (result) => {
        const assert = expectation === result.visualType;
        console.log('VisualType: ' + assert);
    },

    say: (expectation) => (result) => {
        const assert = expectation === result.say;
        console.log('Say: ' + assert);
    },

    state: (expectation) => (result) => {
        const assert = expectation === result.state;
        console.log('State: ' + assert);
    }
};

const googleDriver = driverFactory('google');

googleDriver
    .stub({}, test, () => {
        return 'fake';
    })
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
