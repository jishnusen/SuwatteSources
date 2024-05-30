import {
  type Content,
  type Highlight,
  type Chapter,
  PublicationStatus,
  ReadingMode,
} from "@suwatte/daisuke";
import { load } from "cheerio";

export type Home = {
  hot: BrowseSeries[],
  topWeek: BrowseSeries[],
  topMonth: BrowseSeries[],
  topAll: BrowseSeries[],
}

export type BrowseSeries = {
  id: number,
  title: string,
  slug: string,
  prefix: number,
  thumbnail?: string,
}

export function api_to_title(series: BrowseSeries, cdnUrl: string): Highlight {
  return {
    id: `${series.id}/${series.prefix}`,
    title: series.title,
    cover: cdnUrl + `${series.thumbnail ?? ""}`,
    webUrl: `/series/${series.prefix}-${series.id}-${series.slug}`,
  }
}

export type ApiResponse<T> = {
  data: T[],
  current_page: number,
  last_page: number,
}

export type GenreHolder = {
    name: string,
    id: number,
}

export type SeriesResponse = {
  serie: Series,
}

export type Series = {
    id: number,
    title: string,
    slug: string,
    prefix: number,
    thumbnail?: string,
    story?: string,
    serietype?: string,
    maingenres?: string,
    othernames?: string[],
    status?: string,
    type?: string,
    authors?: GenreHolder[],
    artists?: GenreHolder[],
    genres?: GenreHolder[],
}

export function api_to_content(series: Series, cdnUrl: string): Content {
  return {
    title: series.title,
    cover: cdnUrl + `${series.thumbnail ?? ""}`,
    creators: [
      ...(series.authors ?? []).map((g) => g.name),
      ...(series.artists ?? []).map((g) => g.name)
    ],
    webUrl: `/series/${series.prefix}-${series.id}-${series.slug}`,
    summary: load(series.story ?? "").text(),
    additionalTitles: series.othernames,
    status: (() => {
      switch (series.status) {
        case "ongoing":
          return PublicationStatus.ONGOING;
        case "completed":
          return PublicationStatus.COMPLETED;
        case "onhold":
          return PublicationStatus.HIATUS;
        default:
          return
      }
    })(),
    recommendedPanelMode: ReadingMode.WEBTOON,
  };
}

export type APIChapter = {
    id: number,
    name: string,
    slug: string,
    createdAt?: string,
}

export function api_to_chapter(chapter: APIChapter, prefix: string): Chapter {
  return {
    chapterId: `${chapter.id}/${prefix}`,
    number: parseInt(chapter.name) ?? 0,
    index: parseInt(chapter.name) ?? 0,
    language: "en",
    date: new Date(chapter.createdAt ?? new Date()),
  }
}

export type PageListResponse = {
    chapter: ChapterPages;
}

export type ChapterPages = {
    chapterData: ChapterPageData;
}

export type ChapterPageData = {
    webtoon: string[];
}
