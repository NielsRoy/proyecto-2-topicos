import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  STATE: 'production' | 'development';
  PORT: number;

  GEMINI_API_KEY: string;
}

const envsSchema = joi.object({
  STATE: joi.allow('production','development').required(),
  PORT: joi.number().required(),

  GEMINI_API_KEY: joi.string().required(),
})
.unknown(true);

const { error, value } = envsSchema.validate( process.env );

if ( error ) {
  throw new Error(`Config validation error: ${ error.message }`);
}

const envVars:EnvVars = value;

export const env = {
  STATE: envVars.STATE,
  PORT: envVars.PORT,
  
  GEMINI_API_KEY: envVars.GEMINI_API_KEY
}