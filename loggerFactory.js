const path = require('path');
const PROJECT_ROOT = path.join(__dirname, '..');

const winston = require('winston');

const { createLogger, format, transports } = winston;
const { combine, colorize, timestamp, label, printf } = format;

const CONFIG = {
  levels: {
    error: 0,
    debug: 1,
    warn: 2,
    data: 3,
    info: 4
  },
  colors: {
    error: 'red',
    debug: 'blue',
    warn: 'yellow',
    data: 'grey',
    info: 'green'
  }
};

winston.addColors(CONFIG.colors);

const LOG_FORMAT = printf(info => {
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

const getFilePath = (callingModule) => {
  var parts = callingModule.filename.split(path.sep);
  return path.join(parts[parts.length - 2], parts.pop());
};

const formatLogArguments = (args, filePath, maskFn, fetchStackInfo = true, includeStackTrace = false) => {
  args = Array.prototype.slice.call(args);

  let stackInfo = fetchStackInfo ? getStackInfo(1) : null;
  let msg = stackInfo ? '(' + filePath + ':' + stackInfo.line + ')' : '(' + filePath + ')';

  let firstObj = true;
  for (const i in args) {

    let booleanArg = typeof (args[i]) === 'boolean';

    if (i > 1 && !booleanArg && !firstObj) {
      msg += '\n';
    }

    if (typeof (args[i]) === 'string') {
      msg += (' ' + args[i]);
    } else if (!booleanArg){
      msg += ((firstObj ? '\n' : '') + JSON.stringify(args[i], null, 2));
      firstObj = false;
    }

    if (i == args.length - 1 && stackInfo && includeStackTrace) {
      msg += ('\n' + 'STACK:\n' + stackInfo.stack);
    }
  }

  msg = maskFn(msg);
  args.unshift(msg);

  return args;
};

const getStackInfo = (stackIndex) => {

  let stacklist = (new Error()).stack.split('\n').slice(3);

  // do not move these regexps outside of this function
  // stacklist parsing breaks in odd ways if you do
  // TODO why??????
  let stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
  let stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

  let s = stacklist[stackIndex] || stacklist[0];
  let sp = stackReg.exec(s) || stackReg2.exec(s);

  if (sp && sp.length === 5) {
    return {
      method: sp[1],
      relativePath: path.relative(PROJECT_ROOT, sp[2]),
      line: sp[3],
      pos: sp[4],
      file: path.basename(sp[2]),
      stack: stacklist.join('\n')
    };
  }
  return null;
};

module.exports = (lambdaName, consoleMaskFn = (m) => m, dataMaskFn = (m) => m) => {

  const logger = createLogger({
    levels: CONFIG.levels,
    format: combine(
      colorize(),
      label({ label: lambdaName }),
      timestamp(),
      LOG_FORMAT
    ),
    transports: [new transports.Console()]
  });

  const dataLogger = createLogger({
    levels: CONFIG.levels,
    format: combine(
      label({ label: lambdaName }),
      timestamp(),
      LOG_FORMAT
    ),
    transports: [new transports.Console()]
  });

  return (callingModule) => {

    const filePath = getFilePath(callingModule);

    return {
      debug: function(msg, includeStackTrace) {
        logger.debug.apply(logger, formatLogArguments(arguments, filePath, consoleMaskFn, true, includeStackTrace));
      },
      info: function(msg) {
        logger.info.apply(logger, formatLogArguments(arguments, filePath, consoleMaskFn, false));
      },
      warn: function(msg, includeStackTrace) {
        logger.warn.apply(logger, formatLogArguments(arguments, filePath, consoleMaskFn, true, includeStackTrace));
      },
      error: function(msg) {
        logger.error.apply(logger, formatLogArguments(arguments, filePath, consoleMaskFn, true, true));
      },
      data: function(msg) {
        dataLogger.data.apply(dataLogger, formatLogArguments(arguments, filePath, dataMaskFn, false));
      }
    };
  };
};

