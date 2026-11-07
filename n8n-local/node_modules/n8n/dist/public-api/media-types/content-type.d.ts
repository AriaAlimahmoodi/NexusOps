import type { RequestBodyMediaType } from '@n8n/decorators';
export declare function assertContentType({ header, expected, bodyRequired, }: {
    header: string | undefined;
    expected: RequestBodyMediaType;
    bodyRequired: boolean;
}): boolean;
