import type { SwitchCaseComposite, SwitchCaseBuilder } from '../../../types/base';
import type { CompositeHandlerPlugin } from '../types';
type SwitchCaseInput = SwitchCaseComposite | SwitchCaseBuilder<unknown>;
export declare const switchCaseHandler: CompositeHandlerPlugin<SwitchCaseInput>;
export {};
