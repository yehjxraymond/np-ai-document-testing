import { loadMultipleDocuments } from "./documentLoader/loadMultipleDocuments";

const docs = await loadMultipleDocuments([
  "fixtures/gsf/rpa-without-comments.docx",
  "fixtures/gsf/rpa-without-comments.pdf",
]);
console.log(docs);
