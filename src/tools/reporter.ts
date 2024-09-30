import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const buildJobReporterTool = (testName: string) =>
  new DynamicStructuredTool({
    verboseParsingErrors: true,
    name: "job-reporter",
    description: "Used for generating the report for the job",
    schema: z.object({
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
            remarks: z
              .string()
              .describe("Any additional remarks for this change"),
          })
        )
        .describe(
          "List of observations from the document with suggested changes, optional if test passed or skipped"
        )
        .optional(),
    }),
    func: async ({ status, remarks, observations }) => {
      console.log(`=============== Test: ${testName} ===============`);
      console.log(`Status: ${status}`);
      console.log(`Remarks: ${remarks}`);
      console.log(`Observations: ${JSON.stringify(observations, null, 2)}`);
      return { success: true };
    },
  });
