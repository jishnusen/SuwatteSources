import {
  Chapter,
  ChapterData,
  Content,
  DirectoryFilter,
  DirectoryRequest,
  FilterPrimitives,
  Highlight,
  NetworkRequest,
  NetworkClientBuilder,
  Option,
  PagedResult,
  PublicationStatus,
  ReadingMode,
} from "@suwatte/daisuke";
import { CheerioElement, TachiHttpSource } from "../../template/tachiyomi";
import { CheerioAPI, load } from "cheerio";
import { startCase, toLower } from "lodash";
import {
  type Home,
  type BrowseSeries,
  type ApiResponse,
  type APIChapter,
  type SeriesResponse,
  type PageListResponse,
  api_to_title,
  api_to_content,
  api_to_chapter,
} from "./types";
import moment from "moment";

export class FlixScansTemplate extends TachiHttpSource {
  lang = "en";
  name = "FlixScans";
  supportsLatest = true;
  baseUrl = "";
  apiUrl: string;
  cdnUrl: string;

  constructor() {
    super();
    this.baseUrl = "https://flixscans.org";
    this.apiUrl = "https://flixscans.site/api/v1";
    this.cdnUrl = this.baseUrl.replace("://", "://media.") + "/";
    this.client = new NetworkClientBuilder()
      .addRequestInterceptor(async (r) => {
        return {
          ...r,
          headers: {
            ...r.headers,
            ...this.headers(),
          },
        };
      })
      .setRateLimit(2, 1)
      .build();
  }

  headers(): Record<string, string> {
    return {
      ...super.headers(),
      ...{"Referer": this.baseUrl}
    };
  }

  popularMangaRequest(_: number): NetworkRequest {
    return {
      url: this.apiUrl + "/webtoon/pages/home/action",
    };
  }

  parsePopularManga(response: string): PagedResult {
    const homepage: Home = JSON.parse(response);
    const titles = [
      ...homepage.hot,
      ...homepage.topWeek,
      ...homepage.topMonth,
      ...homepage.topAll];
    const results = titles.map((series) => api_to_title(series, this.cdnUrl));
    return {
      results,
      isLastPage: false,
    }
  }

  latestUpdatesRequest(page: number): NetworkRequest {
    return {
      url: this.apiUrl + `/search/advance?page=${page}&serie_type=webtoon`,
    };
  }

  parseLatestManga(response: string): PagedResult {
    const api_response: ApiResponse<BrowseSeries> = JSON.parse(response);
    const titles = api_response.data;
    const results = titles.map((series) => api_to_title(series, this.cdnUrl));
    const isLastPage = api_response.current_page < api_response.last_page;
    return {
      results,
      isLastPage,
    }
  }

  searchMangaRequest(request: DirectoryRequest): NetworkRequest {
    if (request.query) {
      return {
        url: this.apiUrl + `/search/serie/${request.query.trim()}`,
        params: {
          page: request.page,
        },
      };
    }

    throw new Error("Method not implemented.");
  }

  parseSearchManga(response: string, _: DirectoryRequest): PagedResult {
    return this.parseLatestManga(response);
  }

  mangaDetailsRequest(fragment: string): NetworkRequest {
    return {
      url: this.apiUrl + `/series/${fragment}`,
    };
  }

  parseMangaDetails(response: string): Content {
    const api_response: SeriesResponse = JSON.parse(response);
    return api_to_content(api_response.serie, this.cdnUrl);
  }

  chapterListRequest(fragment: string): NetworkRequest {
    const [ id, prefix ] = fragment.split("/");
    return {
      url: this.apiUrl + `/chapters/${id}-desc#${prefix}`,
    };
  }

  parseChapterList(_: string): Chapter[] {
    throw new Error("Method not implemented.");
  }

  private parseChapterListPrivate(response: string, prefix: string): Chapter[] {
    const api_response: APIChapter[] = JSON.parse(response);
    return api_response
      .map((c) => api_to_chapter(c, prefix))
      .map((c, index) => ({...c, index}));
  }

  async getMangaChapters(id: string): Promise<Chapter[]> {
    const request = this.chapterListRequest(id);
    const { data: response } = await this.client.request(request);
    const [_, prefix] = id.split("/");
    return this.parseChapterListPrivate(response, prefix);
  }

  pageListRequest(fragment: string): NetworkRequest {
    const [id, prefix] = fragment.split("/");
    return {
      url: this.apiUrl + `/chapters/webtoon/${id}/${prefix}`,
    };
  }

  parsePageList(response: string): ChapterData {
    const api_response: PageListResponse = JSON.parse(response);
    const pages = api_response.chapter.chapterData.webtoon.map((u) => {
      const url = this.cdnUrl + u;
      return { url };
    });
    return { pages };
  }
}

