import { RunnerInfo } from "@suwatte/daisuke";
import { TachiBuilder } from "../../template/tachiyomi";
import { FlixScansTemplate } from "./template";

const info: RunnerInfo = {
  id: "flixscans",
  name: "FlixScans",
  thumbnail: "flixscans.png",
  version: 0.1,
  website: "https://flixscans.org",
};

export const Target = new TachiBuilder(info, FlixScansTemplate);
