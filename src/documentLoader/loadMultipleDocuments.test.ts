import { describe, test, expect } from "bun:test";
import { loadMultipleDocuments } from "./loadMultipleDocuments";

describe("loadMultipleDocuments", () => {
  test("should load multiple documents", async () => {
    const docs = await loadMultipleDocuments([
      "fixtures/gsf/rpa-without-comments.docx",
      "fixtures/gsf/rpa-without-comments.pdf",
    ]);
    expect(docs).toMatchSnapshot();
  });
});
