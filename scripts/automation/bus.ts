import type {
  AutomationBus,
  AutomationSignal,
  AutomationSeverity,
  ModuleResult,
} from './types.ts';

export function createAutomationBus(): AutomationBus {
  const signals: AutomationSignal[] = [];
  const moduleResults: ModuleResult[] = [];

  return {
    publish(signal) {
      signals.push(signal);
    },
    getSignals(filter) {
      return signals.filter((signal) => {
        if (filter?.module && signal.module !== filter.module) return false;
        if (filter?.severity && signal.severity !== filter.severity) return false;
        return true;
      });
    },
    getModuleResults() {
      return [...moduleResults];
    },
    setModuleResult(result) {
      const index = moduleResults.findIndex((entry) => entry.id === result.id);
      if (index === -1) {
        moduleResults.push(result);
      } else {
        moduleResults[index] = result;
      }
    },
  };
}

export function worstSeverity(
  signals: AutomationSignal[],
): AutomationSeverity | null {
  if (signals.some((s) => s.severity === 'error')) return 'error';
  if (signals.some((s) => s.severity === 'warn')) return 'warn';
  if (signals.some((s) => s.severity === 'info')) return 'info';
  return null;
}
