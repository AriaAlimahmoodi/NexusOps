//#region src/utils.d.ts
declare function deriveMiddleKey(path: string, parameter: {
  name: string;
  type?: string;
}): string;
declare const isNestedInCollectionLike: (path: string) => boolean;
declare const normalize: (path: string) => string;
declare const insertOptionsAndValues: (pathSegments: string[]) => string[];
//#endregion
export { deriveMiddleKey, insertOptionsAndValues, isNestedInCollectionLike, normalize };
//# sourceMappingURL=utils.d.mts.map