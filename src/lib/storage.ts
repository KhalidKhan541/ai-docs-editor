import fs from "fs";
import path from "path";

interface StorageConfig {
  provider: "local" | "s3";
  local?: {
    uploadDir: string;
    serveUrl: string;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  };
}

interface UploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSize?: number;
}

interface UploadResult {
  id: string;
  key: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png" | "avif";
}

const DEFAULT_CONFIG: StorageConfig = {
  provider: "local",
  local: {
    uploadDir: "./public/uploads",
    serveUrl: "/uploads",
  },
};

let config: StorageConfig = DEFAULT_CONFIG;

export function configureStorage(newConfig: StorageConfig): void {
  config = newConfig;
}

function ensureDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateKey(folder: string, filename: string): string {
  const ext = path.extname(filename);
  const name = path.basename(filename, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${folder}/${timestamp}-${random}${ext}`;
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".json": "application/json",
  };
  return mimeTypes[ext] ?? "application/octet-stream";
}

function validateFile(
  filename: string,
  size: number,
  options: UploadOptions
): string | null {
  const ext = path.extname(filename).toLowerCase();
  if (
    options.allowedTypes &&
    options.allowedTypes.length > 0 &&
    !options.allowedTypes.includes(ext)
  ) {
    return `File type ${ext} is not allowed. Allowed: ${options.allowedTypes.join(", ")}`;
  }
  const maxSize = options.maxSize ?? 10 * 1024 * 1024;
  if (size > maxSize) {
    return `File size ${size} exceeds maximum ${maxSize} bytes`;
  }
  return null;
}

export async function uploadFile(
  file: Buffer | Uint8Array,
  filename: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const validationError = validateFile(filename, file.length, options);
  if (validationError) {
    throw new Error(validationError);
  }

  const folder = options.folder ?? "general";
  const key = generateKey(folder, filename);
  const mimeType = getMimeType(filename);

  if (config.provider === "s3") {
    return uploadToS3(file, key, mimeType);
  }

  return uploadToLocal(file, key, mimeType);
}

async function uploadToLocal(
  file: Buffer | Uint8Array,
  key: string,
  mimeType: string
): Promise<UploadResult> {
  const uploadDir = config.local?.uploadDir ?? DEFAULT_CONFIG.local!.uploadDir!;
  const serveUrl = config.local?.serveUrl ?? DEFAULT_CONFIG.local!.serveUrl!;

  const fullPath = path.join(uploadDir, key);
  const dir = path.dirname(fullPath);
  ensureDirectory(dir);

  fs.writeFileSync(fullPath, file);

  return {
    id: key,
    key,
    url: `${serveUrl}/${key}`,
    size: file.length,
    mimeType,
    createdAt: new Date().toISOString(),
  };
}

async function uploadToS3(
  file: Buffer | Uint8Array,
  key: string,
  mimeType: string
): Promise<UploadResult> {
  if (!config.s3) throw new Error("S3 not configured");

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
    endpoint: config.s3.endpoint,
  });

  await client.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
    })
  );

  const url = config.s3.endpoint
    ? `${config.s3.endpoint}/${config.s3.bucket}/${key}`
    : `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;

  return {
    id: key,
    key,
    url,
    size: file.length,
    mimeType,
    createdAt: new Date().toISOString(),
  };
}

export async function deleteFile(key: string): Promise<boolean> {
  if (config.provider === "s3") {
    if (!config.s3) return false;
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
    });
    await client.send(
      new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: key })
    );
    return true;
  }

  const uploadDir = config.local?.uploadDir ?? DEFAULT_CONFIG.local!.uploadDir!;
  const fullPath = path.join(uploadDir, key);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
}

export function getFileUrl(key: string): string {
  if (config.provider === "s3" && config.s3) {
    return config.s3.endpoint
      ? `${config.s3.endpoint}/${config.s3.bucket}/${key}`
      : `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;
  }
  const serveUrl = config.local?.serveUrl ?? DEFAULT_CONFIG.local!.serveUrl!;
  return `${serveUrl}/${key}`;
}

export function optimizeImage(
  _buffer: Buffer,
  options: ImageOptimizationOptions = {}
): { buffer: Buffer; format: string } {
  const format = options.format ?? "webp";
  const quality = options.quality ?? 80;

  // In production, use sharp or jimp for actual image processing
  // This is a placeholder that returns the original with metadata
  return {
    buffer: _buffer,
    format: `${format};quality=${quality};${options.width ?? "auto"}x${options.height ?? "auto"}`,
  };
}

export function generateThumbnail(
  _buffer: Buffer,
  size = 200
): { buffer: Buffer; width: number; height: number } {
  // In production, use sharp to generate thumbnails
  return {
    buffer: _buffer,
    width: size,
    height: size,
  };
}
