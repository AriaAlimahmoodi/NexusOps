import type { WarningTracker } from '../state/warning-tracker';
import type { ValidationWarning } from '../types';
export declare function formatWarnings(warnings: ValidationWarning[], warningTracker?: WarningTracker): string;
