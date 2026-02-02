import { Chapter, ChapterData, RunnerInfo } from "@suwatte/daisuke";
import { TachiBuilder } from "../../template/tachiyomi";
import { Template } from "./template";

const info: RunnerInfo = {
  id: "asurascans",
  name: "Asura Scans",
  version: 0.35,
  website: "https://asuracomic.net",
  thumbnail: "asurascan.png",
};

class TachiBuilder2 extends TachiBuilder {
  async getChapterData(
    contentId: string,
    chapterId: string,
    chapter?: Chapter
  ): Promise<ChapterData> {
    const fakeChapterId = (chapter?.webUrl ?? "")
    return this.source.getPageList(contentId, fakeChapterId);
  }
}

export const Target = new TachiBuilder2(info, Template);
