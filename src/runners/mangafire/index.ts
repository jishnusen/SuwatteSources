import {
  BooleanState,
  CGSize,
  ContentSource,
  Form,
  ImageRedrawHandler,
  PageLink,
  PageLinkResolver,
  PageSection,
  RedrawWithSizeCommand,
  ResolvedPageSection,
  RunnerInfo,
  SourceConfig,
  UIPicker,
} from "@suwatte/daisuke";
import { TachiBuilder, TachiParsedHttpSource } from "../../template/tachiyomi";
import { MangaFireTemplate } from "./template";
import { redraw } from "./redraw";
import { getHomepage } from "./homepage";
import { LANGUAGE_OPTIONS } from "./constants";

const INFO: RunnerInfo = {
  id: "mangafire_to",
  name: "MangaFire",
  thumbnail: "mangafire.png",
  version: 0.1,
};

export class Target
  extends TachiBuilder
  implements ContentSource, ImageRedrawHandler, PageLinkResolver
{
  constructor() {
    super(INFO, MangaFireTemplate);
  }

  config?: SourceConfig | undefined = {
    disableChapterDataCaching: true,
  };

  // * Image Redraw Handler
  async shouldRedrawImage(url: string): Promise<BooleanState> {
    const offset = parseInt((url.split("#").pop() ?? "").split("_").pop() ?? "");
    const state = offset > 0;
    return { state };
  }

  async redrawImageWithSize(size: CGSize): Promise<RedrawWithSizeCommand> {
    return redraw(size);
  }

  // * Page Link Resolver
  async getSectionsForPage(link: PageLink): Promise<PageSection[]> {
    if (link.id !== "home") throw new Error("page not found.");
    if (!(this.source instanceof TachiParsedHttpSource))
      throw new Error("Invalid Config");
    return getHomepage(this.source);
  }
  async resolvePageSection(
    _: PageLink,
    __: string
  ): Promise<ResolvedPageSection> {
    throw new Error("Method not used.");
  }

  // Language Preferences
  async getPreferenceMenu(): Promise<Form> {
    const updateLang = (lang: string) => {
      this.source.lang = lang;
    }
    return {
      sections: [
        {
          header: "Languages",
          footer: "Language in which chapters will be available",
          children: [
            UIPicker({
              id: "chapter_lang",
              title: "Content Languages",
              options: LANGUAGE_OPTIONS,
              value: (await ObjectStore.string("chapter_lang")) ?? "en",
              async didChange(value) {
                updateLang(value);
                return ObjectStore.set("chapter_lang", value);
              },
            }),
          ],
        },
      ],
    };
  }
}
