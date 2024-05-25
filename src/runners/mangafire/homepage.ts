import { load } from "cheerio";
import {
  Generate,
  Highlight,
  PageSection,
  SectionStyle,
} from "@suwatte/daisuke";
import { TachiParsedHttpSource } from "../../template/tachiyomi";

export const getHomepage = async (
  source: TachiParsedHttpSource
): Promise<PageSection[]> => {
  const url = source.baseUrl + "/home";
  const { data: html } = await source.client.get(url);

  const $ = load(html);

  const trending = $("#top-trending .swiper-wrapper .swiper-slide")
    .toArray()
    .map((v) => {
      const element = $(v);

      const id = element.find(".unit").first().attr("href") ?? "";
      const poster = element.find(".poster").find("img").first();
      const cover = poster.attr("src") ?? "";
      const title = poster.attr("alt") ?? "";
      return Generate<Highlight>({ id, cover, title });
    });

  const parseChart = (data_name: string) =>
    $(`#most-viewed .tab-content[data-name=${data_name}] .swiper-wrapper .swiper-slide`)
      .toArray()
      .map((v) => {
        const element = $(v);

        const id = element.find("a").first().attr("href") ?? "";
        const poster = element.find(".poster").find("img").first();
        const cover = poster.attr("src") ?? "";
        const title = poster.attr("alt") ?? "";
        return Generate<Highlight>({ id, cover, title });
      });
  const topViewedDaily = parseChart("day");
  const topViewedWeekly = parseChart("week");
  const topViewedMonthly = parseChart("month");


  const { data: json } = await source.client.get(source.baseUrl + "/ajax/home/widget/updated-all");
  const latestHtml = load(JSON.parse(json).result);
  const latest = latestHtml(source.searchMangaSelector())
    .toArray()
    .map((v) => source.searchMangaFromElement($(v)));

  return [
    {
      id: "trending",
      title: "Trending Titles",
      items: trending,
      style: SectionStyle.INFO,
    },
    {
      id: "top_daily",
      title: "Top Daily",
      items: topViewedDaily,
      style: SectionStyle.DEFAULT,
    },
    {
      id: "top_weekly",
      title: "Top Weekly",
      items: topViewedWeekly,
      style: SectionStyle.DEFAULT,
    },
    {
      id: "top_monthly",
      title: "Top Monthly",
      items: topViewedMonthly,
      style: SectionStyle.DEFAULT,
    },
    {
      id: "latest",
      title: "Latest Updates",
      items: latest,
      style: SectionStyle.PADDED_LIST,
    },
  ];
};
