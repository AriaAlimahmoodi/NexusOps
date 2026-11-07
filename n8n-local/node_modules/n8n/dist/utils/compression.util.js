"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressFolder = compressFolder;
exports.decompressFolder = decompressFolder;
const backend_common_1 = require("@n8n/backend-common");
const fflate = __importStar(require("fflate"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path = __importStar(require("path"));
const stream_1 = require("stream");
const promises_2 = require("stream/promises");
const zlib_1 = require("zlib");
const ALREADY_COMPRESSED = [
    '7z',
    'aifc',
    'bz2',
    'doc',
    'docx',
    'gif',
    'gz',
    'heic',
    'heif',
    'jpg',
    'jpeg',
    'mov',
    'mp3',
    'mp4',
    'pdf',
    'png',
    'ppt',
    'pptx',
    'rar',
    'webm',
    'webp',
    'xls',
    'xlsx',
    'zip',
];
function sanitizePath(fileName, outputDir) {
    const normalizedPath = path.normalize(fileName);
    const resolvedPath = path.resolve(outputDir, normalizedPath);
    const resolvedOutputDir = path.resolve(outputDir);
    if (!resolvedPath.startsWith(resolvedOutputDir + path.sep) &&
        resolvedPath !== resolvedOutputDir) {
        throw new Error(`Path traversal detected: ${fileName} would be extracted outside the output directory`);
    }
    return resolvedPath;
}
async function compressFolder(sourceDir, outputPath, options = {}) {
    const { level = 6, exclude = [], includeHidden = false } = options;
    const outputDir = path.dirname(outputPath);
    await (0, promises_1.mkdir)(outputDir, { recursive: true });
    const outputStream = (0, fs_1.createWriteStream)(outputPath);
    const zip = new fflate.Zip();
    zip.ondata = (error, data, final) => {
        if (error) {
            outputStream.destroy(error);
            return;
        }
        outputStream.write(Buffer.from(data));
        if (final) {
            outputStream.end();
        }
    };
    await addDirectoryToZipStreaming(sourceDir, '', zip, { exclude, includeHidden, level });
    zip.end();
    return await new Promise((resolve, reject) => {
        outputStream.on('finish', resolve);
        outputStream.on('error', reject);
    });
}
async function decompressFolder(sourcePath, outputDir) {
    await (0, promises_1.mkdir)(outputDir, { recursive: true });
    const absoluteSourcePath = path.resolve(sourcePath);
    const fileHandle = await (0, promises_1.open)(sourcePath, 'r');
    try {
        const { size: fileSize } = await fileHandle.stat();
        const { cdOffset, cdSize } = await readEOCD(fileHandle, fileSize);
        const entries = await readCentralDirectory(fileHandle, cdOffset, cdSize);
        for (const entry of entries) {
            if (entry.name.endsWith('/'))
                continue;
            const filePath = sanitizePath(entry.name, outputDir);
            if (filePath === absoluteSourcePath)
                continue;
            (0, fs_1.mkdirSync)(path.dirname(filePath), { recursive: true });
            const dataOffset = await getDataOffset(fileHandle, entry.localHeaderOffset);
            const readStream = stream_1.Readable.from(readFileChunks(fileHandle, Number(dataOffset), Number(entry.compressedSize)));
            const writeStream = (0, fs_1.createWriteStream)(filePath);
            if (entry.compressionMethod === COMPRESSION_DEFLATE) {
                await (0, promises_2.pipeline)(readStream, (0, zlib_1.createInflateRaw)(), writeStream);
            }
            else if (entry.compressionMethod === COMPRESSION_STORED) {
                await (0, promises_2.pipeline)(readStream, writeStream);
            }
            else {
                throw new Error(`Unsupported ZIP compression method: ${entry.compressionMethod}`);
            }
        }
    }
    finally {
        await fileHandle.close();
    }
}
async function addDirectoryToZipStreaming(dirPath, zipPath, zip, options) {
    const { exclude, includeHidden, level } = options;
    const entries = await (0, promises_1.readdir)(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        if (!includeHidden && entry.name.startsWith('.')) {
            continue;
        }
        if (exclude.some((pattern) => pattern.startsWith('*.')
            ? entry.name.endsWith(pattern.slice(1))
            : entry.name.includes(pattern))) {
            continue;
        }
        const fullPath = (0, backend_common_1.safeJoinPath)(dirPath, entry.name);
        const zipEntryPath = zipPath ? `${zipPath}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            await addDirectoryToZipStreaming(fullPath, zipEntryPath, zip, options);
        }
        else {
            const fileExtension = path.extname(entry.name).toLowerCase().slice(1);
            const compressionLevel = ALREADY_COMPRESSED.includes(fileExtension)
                ? 0
                : level;
            const zipStream = new fflate.ZipDeflate(zipEntryPath, { level: compressionLevel });
            zip.add(zipStream);
            const fileContent = await (0, promises_1.readFile)(fullPath);
            zipStream.push(new Uint8Array(fileContent), true);
        }
    }
}
const EOCD_SIG = 0x06054b50;
const EOCD64_LOCATOR_SIG = 0x07064b50;
const EOCD64_SIG = 0x06064b50;
const CD_ENTRY_SIG = 0x02014b50;
const LOCAL_HEADER_SIG = 0x04034b50;
const ZIP64_EXTRA_ID = 0x0001;
const COMPRESSION_STORED = 0;
const COMPRESSION_DEFLATE = 8;
async function tryReadZip64(fileHandle, locatorPos) {
    if (locatorPos < 0)
        return null;
    const locBuf = Buffer.allocUnsafe(20);
    await fileHandle.read(locBuf, 0, 20, locatorPos);
    if (locBuf.readUInt32LE(0) !== EOCD64_LOCATOR_SIG)
        return null;
    const eocd64Offset = Number(locBuf.readBigUInt64LE(8));
    const eocd64Buf = Buffer.allocUnsafe(56);
    await fileHandle.read(eocd64Buf, 0, 56, eocd64Offset);
    if (eocd64Buf.readUInt32LE(0) !== EOCD64_SIG)
        return null;
    return {
        cdSize: eocd64Buf.readBigUInt64LE(40),
        cdOffset: eocd64Buf.readBigUInt64LE(48),
    };
}
async function readEOCD(fileHandle, fileSize) {
    const searchSize = Math.min(65557, fileSize);
    const buf = Buffer.allocUnsafe(searchSize);
    await fileHandle.read(buf, 0, searchSize, fileSize - searchSize);
    for (let i = searchSize - 22; i >= 0; i--) {
        if (buf.readUInt32LE(i) !== EOCD_SIG)
            continue;
        const cdSize32 = buf.readUInt32LE(i + 12);
        const cdOffset32 = buf.readUInt32LE(i + 16);
        if (cdSize32 === 0xffffffff || cdOffset32 === 0xffffffff) {
            const zip64 = await tryReadZip64(fileHandle, fileSize - searchSize + i - 20);
            if (zip64)
                return zip64;
        }
        return { cdSize: BigInt(cdSize32), cdOffset: BigInt(cdOffset32) };
    }
    throw new Error('Could not find End of Central Directory record in ZIP file');
}
async function readCentralDirectory(fileHandle, cdOffset, cdSize) {
    const buf = Buffer.allocUnsafe(Number(cdSize));
    await fileHandle.read(buf, 0, Number(cdSize), Number(cdOffset));
    const entries = [];
    let pos = 0;
    while (pos + 46 <= buf.length) {
        if (buf.readUInt32LE(pos) !== CD_ENTRY_SIG)
            break;
        const compressionMethod = buf.readUInt16LE(pos + 10);
        let compressedSize = BigInt(buf.readUInt32LE(pos + 20));
        let uncompressedSize = BigInt(buf.readUInt32LE(pos + 24));
        const nameLength = buf.readUInt16LE(pos + 28);
        const extraLength = buf.readUInt16LE(pos + 30);
        const commentLength = buf.readUInt16LE(pos + 32);
        let localHeaderOffset = BigInt(buf.readUInt32LE(pos + 42));
        const name = buf.toString('utf8', pos + 46, pos + 46 + nameLength);
        let ePos = pos + 46 + nameLength;
        const eEnd = ePos + extraLength;
        while (ePos + 4 <= eEnd) {
            const headerId = buf.readUInt16LE(ePos);
            const dataSize = buf.readUInt16LE(ePos + 2);
            if (headerId === ZIP64_EXTRA_ID) {
                let z = ePos + 4;
                if (uncompressedSize === BigInt(0xffffffff) && z + 8 <= eEnd) {
                    uncompressedSize = buf.readBigUInt64LE(z);
                    z += 8;
                }
                if (compressedSize === BigInt(0xffffffff) && z + 8 <= eEnd) {
                    compressedSize = buf.readBigUInt64LE(z);
                    z += 8;
                }
                if (localHeaderOffset === BigInt(0xffffffff) && z + 8 <= eEnd) {
                    localHeaderOffset = buf.readBigUInt64LE(z);
                }
                break;
            }
            ePos += 4 + dataSize;
        }
        entries.push({ name, compressionMethod, compressedSize, localHeaderOffset });
        pos += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
}
async function getDataOffset(fileHandle, localHeaderOffset) {
    const buf = Buffer.allocUnsafe(30);
    await fileHandle.read(buf, 0, 30, Number(localHeaderOffset));
    if (buf.readUInt32LE(0) !== LOCAL_HEADER_SIG) {
        throw new Error(`Invalid local file header at offset ${localHeaderOffset}`);
    }
    const nameLength = buf.readUInt16LE(26);
    const extraLength = buf.readUInt16LE(28);
    return localHeaderOffset + BigInt(30 + nameLength + extraLength);
}
async function* readFileChunks(fileHandle, offset, size, chunkSize = 64 * 1024) {
    let pos = offset;
    let remaining = size;
    while (remaining > 0) {
        const toRead = Math.min(remaining, chunkSize);
        const buf = Buffer.allocUnsafe(toRead);
        const { bytesRead } = await fileHandle.read(buf, 0, toRead, pos);
        if (bytesRead === 0)
            break;
        yield bytesRead === toRead ? buf : buf.subarray(0, bytesRead);
        pos += bytesRead;
        remaining -= bytesRead;
    }
}
//# sourceMappingURL=compression.util.js.map