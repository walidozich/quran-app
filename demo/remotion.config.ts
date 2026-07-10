import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("png"); // lossless frames → no gradient banding
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
// NOTE: crf is passed per-render on the CLI (--crf 16) for h264 outputs, so it
// doesn't conflict with codecs like prores that reject the option.
