import {
  NetworkRequest,
  SourceConfig,
  Highlight,
  Chapter,
  Content,
  DirectoryRequest,
  PagedResult,
  ReadingMode,
} from "@suwatte/daisuke";
import { CheerioAPI } from "cheerio";
import * as cheerio from "cheerio";
import {
  CheerioElement,
  TachiParsedHttpSource,
} from "../../template/tachiyomi";

export class NewToki extends TachiParsedHttpSource {
  name = "NewToki";
  baseUrl = "https://newtoki000.com";
  lang = "en";
  supportsLatest = false;
  config?: SourceConfig;

  constructor() {
    super();
    this.fetchDomainNumber();
  }

  fetchDomainNumber = async () => {
    let domainNumber = "_failed_fetch";
    const domainNumberUrl = "https://stevenyomi.github.io/source-domains/newtoki.txt";
    try {
      const client = new NetworkClient();
      const domainNumberResponse = await client.get(domainNumberUrl);
      domainNumber = Number(domainNumberResponse.data).toString();
    } catch (e) {
      console.error(`failed to fetch newtoki domain number: ${e}`)
    }
    this.baseUrl = `https://newtoki${domainNumber}.com`;
  }

  // Popular
  popularMangaSelector = () => "div#webtoon-list > ul > li";
  popularMangaNextPageSelector = () => "ul.pagination > li:last-child:not(.disabled)";
  popularMangaRequest = (p: number) => ({
    url: this.baseUrl + "/webtoon" + ((p > 1) ? `/p${p}` : ""),
    params: {
      "toon": "일반웹툰", // normal front page
      "sst": "as_view",
      "sod": "desc",
    }
  });
  popularMangaFromElement(element: CheerioElement): Highlight {
    const linkElement = element.find("a");
    const id = this.getUrlWithoutDomain(linkElement.attr("href") ?? "");
    const cover = linkElement.find("img").attr("src") ?? "";
    const title = element
      .find("span.title")
      .text()
      .trim();

    return {
      id,
      cover,
      title,
    };
  }

  // * Latest
  latestUpdatesSelector(): string {
    throw new Error("Not Used");
  }
  latestUpdatesRequest(_: number): NetworkRequest {
    throw new Error("Method not implemented.");
  }
  latestUpdatesFromElement(_: CheerioElement): Highlight {
    throw new Error("Method not implemented.");
  }

  // * Search
  searchMangaFromElement = this.popularMangaFromElement;
  searchMangaSelector = this.popularMangaSelector;
  searchMangaRequest(request: DirectoryRequest): NetworkRequest {
    let p = request.page;
    return {
      url: this.baseUrl + "/webtoon" + ((p > 1) ? `/p${p}` : ""),
      params: {
        "stx": request.query
      }
    };
  }
  parseSearchManga(html: string, ctx: DirectoryRequest): PagedResult {
    const data = super.parseSearchManga(html, ctx);
    const { query } = ctx;
    if (query) {
      const results = data.results.filter((v) =>
        v.title.toLowerCase().includes(query.toLowerCase())
      );
      return {
        results,
        isLastPage: true,
        totalResultCount: results.length,
      };
    } else
      return {
        ...data,
        isLastPage: true,
        totalResultCount: data.results.length,
      };
  }

  async willRequestImage(url: string): Promise<NetworkRequest> {
    return {
      url,
      headers: {
        referer: this.baseUrl + "/",
      },
    };
  }

  // * Manga Details
  mangaDetailsParse($: CheerioAPI): Content {
    const captcha = $("div.page-title > h2 > a > span").first().text().trim()
    if (captcha.includes("Captcha")) {
      const captchaUrl = $("link[rel='canonical']").attr("href");
      console.log("Got captcha request, resolve at: " + captchaUrl);
      throw new CloudflareError(captchaUrl);
    }
    const cover =
      $("div.row div.view-img > img").first().attr("src") ?? "";
    const title = $("div.view-content > span > b").first().text().trim();
    const summary = $("div.view-title > .view-content").first().text();

    return {
      title,
      cover,
      summary,
      recommendedPanelMode: ReadingMode.WEBTOON,
    };
  }

  // * Chapters
  chapterListSelector = () =>
    "div.serial-list > ul.list-body > li.list-item";

  chapterFromElement(
    element: CheerioElement
  ): Omit<Chapter, "index" | "volume"> {
    const linkElement = element.find(".wr-subject > a.item-subject").last();
    const chapterId = this.getUrlWithoutDomain(linkElement.attr("href") ?? "");
    const title = linkElement.contents()
      .filter(function() {
        return this.nodeType === 3;
      })
      .text()
      .trim();
    const number = Number(element.find(".wr-num").last().text().trim());
    const [year, month, day] = element
      .find(".wr-date").last().text().trim()
      .split(".")
      .map(n => Number(n));
    const date = new Date(year, month - 1, day);

    return {
      chapterId,
      title,
      number,
      date,
      language: "ko_KR",
    };
  }

  parseChapterNumber(title: string): number {
    try {
      if (title.includes("[단편]")) return 1;
      // `특별` means `Special`, so it can be buggy. so pad `편`(Chapter) to prevent false return
      if (title.includes("번외") || title.includes("특별편")) return -2;
      const chapterNumberRegex = /([0-9]+)(?:[-.]([0-9]+))?화/;
      const [ch_primal, ch_second] = chapterNumberRegex.exec(title.trim()) || ["-1", "-1"];
      return Number(ch_primal) || Number(ch_second);
    } catch (e) {
      console.error(`failed to parse chapter number ${e}`);
      return -1;
    }
  }

  // * Page List
  pageListParse($: CheerioAPI): string[] {
    const captcha = $("div.page-title > h2 > a > span").first().text().trim()
    if (captcha.includes("Captcha")) {
      const captchaUrl = $("link[rel='canonical']").attr("href");
      console.log("Got captcha request, resolve at: " + captchaUrl);
      throw new CloudflareError(captchaUrl);
    }
    const htmlDataRegex = /html_data\+='([^']+)'/g;
    const script = $("script:contains(\"html_data\")").first().text();
    const loadScript = $("script:contains(\"data_attribute\")").first().text();
    const dataAttr = "abs:data-" + loadScript.split("data_attribute: '")[1].split("',")[0];
    const html_data_hex = [...script.matchAll(htmlDataRegex)];
    let html_data = html_data_hex
      .flatMap(v => v[1].split("."))
      .map(v => parseInt(v, 16))
      .map(v => v > 0 ? String.fromCharCode(v) : '')
      .join('');
    const images = cheerio.load(html_data)("img[src='/img/loading-image.gif'], .view-img > img[itemprop]")
      .get()
    return images
      .map(e => e.attribs[dataAttr.split("abs:")[1]]);
  }

  async imageRequest(url: string): Promise<NetworkRequest> {
    return {
      url,
      headers: {
        ...this.headers(),
        Referer: this.baseUrl + "/",
      }
    }
  }
}
