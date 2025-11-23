import 'dotenv/config';
import * as joi from 'joi';
import type { StringValue } from "ms";

interface EnvVars {
  STATE: 'production' | 'development';
  PORT: number;

  APP_JWT_SECRET: string;
  APP_JWT_EXPIRATION: StringValue;

  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;

  GEMINI_API_KEY: string;

  PROMPT_TEMPLATE_FILE: string;

  FACEBOOK_PAGE_ID: string;
  FACEBOOK_PAGE_ACCESS_TOKEN: string;

  INSTAGRAM_ACCOUNT_ID: string;
  INSTAGRAM_ACCOUNT_ACCESS_TOKEN: string;

  LINKEDIN_PROFILE_ID: string;
  LINKEDIN_PROFILE_ACCESS_TOKEN: string;

  TIKTOK_CLIENT_KEY: string;
  TIKTOK_CLIENT_SECRET: string;
  TIKTOK_REDIRECT_URI: string;
  TIKTOK_ACCESS_TOKEN: string;
  TIKTOK_REFRESH_TOKEN: string;

  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;

  LOGS_PATH: string;
}

const envsSchema = joi.object({
  STATE: joi.allow('production','development').required(),
  PORT: joi.number().required(),

  DB_HOST: joi.string().required(),
  DB_PORT: joi.number().required(),
  DB_USERNAME: joi.string().required(),
  DB_PASSWORD: joi.string().required(),
  DB_DATABASE: joi.string().required(),

  APP_JWT_SECRET: joi.string().required(),
  APP_JWT_EXPIRATION: joi.string().required(),

  GEMINI_API_KEY: joi.string().required(),

  PROMPT_TEMPLATE_FILE: joi.string().required(),

  FACEBOOK_PAGE_ID: joi.string().required(),
  FACEBOOK_PAGE_ACCESS_TOKEN: joi.string().required(),

  INSTAGRAM_ACCOUNT_ID: joi.string().required(),
  INSTAGRAM_ACCOUNT_ACCESS_TOKEN: joi.string().required(),

  LINKEDIN_PROFILE_ID: joi.string().required(),
  LINKEDIN_PROFILE_ACCESS_TOKEN: joi.string().required(),

  TIKTOK_CLIENT_KEY: joi.string().required(),
  TIKTOK_CLIENT_SECRET: joi.string().required(),
  TIKTOK_REDIRECT_URI: joi.string().required(),
  TIKTOK_ACCESS_TOKEN: joi.string().required(),
  TIKTOK_REFRESH_TOKEN: joi.string().required(),

  TWILIO_ACCOUNT_SID: joi.string().required(),
  TWILIO_AUTH_TOKEN: joi.string().required(),
  TWILIO_PHONE_NUMBER: joi.string().required(),

  LOGS_PATH: joi.string().default('logs'),
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

  APP_JWT_SECRET: envVars.APP_JWT_SECRET,
  APP_JWT_EXPIRATION: envVars.APP_JWT_EXPIRATION,

  DB_HOST: envVars.DB_HOST,
  DB_PORT: envVars.DB_PORT,
  DB_USERNAME: envVars.DB_USERNAME,
  DB_PASSWORD: envVars.DB_PASSWORD,
  DB_DATABASE: envVars.DB_DATABASE,

  GEMINI_API_KEY: envVars.GEMINI_API_KEY,

  PROMPT_TEMPLATE_FILE: envVars.PROMPT_TEMPLATE_FILE,

  FACEBOOK_PAGE_ID: envVars.FACEBOOK_PAGE_ID,
  FACEBOOK_PAGE_ACCESS_TOKEN: envVars.FACEBOOK_PAGE_ACCESS_TOKEN,

  INSTAGRAM_ACCOUNT_ID: envVars.INSTAGRAM_ACCOUNT_ID,
  INSTAGRAM_ACCOUNT_ACCESS_TOKEN: envVars.INSTAGRAM_ACCOUNT_ACCESS_TOKEN,

  LINKEDIN_PROFILE_ID: envVars.LINKEDIN_PROFILE_ID,
  LINKEDIN_PROFILE_ACCESS_TOKEN: envVars.LINKEDIN_PROFILE_ACCESS_TOKEN,

  TIKTOK_CLIENT_KEY: envVars.TIKTOK_CLIENT_KEY,
  TIKTOK_CLIENT_SECRET: envVars.TIKTOK_CLIENT_SECRET,
  TIKTOK_REDIRECT_URI: envVars.TIKTOK_REDIRECT_URI,
  TIKTOK_ACCESS_TOKEN: envVars.TIKTOK_ACCESS_TOKEN,
  TIKTOK_REFRESH_TOKEN: envVars.TIKTOK_REFRESH_TOKEN,

  TWILIO_ACCOUNT_SID: envVars.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: envVars.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: envVars.TWILIO_PHONE_NUMBER,

  LOGS_PATH: envVars.LOGS_PATH,
}