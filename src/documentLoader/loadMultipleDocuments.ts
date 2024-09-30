import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { MultiFileLoader } from "langchain/document_loaders/fs/multi_file";

export const loadMultipleDocuments = async (paths: string[]) => {
  const multiFileLoader = new MultiFileLoader(paths, {
    ".pdf": (path) =>
      new PDFLoader(path, {
        splitPages: false,
      }),
    ".docx": (path) => new DocxLoader(path),
  });
  const docs = await multiFileLoader.load();
  return docs.map((doc, i) => ({
    file: paths[i],
    content: doc.pageContent,
  }));
};
