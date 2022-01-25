import * as puppeteer from 'puppeteer';
import { Page } from 'puppeteer';

import { getPolkadotjs } from './wallet';
import downloader, { Path } from './polkadotjsDownloader';
import { isNewerVersion } from './utils';

import { importSeed, importSeedOptions } from './wallet/importSeed';


// re-export
export { getPolkadotjs };

export type LaunchOptions = Parameters<typeof puppeteer['launch']>[0] & {
  version: 'v0.42.6' | 'latest' | string;
  pathLocation?: Path;
};

export type PolkadotjsOptions = {
  seed?: string;
  password?: string;
  showTestNets?: boolean;
  hideSeed?: boolean;
  name?: string;
};

export type AddNetwork = {
  networkName: string;
  rpc: string;
  chainId: number;
  symbol?: string;
  explorer?: string;
};

export type Polkateer = {
  allow: () => Promise<void>;
  openAccountsPopup:  () => Promise<void>;
  openSettingsPopup:  () => Promise<void>;
  importSeed: (options: importSeedOptions) => Promise<void>;
  switchNetwork: (network: string) => Promise<void>;
  confirmTransaction: (options?: TransactionOptions) => Promise<void>;
  page: Page;
};

export type TransactionOptions = {
  gas?: number;
  gasLimit?: number;
};

export const RECOMMENDED_POLKADOTJS_VERSION = 'v0.42.6';

/**
 * Launch Puppeteer chromium instance with Polkadotjs plugin installed
 * */
export async function launch(puppeteerLib: typeof puppeteer, options: LaunchOptions): Promise<puppeteer.Browser> {
  if (!options || !options.version)
    throw new Error(
      `Pleas provide "version" (use recommended "${RECOMMENDED_POLKADOTJS_VERSION}" or "latest" to always get latest release of Polkadotjs)`,
    );

  const { args, version, pathLocation, ...rest } = options;

  /* eslint-disable no-console */
  console.log(); // new line
  if (version === 'latest')
    console.warn(
      '\x1b[33m%s\x1b[0m',
      `It is not recommended to run polkadotjs with "latest" version. Use it at your own risk or set to the recommended version "${RECOMMENDED_POLKADOTJS_VERSION}".`,
    );
  else if (isNewerVersion(RECOMMENDED_POLKADOTJS_VERSION, version))
    console.warn(
      '\x1b[33m%s\x1b[0m',
      `Seems you are running newer version of Polkadotjs that recommended by team.
      Use it at your own risk or set to the recommended version "${RECOMMENDED_POLKADOTJS_VERSION}".`,
    );
  else if (isNewerVersion(version, RECOMMENDED_POLKADOTJS_VERSION))
    console.warn(
      '\x1b[33m%s\x1b[0m',
      `Seems you are running older version of Polkadotjs that recommended by team.
      Use it at your own risk or set the recommended version "${RECOMMENDED_POLKADOTJS_VERSION}".`,
    );
  else console.log(`Running tests on Polkadotjs version ${version}`);

  console.log(); // new line
  /* eslint-enable no-console */

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const POLKADOTJS_PATH = await downloader(version, pathLocation);

  return puppeteerLib.launch({
    headless: false,
    args: [`--disable-extensions-except=${POLKADOTJS_PATH}`, `--load-extension=${POLKADOTJS_PATH}`, ...(args || [])],
    ...rest,
  });
}

/**
 * Setup Polkadotjs with base account
 * */
const defaultPolkadotjsOptions: PolkadotjsOptions = {
  showTestNets: true,
};

export async function setupPolkadotjs(
  browser: puppeteer.Browser,
  options: PolkadotjsOptions = defaultPolkadotjsOptions,
): Promise<Polkateer> {

  // set default values of not provided values (but required)
  for (const key of Object.keys(defaultPolkadotjsOptions)) {
    if (options[key] === undefined) options[key] = defaultPolkadotjsOptions[key];
  }

  const page = await getExtensionPage(browser)
  page.bringToFront()

  await confirmWelcomeScreen(page);

  await importSeed(page)({
    seed: options.seed || 'hope clutch worth stone glue frown humble sport minute bid dynamic chicken',
    password: options.password || 'password1234',
    name: options.name || "Polkateer_Account_0",
  });

  return getPolkadotjs(page);
}


export async function confirmWelcomeScreen(polkadotjsPage: puppeteer.Page): Promise<void> {
  const trigger = await polkadotjsPage.waitForSelector('button');
  await trigger.click();
}


/**
 * Return Polkadotjs instance
 * */
export async function getPolkadotjsWindow(browser: puppeteer.Browser, version?: string): Promise<Polkateer> {
  const polkadotjsPage = await new Promise<puppeteer.Page>((resolve) => {
    browser.pages().then((pages) => {
      for (const page of pages) {
        if (page.url().includes('chrome-extension')) resolve(page);
      }
    });
  });

  return getPolkadotjs(polkadotjsPage);
}

  // extract extension id
  async function getExtensionPage(browser: puppeteer.Browser): Promise<puppeteer.Page> {
    const page = await browser.newPage();

    await page.goto("about:extensions")
    await page.waitForSelector("extensions-manager")

    const id = await page.evaluate(() => {
      let manager = document.querySelector("extensions-manager").shadowRoot
      let extensionList = manager.querySelector("extensions-item-list").shadowRoot
      let extensionId = extensionList.querySelector("extensions-item").id
      return extensionId
    })

    await page.goto(`chrome-extension://${id}/index.html#/`)
    return page
}