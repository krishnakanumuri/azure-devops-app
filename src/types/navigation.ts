export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  Projects: undefined;
  Pipelines: { projectName: string; projectId?: string };
  Runs: { projectName: string; pipelineId: number; pipelineName?: string };
  RunDetails: {
    projectName: string;
    pipelineId: number;
    runId: number;
    runName?: string;
  };
  LogViewer: {
    projectName: string;
    buildId: number;
    logId: number;
    taskName?: string;
  };
  QueueRun: {
    projectName: string;
    pipelineId: number;
    pipelineName?: string;
    /** Pre-fill from an existing run for retry */
    existingRun?: {
      runId: number;
      branch?: string;
      variables?: Record<string, string>;
    };
  };
  /** Resolves an Azure DevOps build.aspx / SafeLinks URL to RunDetails */
  BuildResolver: { pcguid: string; buildId: number };
};
