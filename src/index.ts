import {
    executeParallelWorkflows
} from "./buildTestWorkflow";
import { loadMultipleDocuments } from "./documentLoader/loadMultipleDocuments";
import { TestManager } from "./testManager";

const docs = await loadMultipleDocuments([
  "fixtures/gsf/rpa-without-comments.pdf",
]);

const initialUserMessage =
  `Please evaluate the following documents thoroughly:` +
  docs.map((doc) => `${doc.file}:\n<Document>${doc.content}</Document>\n\n`);


const testManager = new TestManager();
await testManager.initialize()
await executeParallelWorkflows(initialUserMessage, testManager);
testManager.printTestReports();