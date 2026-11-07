import type { EntityManager } from '@n8n/typeorm';
type Tx = EntityManager | null | undefined;
export declare function withTransaction<T>(manager: EntityManager, trx: Tx, run: (em: EntityManager) => Promise<T>): Promise<T>;
export {};
