import { SourceConfig, RunnerInfo } from "@suwatte/daisuke";
import { TachiBuilder } from "../../template/tachiyomi";
import { NewToki } from "./template";

const INFO: RunnerInfo = {
  id: "newtoki",
  name: "NewToki",
  thumbnail: "newtoki.png",
  version: 0.1,
};

export const Target = new TachiBuilder(INFO, NewToki);
