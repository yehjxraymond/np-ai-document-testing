import { config as setup } from "dotenv";

setup();

export const config = {
  azure: {
    gpt4o: {
      apiKey: process.env.AOAI_GPT4_API_KEY,
      apiVersion: "2023-12-01-preview",
      basePath: process.env.AOAI_GPT4_BASE_PATH,
      apiDeploymentName: process.env.AOAI_GPT4_DEPLOYMENT_NAME,
      modelName: "gpt-4o-2024-05-13",
    },
    gpt4oMini: {
      apiKey: process.env.AOAI_GPT4OMINI_API_KEY,
      apiVersion: "2023-12-01-preview",
      basePath: process.env.AOAI_GPT4OMINI_BASE_PATH,
      apiDeploymentName: process.env.AOAI_GPT4OMINI_DEPLOYMENT_NAME,
      modelName: "gpt-4o-mini",
    },
  },
};
