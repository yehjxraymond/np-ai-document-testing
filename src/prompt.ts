import type { ChatPromptTemplate } from "@langchain/core/prompts";
import * as hub from "langchain/hub";

const cache: { [key: string]: ChatPromptTemplate } = {};

export const fetchPromptTemplate = async (
  id: string
): Promise<ChatPromptTemplate> => {
  if (cache[id]) {
    return cache[id];
  }
  const prompt = await hub.pull<ChatPromptTemplate>(id);
  cache[id] = prompt;
  return prompt;
};

export const fetchPromptText = async (
  id: string,
  values: any
): Promise<string> => {
  const prompt = await fetchPromptTemplate(id);
  return prompt.format(values);
};
