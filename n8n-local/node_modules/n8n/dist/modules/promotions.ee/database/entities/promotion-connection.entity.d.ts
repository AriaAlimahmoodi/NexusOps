import type { PromotionConnectionScope } from '@n8n/api-types';
import { WithTimestampsAndStringId } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { PromotionProvider } from './promotion-provider.entity';
import type { PromotionStoredConnectionTarget } from '../../git-hosts/git-host-target';
export declare class PromotionConnection extends WithTimestampsAndStringId {
    name: string;
    providerId: string;
    scope: PromotionConnectionScope;
    target: PromotionStoredConnectionTarget;
    provider: Relation<PromotionProvider>;
}
