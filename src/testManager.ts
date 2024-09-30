import mpsiCodeTest from "./documentTest/appropriate-mpsi-code";
import placeholderTest from "./documentTest/placeholder-presence";

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
  tests: TestDefinition[];
  private testReports: TestReport[] = [];

  constructor() {
    this.tests = [mpsiCodeTest, placeholderTest];
  }

  reportTest({ id, status, remarks, observations }: TestReport) {
    console.log(`=============== Test: ${id} ===============`);
    console.log(`Status: ${status}`);
    console.log(`Remarks: ${remarks}`);
    console.log(`Observations: ${JSON.stringify(observations, null, 2)}`);

    this.testReports.push({ id, status, remarks, observations });
  }

  printTestReports() {
    console.log(this.testReports);
  }
}
