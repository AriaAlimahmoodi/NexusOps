import type { JoinKeys } from '@n8n/utils/types';
type EntityDataKeys<TEntity> = {
    [K in keyof TEntity]-?: TEntity[K] extends (...args: never[]) => unknown ? never : K;
}[keyof TEntity];
type PackageEntityKeyHandling<TEntity> = Record<EntityDataKeys<TEntity>, 'copy' | 'transform' | 'exclude'>;
type ExportDecisionConstraint<TEntity, TKeyHandling> = [
    Exclude<EntityDataKeys<TEntity>, keyof TKeyHandling>
] extends [never] ? [Exclude<keyof TKeyHandling, EntityDataKeys<TEntity>>] extends [never] ? PackageEntityKeyHandling<TEntity> : `Export decisions include key(s) that do not exist on the entity: ${JoinKeys<Extract<Exclude<keyof TKeyHandling, EntityDataKeys<TEntity>>, string>>}` : `Every entity key has a package export decision, missing export decision for key(s): ${JoinKeys<Extract<Exclude<EntityDataKeys<TEntity>, keyof TKeyHandling>, string>>}`;
type PackageCopiedEntityKeys<TEntity, TKeyHandling> = {
    [K in EntityDataKeys<TEntity>]-?: K extends keyof TKeyHandling ? TKeyHandling[K] extends 'copy' ? K : never : never;
}[EntityDataKeys<TEntity>];
type PackageExcludedEntityKeys<TEntity, TKeyHandling> = {
    [K in EntityDataKeys<TEntity>]-?: K extends keyof TKeyHandling ? TKeyHandling[K] extends 'exclude' ? K : never : never;
}[EntityDataKeys<TEntity>];
type CopiedEntityKeysMissingFromPayload<TEntity, TKeyHandling, TPayload> = Exclude<PackageCopiedEntityKeys<TEntity, TKeyHandling>, keyof TPayload>;
export declare function definePackageSerializationPayload<TEntity, TSerialized extends object, TKeyHandling extends ExportDecisionConstraint<TEntity, TKeyHandling>>(): <const TPayload extends TSerialized>(payload: TPayload & Record<CopiedEntityKeysMissingFromPayload<TEntity, TKeyHandling, TPayload>, never> & Partial<Record<PackageExcludedEntityKeys<TEntity, TKeyHandling>, never>> & Record<Exclude<keyof TPayload, keyof TSerialized>, never>) => TPayload;
export {};
