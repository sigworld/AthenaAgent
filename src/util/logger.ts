import { Logger, Roarr as log } from "roarr";

const _AthenaAgentLog = log.child({
  program: "AthenaAgent"
});

export const logOf = (namespace: string): Logger => _AthenaAgentLog.child({ namespace });
