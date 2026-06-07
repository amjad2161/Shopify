export type AutomationSeverity = 'info' | 'warn' | 'error';

export type AutomationSignal = {
  module: string;
  key: string;
  severity: AutomationSeverity;
  message: string;
  data?: Record<string, unknown>;
};

export type ModuleStatus = 'pass' | 'warn' | 'fail' | 'skip';

export type ModuleResult = {
  id: string;
  name: string;
  status: ModuleStatus;
  durationMs: number;
  signals: AutomationSignal[];
  artifacts?: Record<string, unknown>;
};

export type AutomationMode = 'local' | 'ci' | 'full';

export type AutomationContext = {
  mode: AutomationMode;
  cwd: string;
  hasEnvFile: boolean;
  envValid: boolean;
  isProductionGate: boolean;
};

export type AutomationDecision = {
  id: string;
  severity: AutomationSeverity;
  action: 'allow' | 'warn' | 'block';
  reason: string;
  sources: string[];
};

export type AutomationReport = {
  version: 1;
  generatedAt: string;
  mode: AutomationMode;
  context: Pick<AutomationContext, 'hasEnvFile' | 'envValid' | 'isProductionGate'>;
  modules: ModuleResult[];
  decisions: AutomationDecision[];
  summary: {
    pass: number;
    warn: number;
    fail: number;
    skip: number;
    blocked: boolean;
    deployReady: boolean;
  };
};

export type AutomationModule = {
  id: string;
  name: string;
  /** Lower runs first when sequencing; parallel groups share the same tier. */
  tier: number;
  run: (ctx: AutomationContext, bus: AutomationBus) => Promise<ModuleResult>;
};

export interface AutomationBus {
  publish(signal: AutomationSignal): void;
  getSignals(filter?: {module?: string; severity?: AutomationSeverity}): AutomationSignal[];
  getModuleResults(): ModuleResult[];
  setModuleResult(result: ModuleResult): void;
}
