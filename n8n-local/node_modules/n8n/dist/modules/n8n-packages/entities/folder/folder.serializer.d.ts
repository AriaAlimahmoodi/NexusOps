import type { Folder } from '@n8n/db';
import { type SerializedFolder } from '../../spec/serialized/folder.schema';
export declare class FolderSerializer {
    serialize(folder: Folder, parentFolderId: string | null): SerializedFolder;
}
