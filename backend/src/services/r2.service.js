import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import fs from "fs";
import path from "path";
import mime from "mime-types";

const s3 = new S3Client({
  region: "auto",

  endpoint: process.env.R2_ENDPOINT,

  credentials: {
    accessKeyId:
      process.env.R2_ACCESS_KEY_ID,

    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const uploadDirectoryToR2 =
  async (directoryPath, keyPrefix) => {
    const files =
      fs.readdirSync(directoryPath);

    for (const file of files) {
      const filePath = path.join(
        directoryPath,
        file
      );

      const fileStream =
        fs.createReadStream(filePath);

      const contentType =
        mime.lookup(filePath) ||
        "application/octet-stream";

      const command =
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,

          Key: `${keyPrefix}/${file}`,

          Body: fileStream,

          ContentType: contentType,
        });

      await s3.send(command);
    }

    return `${process.env.R2_PUBLIC_URL}/${keyPrefix}/master.m3u8`;
  };