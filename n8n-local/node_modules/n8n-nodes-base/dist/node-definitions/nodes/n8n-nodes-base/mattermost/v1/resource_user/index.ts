/**
 * Mattermost - User Resource
 * Re-exports all operation types for this resource.
 */

import type { MattermostV1UserCreateNode } from './operation_create';
import type { MattermostV1UserDeactiveNode } from './operation_deactive';
import type { MattermostV1UserGetAllNode } from './operation_get_all';
import type { MattermostV1UserGetByEmailNode } from './operation_get_by_email';
import type { MattermostV1UserGetByIdNode } from './operation_get_by_id';
import type { MattermostV1UserInviteNode } from './operation_invite';

export * from './operation_create';
export * from './operation_deactive';
export * from './operation_get_all';
export * from './operation_get_by_email';
export * from './operation_get_by_id';
export * from './operation_invite';

export type MattermostV1UserNode =
  | MattermostV1UserCreateNode
  | MattermostV1UserDeactiveNode
  | MattermostV1UserGetAllNode
  | MattermostV1UserGetByEmailNode
  | MattermostV1UserGetByIdNode
  | MattermostV1UserInviteNode
  ;