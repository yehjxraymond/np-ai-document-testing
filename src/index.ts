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
import { buildTestWorkflow } from "./buildTestWorkflow";

const initialSystemMessage =
  new SystemMessage(`You are a finance manager in a Singapore government agency helping to perform checks on procurement documents before they are signed off. The document submitted can include:

- GSF (specification document)
- Evaluation scoring metrics

You will be testing the document against several criteria. With each test, you will evaluate the document and provide a report if the test is passed, failed, skipped or issue an warning if the test is inconclusive and requires manual review.
`);

const placeholderTestSystemMessage = `Your job is to check if any parts of the documents contains placeholder texts. This likely happens when the user copies and pastes content from a different procurement document or template for similar goods and services.

Look out for placeholder texts such as "TBD", "XXX", etc.
Note that the document can contain forms that are to be filled out by the bidder. Do not flag empty forms as placeholder texts.

If there are placeholder texts, report the placeholder texts and suggest a replacement.

Report status:

- status: "success" if no placeholder texts are found
- status: "failure" if placeholder texts are found
- status: "warning" if the document contains texts that are like placeholder texts but needs manual review

Steps:

- Use the tool "job-reporter" to report the status, remarks and observations of the test after analyzing the document directly.
`;

// const placeholderReporterTool = buildJobReporterTool("placeholder");
// const placeholderTestNode = await buildAgentNode({
//   llm: gpt4o,
//   tools: [placeholderReporterTool],
//   systemMessage: placeholderTestSystemMessage,
//   name: "placeholder",
// });
// const placeholderToolNode = await buildToolNode({
//   tools: [placeholderReporterTool],
//   name: "placeholderToolNode",
// });

const docs = await loadMultipleDocuments([
  "fixtures/gsf/rpa-without-comments.pdf",
]);

const initialUserMessage =
  `Please evaluate the following documents thoroughly:` +
  docs.map((doc) => `${doc.file}:\n<Document>${doc.content}</Document>\n\n`);

// const precompiledWorkflow = buildWorkflow()
//   .addNode("placeholderTestNode", placeholderTestNode)
//   .addNode("placeholderTestTool", placeholderToolNode)
//   .addEdge(START, "placeholderTestNode")
//   .addEdge("placeholderTestTool", END)
//   .addConditionalEdges("placeholderTestNode", agentConditionalEdge, {
//     [EDGE_INSTRUCTIONS.CALL_TOOL]: "placeholderTestTool",
//     [EDGE_INSTRUCTIONS.PREFIX_TASK_COMPLETED]: END,
//     [EDGE_INSTRUCTIONS.PREFIX_TASK_FAILED]: END,
//     [EDGE_INSTRUCTIONS.CONTINUE]: "placeholderTestNode",
//   })
// const workflow = precompiledWorkflow.compile();

// await workflow.invoke({
//   messages: [initialSystemMessage, new HumanMessage(initialUserMessage)],
// });

// What I define
// 1. Test name, ie placeholder
// 2. System message

// What I get
// 1. connected graph

const workflow = await buildTestWorkflow();

await workflow.invoke({
  messages: [initialSystemMessage, new HumanMessage(initialUserMessage)],
});
