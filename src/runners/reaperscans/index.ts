import {
  PageLink,
  PageLinkResolver,
  PageSection,
  ResolvedPageSection,
  RunnerInfo,
  SectionStyle,
} from "@suwatte/daisuke";
import { TachiBuilder } from "../../template/tachiyomi";
import { Template } from "./template";

const info: RunnerInfo = {
  id: "reaperscans",
  name: "ReaperScans",
  thumbnail: "reaperscans.png",
  version: 0.1,
  website: "https://reaperscans.org",
};

export class Target extends TachiBuilder implements PageLinkResolver {
  constructor() {
    super(info, Template);
  }

  async getSectionsForPage(link: PageLink): Promise<PageSection[]> {
    if (link.id !== "home") throw new Error("Accessing invalid page");
    return this.getHomePage();
  }

  resolvePageSection(_: PageLink, __: string): Promise<ResolvedPageSection> {
    throw new Error("Method not used");
  }

  private async getHomePage(): Promise<PageSection[]> {
    const client = this.source.client;
    const apiUrl = (this.source as Template).apiUrl;
    const trendingDaily = this.source.parsePopularManga(
      (await client.get(`${apiUrl}/trending?type=daily`)).data
    ).results;
    const trendingWeekly = this.source.parsePopularManga(
      (await client.get(`${apiUrl}/trending?type=weekly`)).data
    ).results;
    return [
      {
        id: "trending_weekly",
        title: "Trending Weekly",
        items: trendingWeekly,
        style: SectionStyle.GALLERY,
      },
      {
        id: "trending_daily",
        title: "Trending Daily",
        items: trendingDaily,
      },
    ];
  }
}
