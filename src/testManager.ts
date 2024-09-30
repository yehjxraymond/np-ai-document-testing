import { promises as fs } from "fs";
import path from "path";

export interface TestDefinition {
  name: string;
  systemMessage: string;
}

export interface TestReport {
  id: string;
  status: "success" | "failure" | "skipped" | "warning";
  remarks: string;
  observations?: {
    observed: string;
    suggested?: string;
    remarks?: string;
  }[];
}

export class TestManager {
  tests: TestDefinition[] = [];
  private initialized = false;
  private testReports: TestReport[] = [];

  async initialize() {
    const testsDir = path.join(__dirname, "./documentTest");
    const files = await fs.readdir(testsDir);

    for (const file of files) {
      if (file.endsWith(".ts")) {
        const testModule = await import(path.join(testsDir, file));
        this.tests.push(testModule.default);
      }
    }
    this.initialized = true;
  }

  requireInitialization() {
    if (!this.initialized) {
      throw new Error("TestManager is not initialized");
    }
  }

  reportTest({ id, status, remarks, observations }: TestReport) {
    this.requireInitialization();
    console.log(`=============== Test: ${id} ===============`);
    console.log(`Status: ${status}`);
    console.log(`Remarks: ${remarks}`);
    console.log(`Observations: ${JSON.stringify(observations, null, 2)}`);

    this.testReports.push({ id, status, remarks, observations });
  }

  printTestReports() {
    this.requireInitialization();
    console.log(this.testReports);
  }
}
