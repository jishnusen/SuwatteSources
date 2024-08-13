import {
  type Content,
  type Highlight,
  type Chapter,
  PublicationStatus,
  ReadingMode,
} from "@suwatte/daisuke";
import { ChapterRecognition } from "../../template/tachiyomi";

export type ApiTag = {
  id: number;
  name: string;
};

export type ApiComic = {
  id: number;
  title: string;
  description: string;
  author: string;
  studio: string;
  release_year: number;
  alternative_names: string;
  adult: boolean;
  series_type: string;
  series_slug: string;
  thumbnail: string;
  status: string;
  badge: string;
  rating: number;
  tags: ApiTag[];
};

export type ApiChapter = {
  id: number;
  chapter_name: string;
  chapter_title?: string;
  chapter_thumbnail?: string;
  chapter_slug: string;
  price: number;
  created_at: Date;
  series: ApiComic;
};

export function api_to_title(comic: ApiComic, cdnUrl: string): Highlight {
  return {
    id: comic.series_slug + `#${comic.id}`,
    title: comic.title,
    cover: comic.thumbnail.startsWith("https")
      ? comic.thumbnail
      : `${cdnUrl}/${comic.thumbnail}`,
    webUrl: `/series/${comic.series_slug}`,
    isNSFW: comic.adult,
    context: {
      api_comic: comic,
    },
  };
}

export function api_to_content(comic: ApiComic, cdnUrl: string): Content {
  return {
    title: comic.title,
    summary:
      comic.description + `\r\n\r\nAlso known as: ${comic.alternative_names}`,
    creators: comic.author.split(",").concat([comic.studio]),
    isNSFW: comic.adult,
    cover: comic.thumbnail.startsWith("https")
      ? comic.thumbnail
      : `${cdnUrl}/${comic.thumbnail}`,
    status: ((status) => {
      switch (status) {
        case "Ongoing":
          PublicationStatus.ONGOING;
        case "Hiatus":
          PublicationStatus.HIATUS;
        case "Completed":
          PublicationStatus.COMPLETED;
        case "Dropped":
          PublicationStatus.CANCELLED;
        default:
          return PublicationStatus.ONGOING;
      }
    })(comic.status),
    properties: comic.tags.map((tag) => ({
      id: tag.id.toString(),
      title: tag.name,
      tags: [],
    })),
    recommendedPanelMode: ReadingMode.WEBTOON,
  };
}

export function api_to_chapter(chapter: ApiChapter, cdnUrl: string): Chapter {
  return {
    chapterId: `${chapter.series.series_slug}/${chapter.chapter_slug}`,
    number: new ChapterRecognition().parseChapterNumber(
      "",
      chapter.chapter_name
    ),
    index: 0, // placeholder
    date: new Date(chapter.created_at ?? new Date()),
    language: "en",
    title: chapter.chapter_title,
    thumbnail: ((th) => {
      if (th) {
        if (th.startsWith("https")) return th;
        else return `${cdnUrl}/${th}`;
      } else return undefined;
    })(chapter.chapter_thumbnail),
  };
}
