import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { Runnable } from "@langchain/core/runnables";
import { StructuredTool } from "@langchain/core/tools";
import { convertToOpenAITool } from "@langchain/core/utils/function_calling";
import { ChatOpenAI } from "@langchain/openai";
import { fetchPromptTemplate } from "./prompt";
import { buildLogger } from "./utils/logger";
import type { WorkflowReducerAction, WorkflowState } from "./workflow";
import { EDGE_INSTRUCTIONS } from "./workflow";

const { info } = buildLogger("workflow:agent");

// const BASE_AGENT_PROMPT = `You are a helpful AI assistant, collaborating with other assistants to complete a mission. Use the provided tools to progress towards completing the mission through your assigned task. When you have the final deliverable to your task, prefix your response with {prefix_task_completed} to hand it over to the next team member. If at any point you think that you are unable to achieve your task that is within your domain of expertise, prefix your response with {prefix_task_failed} so the team knows to take corrective actions. Do that only when you are certain to end the mission prematurely and provide detailed reasons. 
// If you need time to think and plan for the next course of action, prefix your response with {prefix_continue} alongside your notes or plan to continue.
// You have access to the following tools: {tool_names}.
// {system_message}
// `;

export const createAgentRunnable = async ({
  llm,
  tools,
  systemMessage,
}: {
  llm: ChatOpenAI | BedrockChat;
  tools: StructuredTool[];
  systemMessage: string;
}): Promise<Runnable> => {
  const toolNames = tools.map((tool) => tool.name).join(", ");
  const formattedTools = tools.map((t) => convertToOpenAITool(t));

  const prompt = await fetchPromptTemplate("base_agent_prompt");
  const populatedPrompt = await prompt.partial({
    prefix_task_completed: EDGE_INSTRUCTIONS.PREFIX_TASK_COMPLETED,
    prefix_task_failed: EDGE_INSTRUCTIONS.PREFIX_TASK_FAILED,
    prefix_continue: EDGE_INSTRUCTIONS.CONTINUE,
    system_message: systemMessage,
    tool_names: toolNames,
  });

  const llmWithTools =
    formattedTools.length > 0 ? llm.bind({ tools: formattedTools }) : llm;
  return populatedPrompt.pipe(llmWithTools);
};

export const buildAgentNode = async ({
  llm,
  tools,
  systemMessage,
  name,
  maxAgentLlmCallCount = 3,
  maxGlobalLlmCallCount = 20,
  isUsingScratchPad = false,
}: {
  llm: ChatOpenAI | BedrockChat;
  tools: StructuredTool[];
  systemMessage: string;
  name: string;
  maxAgentLlmCallCount?: number;
  maxGlobalLlmCallCount?: number;
  isUsingScratchPad?: boolean;
}) => {
  const agentRunnable = await createAgentRunnable({
    llm,
    tools,
    systemMessage,
  });
  return async (
    state: WorkflowState,
    config?: RunnableConfig
  ): Promise<WorkflowReducerAction> => {
    info(
      `Running agent ${name}: \tGlobal Call Count: ${state.globalLlmCallCount} \tAgent Call Count: ${state.agentLlmCallCount}`
    );
    // Pre-invoke
    const { messages: globalMessages, scratchPad: localMessages } = state;

    const messages = isUsingScratchPad
      ? localMessages ?? globalMessages // If using scratchpad, use local messages if available
      : globalMessages; // If not using scratchpad, use global messages

    if (state.agentLlmCallCount >= maxAgentLlmCallCount) {
      return {
        messages: [
          ...messages,
          new AIMessage(
            `${EDGE_INSTRUCTIONS.PREFIX_TASK_FAILED}: Agent has reached maximum agent's call count`
          ),
        ],
        scratchPad: null,
        sender: name,
        globalLlmCallCount: 0,
        agentLlmCallCount: -1,
      };
    }
    if (state.globalLlmCallCount >= maxGlobalLlmCallCount) {
      return {
        messages: [
          ...messages,
          new AIMessage(
            `${EDGE_INSTRUCTIONS.PREFIX_TASK_FAILED}: Agent has reached maximum agent's call count`
          ),
        ],
        scratchPad: null,
        sender: name,
        globalLlmCallCount: 0,
        agentLlmCallCount: -1,
      };
    }

    // Invoke
    const callCountWarning =
      state.agentLlmCallCount >= maxAgentLlmCallCount - 1 ||
      state.globalLlmCallCount >= maxGlobalLlmCallCount - 1
        ? [
            new SystemMessage(
              `Warning: Reaching maximum call depth for agent. Mark the task as completed or fail in the next response with all the information gathered.`
            ),
          ]
        : [];
    const messagesToSendToLLM = messages.concat(callCountWarning);
    const result: AIMessage = await agentRunnable.invoke(
      { messages: messagesToSendToLLM },
      config
    );

    // Post-invoke
    const isTaskCompletedOrFailed =
      result.content &&
      typeof result.content === "string" &&
      (result.content.includes(EDGE_INSTRUCTIONS.PREFIX_TASK_COMPLETED) ||
        result.content.includes(EDGE_INSTRUCTIONS.PREFIX_TASK_FAILED));

    if (isTaskCompletedOrFailed) {
      return {
        messages: [result],
        scratchPad: null,
        sender: name,
        globalLlmCallCount: 1,
        agentLlmCallCount: -1,
      };
    }

    if (!isUsingScratchPad) {
      return {
        messages: [result],
        scratchPad: null,
        sender: name,
        globalLlmCallCount: 1,
        agentLlmCallCount: 1,
      };
    }

    if (!localMessages || localMessages.length === 0) {
      return {
        messages: [],
        scratchPad: [...globalMessages, result],
        sender: name,
        globalLlmCallCount: 1,
        agentLlmCallCount: 1,
      };
    }

    return {
      messages: [],
      scratchPad: [result],
      sender: name,
      globalLlmCallCount: 1,
      agentLlmCallCount: 1,
    };
  };
};
