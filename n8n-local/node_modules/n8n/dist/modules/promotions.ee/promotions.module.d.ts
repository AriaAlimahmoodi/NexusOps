import type { ModuleInterface } from '@n8n/decorators';
export declare class PromotionsModule implements ModuleInterface {
    init(): Promise<void>;
    entities(): Promise<(typeof import("./database/entities/promotion-provider.entity.js").PromotionProvider | typeof import("./database/entities/promotion-connection.entity.js").PromotionConnection | typeof import("./database/entities/promotion-config.entity.js").PromotionConfig | typeof import("./database/entities/promotion-connection-project.entity.js").PromotionConnectionProject | typeof import("./database/entities/promotion-review.entity.js").PromotionReview | typeof import("./database/entities/promotion-run.entity.js").PromotionRun)[]>;
}
