import {
  ContentTracker,
  Form,
  FormSection,
  Generate,
  Highlight,
  TrackStatus,
  TrackProgress,
  TrackProgressUpdate,
  TrackEntry,
  UIPicker,
  UIStepper,
} from "@suwatte/daisuke";
import { AUTHENTICATED_CLIENT } from "../api/auth";

const client = AUTHENTICATED_CLIENT;

const STATUS_MAP = {
  ["CURRENT"]: 0,
  [TrackStatus.READING]: 0,
  [TrackStatus.PLANNING]: 1,
  [TrackStatus.COMPLETED]: 2,
  [TrackStatus.PAUSED]: 4,
  [TrackStatus.DROPPED]: 3,
  [TrackStatus.REREADING]: 0,
};

const LIST_MAP: {[key: number]: TrackStatus} = {
// @ts-ignore
  [0]: "CURRENT",
  [1]: TrackStatus.PLANNING,
  [2]: TrackStatus.COMPLETED,
  [4]: TrackStatus.PAUSED,
  [3]: TrackStatus.DROPPED,
};

export const TrackerImplementation: Omit<ContentTracker, "info"> = {

  async didUpdateLastReadChapter(id: string, progress: TrackProgressUpdate): Promise<void> {
      return client.post(
        "https://api.mangaupdates.com/v1/lists/series/update",
        {
        body: [
          {
            series: {
              id: Number(id),
            },
            status: progress
          }
        ]
      }
    ).then()
  },

  async getResultsForTitles(titles: string[]): Promise<Highlight[]> {
    return client.post("https://api.mangaupdates.com/v1/series/search", {
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        search: titles[0],
      }
    }).then((res) => {
      return (JSON.parse(res.data).results as any[]).map((result) => {
        const record = result.record;
        return ({
          id: String(record.series_id),
          title: decodeURI(record.title),
          cover: record.image?.url.original ?? "",
          webUrl: record.url,
        })
      }
    )});
  },

  async getTrackItem(id: string): Promise<Highlight> {
    const series_url = (() => {
      if (/^[0-9]+$/.test(id))
        return "https://www.mangaupdates.com/series.html?id="
      else
        return "https://www.mangaupdates.com/series/"
    })();
    const source_id = ((await client.get(series_url + id))
      .data.match(/https:\/\/api.mangaupdates.com\/v1\/series\/([0-9]+)\/rss/) || [])[1];
    const record = JSON.parse((await client.get("https://api.mangaupdates.com/v1/series/" + source_id)).data);
    const highlight = {
      id: String(record.series_id),
      title: decodeURI(record.title),
      cover: record.image?.url.original ?? "",
      webUrl: record.url,
    };
    try {
      const list_status = JSON.parse((await client.get("https://api.mangaupdates.com/v1/lists/series/" + record.series_id)).data);
      const series_meta = JSON.parse((await client.get("https://api.mangaupdates.com/v1/series/" + record.series_id)).data);
      const status: TrackStatus = LIST_MAP[list_status.list_id];
      const progress: TrackProgress = {
        lastReadChapter: list_status.status.chapter,
        lastReadVolume: list_status.status.volume,
        maxAvailableChapter: series_meta.latest_chapter,
      };
      const entry: TrackEntry = { status, progress };
      return { ...highlight, entry } as Highlight;
    } catch (_) {
      return highlight;
    }
  },

  beginTracking: async function (
    id: string,
    status: TrackStatus
  ): Promise<void> {
    await client.post(
      "https://api.mangaupdates.com/v1/lists/series",
      {
        body: [
          {
            series: {
              id: Number(id),
            },
            list_id: STATUS_MAP[status],
            status: {
              volume: 0,
              chapter: 0
            }
          }
        ]
      }
    )
  },

  getEntryForm: async function (id: string): Promise<Form> {
    const { entry } = await this.getTrackItem(id);
    return Generate<Form>({
      sections: [
        // Progress
        Generate<FormSection>({
          header: "Reading Progress",
          children: [
            UIStepper({
              id: "progress",
              title: "Chapter",
              value: entry?.progress.lastReadChapter,
              upperBound: entry?.progress.maxAvailableChapter,
              allowDecimal: true,
            }),
            UIStepper({
              id: "progressVolumes",
              title: "Volume",
              value: entry?.progress.lastReadVolume ?? 0,
            }),
          ],
        }),
      ]
    });
  },

  async didSubmitEntryForm(id: string, form: any): Promise<void> {
    return client.post(
        "https://api.mangaupdates.com/v1/lists/series/update",
        {
        body: [
          {
            series: {
              id: Number(id),
            },
            status: {
              volume: form.progressVolumes,
              chapter: form.progress,
            }
          }
        ]
      }
    ).then()
  },

  didUpdateStatus: async function (
    id: string,
    status: TrackStatus
  ): Promise<void> {
    await client.post(
        "https://api.mangaupdates.com/v1/lists/series/update",
        {
        body: [
          {
            series: {
              id: Number(id),
            },
            list_id: STATUS_MAP[status],
          }
        ]
      }
    )
  },
};
