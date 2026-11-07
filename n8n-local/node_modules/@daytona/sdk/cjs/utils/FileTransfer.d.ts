import type { Readable } from 'stream';
import { DaytonaError } from '../errors/DaytonaError';
import type { DownloadMetadata, UploadProgress, UploadSource } from '../FileSystem';
/**
 * Safely aborts a stream
 */
export declare function abortStream(stream: any): void;
/**
 * Normalizes response data to extract the actual stream
 */
export declare function normalizeResponseStream(responseData: any): any;
/**
 * Processes multipart response using busboy (Node.js path).
 *
 * Once the file stream has been handed off via `onFileStream`, errors from the
 * busboy stream are the consumer's concern — they arrive via the file stream's
 * own 'error' event. The inner Promise resolves cleanly in that case to avoid
 * surfacing late teardown errors (busboy's `_final`, premature pipe close)
 * after the caller has already started consuming the file.
 */
export declare function processDownloadFilesResponseWithBusboy(stream: any, headers: Record<string, string>, metadataMap: Map<string, DownloadMetadata>, onFileStream?: (source: string, fileStream: any, totalBytes?: number) => void): Promise<void>;
export declare function processDownloadFilesResponseWithBuffered(stream: any, headers: Record<string, string>, metadataMap: Map<string, DownloadMetadata>): Promise<void>;
/** Construct the cancellation error thrown when an upload is aborted. */
export declare function createAbortError(remotePath: string): DaytonaError;
/**
 * Coerces every accepted upload source shape into a Node ``Readable`` so the
 * downstream multipart writer has a uniform input type. Web ``ReadableStream``
 * is bridged via ``Readable.fromWeb``; in-memory bytes via ``Readable.from``;
 * local paths via ``fs.createReadStream``; existing ``Readable`` is passed
 * through unchanged.
 */
export declare function coerceUploadSource(source: UploadSource): Promise<Readable>;
/**
 * Wraps an upload source in a pass-through that counts bytes and invokes
 * ``onProgress`` per chunk. When ``onProgress`` is omitted the source is
 * returned unchanged so there is zero overhead in the no-progress path.
 */
export declare function wrapWithUploadProgress(source: Readable, onProgress: ((progress: UploadProgress) => void) | undefined, signal?: AbortSignal): Readable;
//# sourceMappingURL=FileTransfer.d.ts.map