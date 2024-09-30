import { z } from "zod";
const s = z.object({
  status: z
    .enum(["success", "failure", "skipped", "warning"])
    .describe("The status of the test on the document"),
  remarks: z.string().describe("Overall remarks for the test"),
  observations: z
    .array(
      z.object({
        observed: z
          .string()
          .describe("The observation from the document, verbatim"),
        suggested: z
          .string()
          .describe("The suggested change for the document")
          .optional(),
        remarks: z.string().describe("Any additional remarks for this change"),
      })
    )
    .describe(
      "List of observations from the document with suggested changes, optional if test passed or skipped"
    )
    .optional(),
});

const a = s.parse({
  status: "failure",
  remarks: "The document contains placeholder text.",
  observations: [
    {
      observed: "c. Conversion of RPA solution for \\",
      suggested: "Replace 'XXX' with the specific process name.",
      remarks:
        "This is placeholder text which needs to be replaced with the actual process name.",
    },
  ],
});

console.log(a);
