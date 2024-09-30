import type { RunnableConfig } from "@langchain/core/runnables";
import { StructuredTool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { buildLogger } from "./utils/logger";
import type { WorkflowReducerAction, WorkflowState } from "./workflow";

const { info } = buildLogger("workflow:tool");

export const buildToolNode = async ({
  tools,
  name,
}: {
  tools: StructuredTool[];
  name: string;
}) => {
  const toolRunnable = new ToolNode(tools);
  return async (
    state: WorkflowState,
    config?: RunnableConfig
  ): Promise<WorkflowReducerAction> => {
    info(
      `Running tool ${name}: \tGlobal Call Count: ${state.globalLlmCallCount} \tAgent Call Count: ${state.agentLlmCallCount}`
    );
    const isInScratchPad = state.scratchPad !== null;
    const messages = state.scratchPad || state.messages;
    const result = await toolRunnable.invoke({ messages }, config);
    return isInScratchPad
      ? {
          messages: [],
          scratchPad: result.messages,
          sender: name,
          globalLlmCallCount: 0,
          agentLlmCallCount: 0,
        }
      : {
          messages: result.messages,
          scratchPad: null,
          sender: name,
          globalLlmCallCount: 0,
          agentLlmCallCount: 0,
        };
  };
};
