import { ChatOpenAI } from "@langchain/openai";

import { config } from "./config";

const TEMPERATURE = 0.9;

export const gpt4o = new ChatOpenAI({
  azureOpenAIApiKey: config.azure.gpt4o.apiKey,
  azureOpenAIApiVersion: config.azure.gpt4o.apiVersion,
  azureOpenAIBasePath: config.azure.gpt4o.basePath,
  azureOpenAIApiDeploymentName: config.azure.gpt4o.apiDeploymentName,
  modelName: config.azure.gpt4o.modelName,
  maxTokens: 4096,
  temperature: TEMPERATURE,
});

export const gpt4oMini = new ChatOpenAI({
  azureOpenAIApiKey: config.azure.gpt4oMini.apiKey,
  azureOpenAIApiVersion: config.azure.gpt4oMini.apiVersion,
  azureOpenAIBasePath: config.azure.gpt4oMini.basePath,
  azureOpenAIApiDeploymentName: config.azure.gpt4oMini.apiDeploymentName,
  modelName: config.azure.gpt4oMini.modelName,
  maxTokens: 4096,
  temperature: TEMPERATURE,
});
