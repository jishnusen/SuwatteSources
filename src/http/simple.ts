import fs from 'fs';
import path from 'path';
import emulate from "@suwatte/emulator";

function listDirectories(directory: string): string[] {
    return fs.readdirSync(directory, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}
const runner_names = listDirectories(path.join(__dirname, "../runners/"));
const runners: { [name: string]: any; } = {};
for (const runner of runner_names) {
  import("../runners/" + runner).then(m => {
    runners[runner] = emulate(m.Target);
  });
}

const axios = require("axios");
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0';

async function get_popular(runner_name: string, page: any) {;
    const data = await runners[runner_name].getDirectory({
        page: page || 1,
        listId: "template_popular_list",
    });
    return data;
}

async function get_query(runner_name: string, query: string, page: any) {
    const data = await runners[runner_name].getDirectory({
        page: page || 1,
        query: query,
    });
    return data;
}

async function get_chapters(runner_name: string, id: string) {
    const data = await runners[runner_name].getChapters(id);
    return data;
}

async function get_pages(runner_name: string, id: string, chapterId: string) {
    const data = await runners[runner_name].getChapterData(id, chapterId);
    return data;
}

import express, { Request, Response } from 'express';
import morgan from 'morgan';

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan('tiny'));

app.use(express.static(path.join(__dirname, 'html')));
app.get('/runners', async (_, res: Response) => {
    res.send(Object.keys(runners));
});
app.get('/popular', async (req: Request, res: Response) => {
    const { runner, page } = req.query;
    if (runner) {
        res.send(await get_popular(runner as string, page));
    } else {
        res.status(400).send({});
    }
});
app.get('/search', async (req: Request, res: Response) => {
    const { runner, search, page } = req.query;
    if (runner && search) {
        res.send(await get_query(runner as string, search as string, page));
    } else {
        res.status(400).send({});
    }
});
app.get('/chapters', async (req: Request, res: Response) => {
    const { runner, id } = req.query;
    if (runner && id) {
        res.send(await get_chapters(runner as string, id as string));
    } else {
        res.status(400).send({});
    }
});
app.get('/pages', async (req: Request, res: Response) => {
    const { runner, id, chapterId } = req.query;
    if (runner && id && chapterId) {
        res.send(await get_pages(runner as string, id as string, chapterId as string));
    } else {
        res.status(400).send({});
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
