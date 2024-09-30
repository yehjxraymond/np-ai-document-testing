import { debug } from "debug";

const logger = debug("document-testing");

export const buildLogger = (namespace: string) => {
  const l = logger.extend(namespace);
  return {
    info: l.extend("info"),
    error: l.extend("error"),
    debug: l.extend("debug"),
    warn: l.extend("warn"),
  };
};
