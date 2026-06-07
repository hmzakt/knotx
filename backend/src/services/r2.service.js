import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import mime from "mime-types";

export const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload every file in a flat directory to R2 under keyPrefix/.
 * Used after HLS transcode to push all .m3u8 and .ts files.
 *
 * @param {string} directoryPath  Absolute local path containing HLS files
 * @param {string} keyPrefix      R2 key prefix, e.g. "lectures/uuid"
 */
export const uploadDirectoryToR2 = async (directoryPath, keyPrefix) => {
  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) continue;

    const fileStream = fs.createReadStream(filePath);
    const contentType = mime.lookup(filePath) || "application/octet-stream";

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `${keyPrefix}/${file}`,
        Body: fileStream,
        ContentType: contentType,
      })
    );
  }
};

/**
 * Fetch an R2 object and return the raw SDK response.
 * Body is a web ReadableStream — pipe or transform as needed.
 * Used by the HLS streaming proxy.
 *
 * @param {string} objectKey  Full R2 object key
 * @returns {Promise<import("@aws-sdk/client-s3").GetObjectCommandOutput>}
 */
export const getR2Object = async (objectKey) => {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: objectKey,
  });
  return s3.send(command);
};

/**
 * Generate a short-lived pre-signed GET URL for a single R2 object.
 * Expires in 10 minutes — suitable for direct file downloads.
 *
 * @param {string} objectKey  Full R2 object key
 * @returns {Promise<string>} Pre-signed URL
 */
export const generateSignedPlaybackUrl = async (objectKey) => {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: objectKey,
  });
  return getSignedUrl(s3, command, { expiresIn: 60 * 10 });
};

/**
 * Delete all R2 objects whose key starts with keyPrefix.
 * Handles pagination — safe for lectures with many .ts segments.
 *
 * @param {string} keyPrefix  e.g. "lectures/uuid"
 */
export const deleteR2Prefix = async (keyPrefix) => {
  let continuationToken;

  do {
    const listResp = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        Prefix: keyPrefix,
        ContinuationToken: continuationToken,
      })
    );

    const objects = listResp.Contents || [];
    if (objects.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Delete: {
            Objects: objects.map((o) => ({ Key: o.Key })),
            Quiet: true,
          },
        })
      );
    }

    continuationToken = listResp.NextContinuationToken;
  } while (continuationToken);
};