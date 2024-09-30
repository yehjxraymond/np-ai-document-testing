import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { buildAgentNode } from "./agent";
import { loadMultipleDocuments } from "./documentLoader/loadMultipleDocuments";
import { gpt4o } from "./llm";
import { buildJobReporterTool } from "./tools/reporter";
import {
  agentConditionalEdge,
  buildWorkflow,
  EDGE_INSTRUCTIONS,
} from "./workflow";
import { END, START } from "@langchain/langgraph";
import { buildToolNode } from "./tool";

import placeholderTest from "./documentTest/placeholder-presence";
import mpsiCodeTest from "./documentTest/appropriate-mpsi-code";

const tests = [placeholderTest, mpsiCodeTest];

export const buildTestWorkflow = async () => {
  const preCompileWorkflow = buildWorkflow();

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    // TODO test for repeated test names
    const testNodeName = `${test.name}-agent-node`;
    const testToolNodeName = `${test.name}-tool-node`;
    const tool = buildJobReporterTool(test.name);
    const testAgentNode = await buildAgentNode({
      llm: gpt4o,
      tools: [tool],
      systemMessage: test.systemMessage,
      name: testNodeName,
    });
    const testToolNode = await buildToolNode({
      tools: [tool],
      name: testToolNodeName,
    });

    preCompileWorkflow.addNode(testNodeName, testAgentNode);
    preCompileWorkflow.addNode(testToolNodeName, testToolNode);
    preCompileWorkflow.addEdge(START, testNodeName as any);
    preCompileWorkflow.addEdge(testToolNodeName as any, END);
    preCompileWorkflow.addConditionalEdges(
      testNodeName as any,
      agentConditionalEdge,
      {
        [EDGE_INSTRUCTIONS.CALL_TOOL]: testToolNodeName as any,
        [EDGE_INSTRUCTIONS.PREFIX_TASK_COMPLETED]: END as any,
        [EDGE_INSTRUCTIONS.PREFIX_TASK_FAILED]: END as any,
        [EDGE_INSTRUCTIONS.CONTINUE]: testNodeName as any,
      }
    );
  }

  return preCompileWorkflow.compile();
};
