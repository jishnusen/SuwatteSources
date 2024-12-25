import type {
  AdvancedTracker,
  ContentTracker,
  RunnerInfo,
  TrackerConfig,
} from "@suwatte/daisuke";
import { MUAuthentication } from "./impl/auth";
import { TrackerImplementation } from "./impl/tracker";

const info: RunnerInfo = {
  id: "com.mangaupdates",
  name: "MangaUpdates",
  version: 0.1,
  website: "https://mangaupdates.com",
  thumbnail: "mangaupdates.png",
};

const config: TrackerConfig = {
  linkKeys: ["mangaupdates", "mu", "mangaupdates.com"],
};

type MangaUpdates = ContentTracker;

export const Target: MangaUpdates = {
  info,
  config,
  ...TrackerImplementation,
  ...MUAuthentication,
};
