import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import fs from "fs-extra";
import path from "path";

/**
 * Parse video duration (seconds) from ffmpeg stderr.
 * ffmpeg always prints: "  Duration: HH:MM:SS.ss, start: ..."
 */

const parseDurationFromStderr = (stderr) => {
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return Math.round(parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s));
};

/**
 * Convert input video to multi-quality HLS (720p + 360p) in one ffmpeg pass.
 *
 * Output layout inside outputDir:
 *   master.m3u8         ← HLS master playlist (references both variants)
 *   720p.m3u8           ← 720p variant playlist
 *   720p_000.ts …       ← 720p segments
 *   360p.m3u8           ← 360p variant playlist
 *   360p_000.ts …       ← 360p segments
 *
 * @param {string} inputPath   Absolute path to source video file
 * @param {string} outputDir   Directory to write HLS output into
 * @returns {Promise<{ duration: number }>}  duration in seconds
 */
export const convertToHLS = async (inputPath, outputDir) => {
  await fs.ensureDir(outputDir);

  return new Promise((resolve, reject) => {
    // Build ffmpeg args for a single-pass, two-rendition HLS encode
    const args = [
      "-y",
      "-i", inputPath,

      // Split and scale both renditions in one filter graph (cannot combine with -vf)
      "-filter_complex",
      "[0:v]split=2[v720][v360];[v720]scale=-2:720[v720out];[v360]scale=-2:360[v360out]",

      // 720p rendition
      "-map", "[v720out]", "-map", "0:a?",
      "-c:v", "libx264", "-preset", "fast", "-crf", "23",
      "-b:v", "2500k", "-maxrate", "2675k", "-bufsize", "5000k",
      "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
      "-hls_time", "6",
      "-hls_list_size", "0",
      "-hls_segment_filename", path.join(outputDir, "720p_%03d.ts"),
      "-hls_flags", "independent_segments",
      "-f", "hls",
      path.join(outputDir, "720p.m3u8"),

      // 360p rendition
      "-map", "[v360out]", "-map", "0:a?",
      "-c:v", "libx264", "-preset", "fast", "-crf", "28",
      "-b:v", "800k", "-maxrate", "856k", "-bufsize", "1600k",
      "-c:a", "aac", "-b:a", "96k", "-ar", "48000",
      "-hls_time", "6",
      "-hls_list_size", "0",
      "-hls_segment_filename", path.join(outputDir, "360p_%03d.ts"),
      "-hls_flags", "independent_segments",
      "-f", "hls",
      path.join(outputDir, "360p.m3u8"),
    ];

    let stderrOutput = "";
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });

    proc.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderrOutput += text;
      // Surface progress lines without flooding
      const timeMatch = text.match(/time=(\S+)/);
      if (timeMatch) process.stdout.write(`\r[ffmpeg] ${timeMatch[0]}   `);
    });

    proc.on("close", async (code) => {
      process.stdout.write("\n");
      if (code !== 0) {
        return reject(
          new Error(`ffmpeg exited ${code}: ${stderrOutput.slice(-500)}`)
        );
      }

      // Write the HLS master playlist manually (ffmpeg doesn't generate one automatically for separate output files)
      const masterPlaylist = [
        "#EXTM3U",
        "#EXT-X-VERSION:3",
        "",
        `#EXT-X-STREAM-INF:BANDWIDTH=2628000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2",NAME="720p"`,
        "720p.m3u8",
        "",
        `#EXT-X-STREAM-INF:BANDWIDTH=896000,RESOLUTION=640x360,CODECS="avc1.42c01e,mp4a.40.2",NAME="360p"`,
        "360p.m3u8",
      ].join("\n");

      await fs.writeFile(
        path.join(outputDir, "master.m3u8"),
        masterPlaylist,
        "utf8"
      );

      const duration = parseDurationFromStderr(stderrOutput);
      resolve({ duration });
    });

    proc.on("error", (err) => reject(new Error(`ffmpeg spawn error: ${err.message}`)));
  });
};