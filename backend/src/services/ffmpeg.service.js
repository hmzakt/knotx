import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs-extra";
import path from "path";

ffmpeg.setFfmpegPath(ffmpegPath);

export const convertToHLS = async (
  inputPath,
  outputDir
) => {
  await fs.ensureDir(outputDir);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-codec: copy",
        "-start_number 0",
        "-hls_time 10",
        "-hls_list_size 0",
        "-f hls",
      ])

      .output(
        path.join(outputDir, "master.m3u8")
      )

      .on("end", () => {
        resolve();
      })

      .on("error", (err) => {
        reject(err);
      })

      .run();
  });
};