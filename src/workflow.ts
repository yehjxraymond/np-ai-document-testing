import { BaseMessage, AIMessage } from "@langchain/core/messages";
import type { StateGraphArgs } from "@langchain/langgraph";
import { StateGraph } from "@langchain/langgraph";
import type { RunnableConfig } from "@langchain/core/runnables";

export const EDGE_INSTRUCTIONS = {
  PREFIX_TASK_COMPLETED: "TASK_COMPLETED" as const,
  PREFIX_TASK_FAILED: "TASK_FAILED" as const,
  CALL_TOOL: "CALL_TOOL" as const,
  CONTINUE: "CONTINUE_EXECUTION" as const,
};

export interface WorkflowState {
  messages: BaseMessage[]; // global messages for all nodes
  scratchPad: BaseMessage[] | null; // null to clear scratchpad
  sender: string;
  globalLlmCallCount: number;
  agentLlmCallCount: number;
}

export type WorkflowReducerAction = WorkflowState;
export type WorkflowTransitionFunction = (
  state: WorkflowState,
  config?: RunnableConfig
) => Promise<WorkflowState>;

export const stateReducer: StateGraphArgs<WorkflowState>["channels"] = {
  messages: {
    value: (previous?: BaseMessage[], action?: BaseMessage[]) =>
      (previous ?? []).concat(action ?? []),
    default: () => [],
  },
  scratchPad: {
    value: (previous?: BaseMessage[] | null, action?: BaseMessage[] | null) => {
      if (action === null) {
        return null;
      }
      return (previous ?? []).concat(action || []);
    },
    default: () => null,
  },
  sender: {
    value: (previous?: string, action?: string) => action ?? previous ?? "user",
    default: () => "user",
  },
  globalLlmCallCount: {
    value: (previous?: number, action?: number) => {
      return (previous ?? 0) + (action ?? 0);
    },
    default: () => 0,
  },
  agentLlmCallCount: {
    value: (previous?: number, action?: number) => {
      if (action === 0) {
        return previous ?? 0;
      }
      if (action === 1) {
        return (previous ?? 0) + 1;
      }
      if (action === -1) {
        return 0;
      }
      throw new Error("Invalid agent globalLlmCallCount value");
    },
    default: () => 0,
  },
};

export const buildWorkflow = () =>
  new StateGraph({
    channels: stateReducer,
  });

export const isAIMessageWithToolCalls = (
  message: any
): message is AIMessage => {
  return message?.tool_calls && message.tool_calls.length > 0;
};

export const agentConditionalEdge = (state: WorkflowState) => {
  const messages = state.scratchPad || state.messages;
  const lastMessage = messages[messages.length - 1];
  if (isAIMessageWithToolCalls(lastMessage)) {
    return EDGE_INSTRUCTIONS.CALL_TOOL;
  }
  if (
    typeof lastMessage.content === "string" &&
    lastMessage.content.includes(EDGE_INSTRUCTIONS.PREFIX_TASK_COMPLETED)
  ) {
    return EDGE_INSTRUCTIONS.PREFIX_TASK_COMPLETED;
  }

  if (
    typeof lastMessage.content === "string" &&
    lastMessage.content.includes(EDGE_INSTRUCTIONS.PREFIX_TASK_FAILED)
  ) {
    return EDGE_INSTRUCTIONS.PREFIX_TASK_FAILED;
  }

  return EDGE_INSTRUCTIONS.CONTINUE;
};
