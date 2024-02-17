import * as winston from 'winston';
import { appEnv } from '../env/env';

const devFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf(
    (info: any) =>
      `[${info.timestamp}] [${info.level.toUpperCase()}] [${info.service}]: ${
        info.message
      }`
  )
);

export const createServiceLogger = (serviceName?: string) => {
  if (appEnv?.nodeEnv === 'prod') {
    return winston.createLogger({
      level: 'debug',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            devFormat,
            winston.format.colorize({ all: true })
          ),
        }),
      ],
    });
  } else {
    winston.addColors({
      info: 'bold white',
    });
    return winston.createLogger({
      level: 'debug',
      defaultMeta: {
        service: serviceName ?? 'Application',
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.splat(),
            devFormat,
            winston.format.colorize({
              all: true,
            })
          ),
        }),
      ],
    });
  }
};

export class Logger {
  private _internalLogger;
  constructor(serviceName?: string) {
    this._internalLogger = createServiceLogger(serviceName);
  }

  info(message: string, object?: any) {
    this._internalLogger.info(message, object);
  }

  error(message: string, object?: any) {
    this._internalLogger.info(message, object);
  }
}

export const appLogger = new Logger();

appLogger.info('logger initialized');
