import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { END, START } from "@langchain/langgraph";
import { buildAgentNode } from "./agent";
import { gpt4o } from "./llm";
import { buildToolNode } from "./tool";
import { buildJobReporterTool } from "./tools/reporter";
import {
  agentConditionalEdge,
  buildWorkflow,
  EDGE_INSTRUCTIONS,
} from "./workflow";

import mpsiCodeTest from "./documentTest/appropriate-mpsi-code";
import placeholderTest from "./documentTest/placeholder-presence";
import type { TestManager } from "./testManager";

const tests = [placeholderTest, mpsiCodeTest];

const initialSystemMessage =
  new SystemMessage(`You are a finance manager in a Singapore government agency helping to perform checks on procurement documents before they are signed off. The document submitted can include:

- GSF (specification document)
- Evaluation scoring metrics

You will be testing the document against several criteria. With each test, you will evaluate the document and provide a report if the test is passed, failed, skipped or issue an warning if the test is inconclusive and requires manual review.
`);

export const executeParallelWorkflows = async (
  initialUserMessage: string,
  testManager: TestManager
) => {
  const workflowExecutionPromises = tests.map(async (test) => {
    const tool = buildJobReporterTool(test.name, testManager);
    const testAgentNode = await buildAgentNode({
      llm: gpt4o,
      tools: [tool],
      systemMessage: test.systemMessage,
      name: "test-agent-node",
    });
    const testToolNode = await buildToolNode({
      tools: [tool],
      name: "test-tool-node",
    });
    const workflow = buildWorkflow()
      .addNode("test-agent-node", testAgentNode)
      .addNode("test-tool-node", testToolNode)
      .addEdge(START, "test-agent-node")
      .addEdge("test-tool-node", END)
      .addConditionalEdges("test-agent-node", agentConditionalEdge, {
        [EDGE_INSTRUCTIONS.CALL_TOOL]: "test-tool-node",
        [EDGE_INSTRUCTIONS.PREFIX_TASK_COMPLETED]: END,
        [EDGE_INSTRUCTIONS.PREFIX_TASK_FAILED]: END,
        [EDGE_INSTRUCTIONS.CONTINUE]: "test-agent-node",
      })
      .compile();
    return workflow.invoke({
      messages: [initialSystemMessage, new HumanMessage(initialUserMessage)],
    });
  });
  return Promise.all(workflowExecutionPromises);
};
