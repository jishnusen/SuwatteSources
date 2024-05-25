import {
  Chapter,
  ChapterData,
  Content,
  DirectoryFilter,
  DirectoryRequest,
  FilterPrimitives,
  Highlight,
  NetworkRequest,
  Option,
  PublicationStatus,
  ReadingMode,
} from "@suwatte/daisuke";
import { CheerioElement, TachiParsedHttpSource } from "../../template/tachiyomi";
import { CheerioAPI, load } from "cheerio";
import { startCase, toLower } from "lodash";
import { FILTERS, PopulatedFilterGroup, SORT_OPTIONS } from "./filters";
import moment from "moment";

export class MangaFireTemplate extends TachiParsedHttpSource {
  supportsLatest = true;
  name = "MangaFire";
  baseUrl = "https://mangafire.to";
  lang = "en";

  // * Search
  searchMangaSelector(): string {
    return ".original.card-lg .unit .inner";
  }

  searchMangaNextPageSelector(): string {
    return ".page-link[rel=next]";
  }

  searchMangaFromElement(element: CheerioElement): Highlight {
    const link = element.find(".info > a").first();
    const id = link.attr("href") ?? "";
    const title = this.ownText(link);
    const cover = element.find("img").first().attr("src") ?? "";
    return { id, title, cover };
  }

  // Latest
  latestUpdatesRequest(page: number): NetworkRequest {
    return {
      url: `${this.baseUrl}/filter`,
      params: {
        sort: "recently_updated",
        "language[]": this.lang,
        page: page,
      },
    };
  }

  latestUpdatesSelector(): string {
    return this.searchMangaSelector();
  }

  latestUpdatesFromElement(element: CheerioElement): Highlight {
    return this.searchMangaFromElement(element);
  }

  latestUpdatesNextPageSelector(): string {
    return this.searchMangaNextPageSelector();
  }
  // Popular
  popularMangaRequest(page: number): NetworkRequest {
    return {
      url: `${this.baseUrl}/filter`,
      params: {
        sort: "most_viewed",
        "language[]": this.lang,
        page: page,
      },
    };
  }

  popularMangaSelector(): string {
    return this.searchMangaSelector();
  }
  popularMangaFromElement(element: CheerioElement): Highlight {
    return this.searchMangaFromElement(element);
  }

  popularMangaNextPageSelector(): string {
    return this.searchMangaNextPageSelector();
  }

  // Search

  searchMangaRequest(
    request: DirectoryRequest<PopulatedFilterGroup>
  ): NetworkRequest {
    if (request.query) {
      return {
        url: this.baseUrl + "/filter",
        params: {
          keyword: request.query,
          page: request.page,
        },
      };
    }

    const url = this.baseUrl + "/filter";
    const params: Record<string, FilterPrimitives> = {
      "language[]": this.lang,
      page: request.page,
      sort: request.sort?.id ?? "most_relevance",
    };

    const filters = request.filters;

    if (filters?.type && filters.type.length)
      filters.type.forEach((f) => params["type[]"] = f);
    if (filters?.status && filters.status.length)
      filters.status.forEach((f) => params["status[]"] = f);
    if (filters?.genre && filters.genre.length)
      filters.genre.forEach((f) => params["genre[]"] = f);

    return { url, params };
  }

  // * Manga Details
  mangaDetailsParse(document: CheerioAPI): Content {
    const root = document(".info").first();
    const title = this.ownText(root.find("h1"));
    const summary = root.find(".description").text().trim();
    const cover = document(".poster").find("img").first().attr("src") ?? "";
    const recommendedPanelMode = (() => {
      const type = root.find(".min-info").find("a").text() ?? "";
      switch (type) {
        case "Manga":
        case "Doujinshi":
        case "One-Shot":
          return ReadingMode.PAGED_MANGA;
        case "Manhwa":
        case "Manhua":
          return ReadingMode.WEBTOON;
        default:
          return;
      }
    })();
    const status = (() => {
      const status_text = this.ownText(root.children().first()) ?? "";
      switch (status_text) {
        case "Completed":
          return PublicationStatus.COMPLETED;
        case "Releasing":
          return PublicationStatus.ONGOING;
        case "On_hiatus":
          return PublicationStatus.HIATUS;
        case "Discontinued":
          return PublicationStatus.CANCELLED;
        default:
          return;
      }
    })();

    return {
      title,
      summary,
      cover,
      status,
      recommendedPanelMode
    };
  }

  // * Chapter List
  chapterListRequest(fragment: string): NetworkRequest {
    return {
      url:
        this.baseUrl +
        `/ajax/manga/${
          fragment.split(".").pop() ?? ""
        }/chapter/${this.lang}`,
    };
  }
  async addDataIds(html: string, fragment: string): Promise<string> {
    const { data: response } = await this.client.request({
      url:
        this.baseUrl +
        `/ajax/read/${
          fragment.split(".").pop() ?? ""
        }/chapter/${this.lang}`,
    });
    const $ = load(html);
    const $_id = load(JSON.parse(response).result.html);
    $(this.chapterListSelector()).toArray().forEach((element, idx) => {
      $(element).attr("data-id", $_id($_id("ul li").toArray()[idx]).find("a").first().attr("data-id"));
    });
    return $.html();
  }
  async getMangaChapters(id: string): Promise<Chapter[]> {
    const request = this.chapterListRequest(id);
    const { data: response } = await this.client.request(request);
    const html = await this.addDataIds(JSON.parse(response).result, id);
    return this.parseChapterList(html);
  }
  chapterListSelector(): string {
    return "ul li";
  }

  parseChapterList(html: string): Chapter[] {
    const $ = load(html);
    return $(this.chapterListSelector())
      .toArray()
      .map((element, idx) => {
        const data = this.chapterFromElement($(element));
        return this.generateChapter(data, idx, "");
      });
  }

  chapterFromElement(
    element: CheerioElement
  ): Omit<Chapter, "index" | "volume" | "language"> {
    const numberStr = element.attr("data-number") ?? "-1";
    const number = parseFloat(numberStr);

    const link = element.find("a").first();
    const title =
      link.attr("title") ??
      startCase(
        toLower(link.text().trim().replace(`Chap ${numberStr}: `, "").trim())
      );
    const chapterId = link.attr("href") + "#" + "chapter" + "/" + element.attr("data-id");
    moment.locale("en");
    const dateStr = link.children().last().text() ?? "Jan 1, 1970";
    const dateParsed = moment(dateStr, "MMM DD, yyyy")
    const date = dateParsed.isValid() ? dateParsed.toDate() : new Date();

    return { chapterId, title, number, date };
  }

  // * PageList
  async getPageList(_: string, chapter: string): Promise<ChapterData> {
    const [, typeAndID] = chapter.split("#");

    return this.internalFetchPageList(typeAndID);
  }

  protected async internalFetchPageList(
    fragment: string
  ): Promise<ChapterData> {
    const url = `${this.baseUrl}/ajax/read/${fragment}`;
    const { data } = await this.client.get(url);
    const { result } = JSON.parse(data);
    const images: ((string | number)[])[] = result.images;
    const pages  = images.map((i) =>  ({ url: i[0] + `#scrambled_${i[2]}` }));
    return { pages };
  }

  pageListParse(_: CheerioAPI): string[] {
    throw new Error("not implemented");
  }

  // * Filtering & Sorting
  async getFilterList(): Promise<DirectoryFilter[]> {
    return FILTERS;
  }
  async getSortOptions(): Promise<Option[]> {
    return SORT_OPTIONS;
  }
}
