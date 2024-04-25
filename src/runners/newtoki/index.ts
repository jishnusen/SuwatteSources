import { SourceConfig, RunnerInfo } from "@suwatte/daisuke";
import { TachiBuilder } from "../../template/tachiyomi";
import { TachiHttpSource } from "../../template/tachiyomi/source";
import { NewToki } from "./template";

const INFO: RunnerInfo = {
  id: "newtoki",
  name: "NewToki",
  thumbnail: "newtoki.png",
  version: 0.2,
  website: "https://jishnusen.github.io/newtoki.html"
};

class NewtokiBuilder extends TachiBuilder {
  config?: SourceConfig = {
    cloudflareResolutionURL: "https://jishnusen.github.io/newtoki.html",
  }
  constructor(info: RunnerInfo, template: new () => TachiHttpSource) {
    super(info, template);
  }
}

export const Target = new NewtokiBuilder(INFO, NewToki);
