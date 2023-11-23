import dotenv from "dotenv";
import fs from "fs";
import { logOf } from "./logger";

const logger = logOf("util");

if (fs.existsSync(".env")) {
  logger.debug("Using .env file to supply config environment variables");
  dotenv.config({ path: ".env" });
} else {
  logger.warn("No .env file provided, fallback to platform configurations!");
}

export const getLLMConfig = (model: LLMType | LLMInstructType): LLMConfig => {
  return {
    url: process.env[`${model}_URL`],
    apiKey: process.env[`${model}_APIKEY`]
  };
};

export const ENVIRONMENT = process.env.NODE_ENV;
const prod = ENVIRONMENT === "production"; // Anything else is treated as 'dev'
