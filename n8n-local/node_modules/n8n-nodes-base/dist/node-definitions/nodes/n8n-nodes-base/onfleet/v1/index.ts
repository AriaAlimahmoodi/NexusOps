/**
 * Onfleet Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { OnfleetV1AdminNode } from './resource_admin';
import type { OnfleetV1ContainerNode } from './resource_container';
import type { OnfleetV1DestinationNode } from './resource_destination';
import type { OnfleetV1HubNode } from './resource_hub';
import type { OnfleetV1OrganizationNode } from './resource_organization';
import type { OnfleetV1RecipientNode } from './resource_recipient';
import type { OnfleetV1TaskNode } from './resource_task';
import type { OnfleetV1TeamNode } from './resource_team';
import type { OnfleetV1WorkerNode } from './resource_worker';

export * from './resource_admin';
export * from './resource_container';
export * from './resource_destination';
export * from './resource_hub';
export * from './resource_organization';
export * from './resource_recipient';
export * from './resource_task';
export * from './resource_team';
export * from './resource_worker';

export type OnfleetV1Node =
  | OnfleetV1AdminNode
  | OnfleetV1ContainerNode
  | OnfleetV1DestinationNode
  | OnfleetV1HubNode
  | OnfleetV1OrganizationNode
  | OnfleetV1RecipientNode
  | OnfleetV1TaskNode
  | OnfleetV1TeamNode
  | OnfleetV1WorkerNode
  ;