// logger.config.ts
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { env } from './env.config';

// 1. DEFINIR LA LISTA DE CONTEXTOS PERMITIDOS
// Estos son los únicos que se guardarán en el archivo publications.log
const TARGET_CONTEXTS = [
  'Facebook', 
  'Instagram', 
  'TikTok', 
  'LinkedIn', 
  'Whatsapp'
];

// 2. CREAR EL FILTRO DE LISTA
const contextFilter = winston.format((info) => {
  // Verificamos que 'context' exista Y que sea de tipo 'string'
  if (typeof info.context === 'string' && TARGET_CONTEXTS.includes(info.context)) {
    return info;
  }
  return false;
});

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    // --- 1. Consola (Muestra TODO, incluyendo logs de sistema de Nest) ---
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('SocialPublisher', {
          prettyPrint: true,
          colors: true,
        }),
      ),
    }),

    // --- 2. Archivo publications.log (Solo contextos de la lista) ---
    new winston.transports.DailyRotateFile({
      filename: `${env.LOGS_PATH}/publications-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'info',
      // Aplicamos el filtro de lista aquí
      format: winston.format.combine(
        contextFilter(), 
        fileFormat
      ),
    }),
  ],
});