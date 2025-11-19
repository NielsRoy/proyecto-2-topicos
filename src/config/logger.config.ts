import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { env } from './env.config';

// Definimos el formato para archivos: JSON estructurado con timestamp
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(), // <-- IMPORTANTE: Guarda el objeto tal cual, no como string
);

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    // 1. Consola (Bonito para desarrollo)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('SocialPublisher', {
          prettyPrint: true,
          colors: true, // Habilita colores
        }),
      ),
    }),
    
    // 2. Archivo Diario (Estructurado para auditoría)
    new winston.transports.DailyRotateFile({
      filename: `${env.LOGS_PATH}/application-%DATE%.log`, // %DATE% será reemplazado por la fecha
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true, // Comprime logs antiguos (.gz)
      maxSize: '20m', // Rota si el archivo pesa más de 20MB
      maxFiles: '14d', // Borra logs más viejos de 14 días
      format: fileFormat,
      level: 'info', // Guarda info, warn y error
    }),
    
    // 3. Archivo separado solo para Errores (Opcional pero recomendado)
    new winston.transports.DailyRotateFile({
      filename: `${env.LOGS_PATH}/errors-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error', // Solo guarda errores
      format: fileFormat,
    }),
  ],
});