import { FilterType, Option } from "@suwatte/daisuke";

const types: Option[] = [
  { title: "Manga", id: "manga" },
  { title: "One-Shot", id: "one_shot" },
  { title: "Doujinshi", id: "doujinshi" },
  { title: "Light-Novel", id: "light_novel" },
  { title: "Novel", id: "novel" },
  { title: "Manhwa", id: "manhwa" },
  { title: "Manhua", id: "manhua" },
];

const status = [
  { title: "Completed", id: "completed" },
  { title: "Releasing", id: "releasing" },
  { title: "On Hiatus", id: "on_hiatus" },
  { title: "Discontinued", id: "discontinued" },
  { title: "Not Yet Published", id: "info" },
];

const genres: Option[] = [
  { title: "Action", id: "1" },
  { title: "Adventure", id: "78" },
  { title: "Avant Garde", id: "3" },
  { title: "Boys Love", id: "4" },
  { title: "Comedy", id: "5" },
  { title: "Demons", id: "77" },
  { title: "Drama", id: "6" },
  { title: "Ecchi", id: "7" },
  { title: "Fantasy", id: "79" },
  { title: "Girls Love", id: "9" },
  { title: "Gourmet", id: "10" },
  { title: "Harem", id: "11" },
  { title: "Horror", id: "530" },
  { title: "Isekai", id: "13" },
  { title: "Iyashikei", id: "531" },
  { title: "Josei", id: "15" },
  { title: "Kids", id: "532" },
  { title: "Magic", id: "539" },
  { title: "Mahou Shoujo", id: "533" },
  { title: "Martial Arts", id: "534" },
  { title: "Mecha", id: "19" },
  { title: "Military", id: "535" },
  { title: "Music", id: "21" },
  { title: "Mystery", id: "22" },
  { title: "Parody", id: "23" },
  { title: "Psychological", id: "536" },
  { title: "Reverse Harem", id: "25" },
  { title: "Romance", id: "26" },
  { title: "School", id: "73" },
  { title: "Sci-Fi", id: "28" },
  { title: "Seinen", id: "537" },
  { title: "Shoujo", id: "30" },
  { title: "Shounen", id: "31" },
  { title: "Slice of Life", id: "538" },
  { title: "Space", id: "33" },
  { title: "Sports", id: "34" },
  { title: "Super Power", id: "75" },
  { title: "Supernatural", id: "76" },
  { title: "Suspense", id: "37" },
  { title: "Thriller", id: "38" },
  { title: "Vampire", id: "39" },
];

export const FILTERS = [
  {
    id: "type",
    title: "Type",
    options: types,
    type: FilterType.MULTISELECT,
  },
  {
    id: "status",
    title: "Status",
    options: status,
    type: FilterType.MULTISELECT,
  },
  {
    id: "genre",
    title: "Genres",
    options: genres,
    type: FilterType.MULTISELECT,
  },
];

export const SORT_OPTIONS: Option[] = [
  { title: "Trending", id: "trending" },
  { title: "Recently updated", id: "recently_updated" },
  { title: "Recently added", id: "recently_added" },
  { title: "Release date", id: "release_date" },
  { title: "Name A-Z", id: "title_az" },
  { title: "Score", id: "scores" },
  { title: "MAL score", id: "mal_scores" },
  { title: "Most viewed", id: "most_viewed" },
  { title: "Most favourited", id: "most_favourited" },
];

export type PopulatedFilterGroup = {
  type?: string[];
  status?: string[];
  genre?: string[];
};
