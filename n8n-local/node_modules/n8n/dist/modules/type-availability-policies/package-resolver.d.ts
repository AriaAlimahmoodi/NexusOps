import type { LoadNodesAndCredentials } from '../../load-nodes-and-credentials';
import type { NodeTypes } from '../../node-types';
import { type PackageResolver, type PolicedType } from './policy-evaluator';
import type { PolicySelector } from './policy-rule.types';
export declare function packageResolverFor(kind: string, loadNodesAndCredentials: LoadNodesAndCredentials): PackageResolver;
export declare function policedTypeFor(kind: string, nodeTypes: NodeTypes, loadNodesAndCredentials: LoadNodesAndCredentials): (name: string) => PolicedType;
export declare function isCredentialTypeKnown(loadNodesAndCredentials: LoadNodesAndCredentials, typeName: string): boolean;
export declare function isPackageInstalled(loadNodesAndCredentials: LoadNodesAndCredentials, packageName: string): boolean;
export declare function loadedCheckFor(kind: string, nodeTypes: NodeTypes, loadNodesAndCredentials: LoadNodesAndCredentials): (selector: PolicySelector) => boolean;
