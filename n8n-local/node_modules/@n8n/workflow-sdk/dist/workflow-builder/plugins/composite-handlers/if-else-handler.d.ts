import type { IfElseComposite, IfElseBuilder } from '../../../types/base';
import type { CompositeHandlerPlugin } from '../types';
type IfElseInput = IfElseComposite | IfElseBuilder<unknown>;
export declare const ifElseHandler: CompositeHandlerPlugin<IfElseInput>;
export {};
