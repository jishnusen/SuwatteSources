import {
  DirectoryRequest,
  NetworkRequest,
  NetworkClientBuilder,
  PagedResult,
  Content,
  Chapter,
  ChapterData,
  ChapterPage,
} from "@suwatte/daisuke";
import { MangaThemesiaTemplate } from "../../template/mangathemesia";
import { CheerioAPI } from "cheerio";
import {
  api_to_chapter,
  api_to_content,
  api_to_title,
  ApiChapter,
  ApiComic,
} from "./types";

export class Template extends MangaThemesiaTemplate {
  baseUrl = "https://reaperscans.com";
  apiUrl = "https://api.reaperscans.com";
  cdnUrl = "https://media.reaperscans.com/file/4SRBHm";

  lang = "en";
  name = "Reaper Scans";

  dateFormat = "MMMM DD, yyyy";

  constructor() {
    super();
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
      ...{ referer: this.baseUrl + "/" },
    };
  }

  popularMangaRequest(page: number): NetworkRequest {
    return {
      url: this.apiUrl + "/trending",
    };
  }

  parsePopularManga(response: string): PagedResult {
    const trending: ApiComic[] = JSON.parse(response);
    const results = trending
      .filter((series) => series.series_type == "Comic")
      .map((series) => api_to_title(series, this.cdnUrl));
    return {
      results,
      isLastPage: true,
    };
  }

  searchMangaRequest(request: DirectoryRequest): NetworkRequest {
    const query_string = request.query
      ?.trim()
      .replace(/\s+/g, " ")
      .replaceAll(" ", "+");
    return {
      url: this.apiUrl + "/query",
      params: {
        adult: true,
        series_type: "Comic",
        perPage: 200,
        page: request.page,
        query_string,
      },
    };
  }

  parseSearchManga(response: string, _: DirectoryRequest): PagedResult {
    const response_obj = JSON.parse(response);
    const search_results: ApiComic[] = response_obj.data;
    const results = search_results
      .filter((series) => series.series_type == "Comic")
      .map((series) => api_to_title(series, this.cdnUrl));
    return {
      results,
      isLastPage:
        response_obj.meta.current_page === response_obj.meta.last_page,
    };
  }

  latestUpdatesRequest(page: number): NetworkRequest {
    return {
      url: this.apiUrl + "/query",
      params: {
        adult: true,
        series_type: "Comic",
        perPage: 15,
        order: "desc",
        orderBy: "updated_at",
        page: page,
      },
    };
  }

  mangaDetailsRequest(slug: string): NetworkRequest {
    return {
      url: this.apiUrl + `/series/${slug}`,
    };
  }

  parseMangaDetails(response: string): Content {
    const details: ApiComic = JSON.parse(response);
    return api_to_content(details, this.cdnUrl);
  }

  chapterListRequest(fragment: string): NetworkRequest {
    return {
      url: this.apiUrl + "/chapter/query",
      params: {
        perPage: "PHP_INT_MAX",
        series_id: fragment.split("#").at(-1),
        page: 1,
      },
    };
  }

  parseChapterList(response: string): Chapter[] {
    const chapters: ApiChapter[] = JSON.parse(response).data;
    return chapters
      .filter((ch) => ch.price == 0)
      .map((ch, index) => ({
        ...api_to_chapter(ch, this.cdnUrl),
        index,
      }));
  }

  pageListRequest(fragment: string): NetworkRequest {
    return {
      url: this.apiUrl + `/chapter/${fragment}`,
    };
  }

  parsePageList(response: string): ChapterData {
    const pages: ChapterPage[] = JSON.parse(response)
      .chapter.chapter_data.images.map((p: string) => {
        if (p.startsWith("https")) return p;
        else return `${this.cdnUrl}/${p}`;
      })
      .map((url: string) => ({ url }));
    return { pages };
  }
}
