import * as fs from 'fs';
import { IncomingMessage } from 'http';
import { get } from 'https';
import * as path from 'path';

import StreamZip from 'node-stream-zip';

const defaultDirectory = path.resolve(__dirname, '..', 'polkadotjs');

export type Path =
  | string
  | {
      download: string;
      extract: string;
    };

export default async (version: string, location?: Path): Promise<string> => {
  const polkadotjsDirectory = typeof location === 'string' ? location : location?.extract || defaultDirectory;
  const downloadDirectory =
    typeof location === 'string' ? location : location?.download || path.resolve(defaultDirectory, 'download');

  if (version !== 'latest') {
    const extractDestination = path.resolve(polkadotjsDirectory, version.replace(/\./g, '_'));
    if (fs.existsSync(extractDestination)) return extractDestination;
  }
  const { filename, downloadUrl, tag } = await getPolkadotjsReleases(version);
  const extractDestination = path.resolve(polkadotjsDirectory, tag.replace(/\./g, '_'));
  if (!fs.existsSync(extractDestination)) {
    const downloadedFile = await downloadPolkadotjsReleases(filename, downloadUrl, downloadDirectory);
    const zip = new StreamZip.async({ file: downloadedFile });
    fs.mkdirSync(extractDestination);
    await zip.extract(null, extractDestination);
  }
  return extractDestination;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const request = (url: string): Promise<IncomingMessage> =>
  new Promise((resolve) => {
    const request = get(url, (response) => {
      if (response.statusCode == 302) {
        const redirectRequest = get(response.headers.location, resolve);
        redirectRequest.on('error', (error) => {
          // eslint-disable-next-line no-console
          console.warn('request redirected error:', error.message);
          throw error;
        });
      } else {
        resolve(response);
      }
    });
    request.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.warn('request error:', error.message);
      throw error;
    });
  });

const downloadPolkadotjsReleases = (name: string, url: string, location: string): Promise<string> =>
  // eslint-disable-next-line no-async-promise-executor
  new Promise(async (resolve) => {
    if (!fs.existsSync(location)) {
      fs.mkdirSync(location, { recursive: true });
    }
    const fileLocation = path.join(location, name);
    const file = fs.createWriteStream(fileLocation);
    const stream = await request(url);
    stream.pipe(file);
    stream.on('end', () => {
      resolve(fileLocation);
    });
  });

type PolkadotjsReleases = { downloadUrl: string; filename: string; tag: string };
const polkadotjsReleasesUrl = 'https://api.github.com/repos/polkadot-js/extension/releases';
const getPolkadotjsReleases = (version: string): Promise<PolkadotjsReleases> =>
  new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const request = get(polkadotjsReleasesUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      let body = '';
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        const data = JSON.parse(body);
        if (data.message) return reject(data.message);
        for (const result of data) {
          if (result.draft) continue;
          
          if (version === 'latest' || result.name === version || result.tag_name === version || result.name.includes(version) || result.tag_name.includes(version)) {
            for (const asset of result.assets) {
              if (asset.name === "master-build.zip")
                resolve({
                  downloadUrl: asset.browser_download_url,
                  filename: asset.name,
                  tag: result.tag_name,
                });
            }
          }
        }
        reject(`Version ${version} not found!`);
      });
    });
    request.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.warn('getPolkadotjsReleases error:', error.message);
      throw error;
    });
  });
