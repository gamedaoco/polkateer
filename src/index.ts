import * as puppeteer from 'puppeteer';
import { Page } from 'puppeteer';

import { getPolkadotjs } from './wallet';
import downloader, { Path } from './polkadotjsDownloader';
import { isNewerVersion } from './utils';

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
};

export type AddNetwork = {
  networkName: string;
  rpc: string;
  chainId: number;
  symbol?: string;
  explorer?: string;
};

export type Polkateer = {
  lock: () => Promise<void>;
  unlock: (password: string) => Promise<void>;
  addNetwork: (options: AddNetwork) => Promise<void>;
  importPK: (pk: string) => Promise<void>;
  switchAccount: (accountNumber: number) => Promise<void>;
  switchNetwork: (network: string) => Promise<void>;
  confirmTransaction: (options?: TransactionOptions) => Promise<void>;
  sign: () => Promise<void>;
  approve: () => Promise<void>;
  addToken: (tokenAddress: string) => Promise<void>;
  getTokenBalance: (tokenSymbol: string) => Promise<number>;
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

  const page = await getExtensionPage(browser);

  console.log("sdfdfdf")
  await confirmWelcomeScreen(page);

  await importAccount(
    page,
    options.seed || 'hope clutch worth stone glue frown humble sport minute bid dynamic chicken',
    options.password || 'password1234',
    options.hideSeed,
  );

  await closeNotificationPage(browser);

  await showTestNets(page);

  return getPolkadotjs(page);
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

  return getPolkadotjs(polkadotjsPage, version);
}

async function closeHomeScreen(browser: puppeteer.Browser): Promise<puppeteer.Page> {
  return new Promise((resolve, reject) => {
    console.log("sfdf")
    browser.on('targetcreated', async (target) => {
      console.log("targetcreated")
      console.log(target.url())
      console.log(target.url().match('chrome-extension://[a-z]+/index.html'))
      if (target.url().match('chrome-extension://[a-z]+/index.html')) {
        try {
          const page = await target.page();
          console.log("sfdf")
          resolve(page);
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

async function getExtensionPage(browser: puppeteer.Browser): Promise<puppeteer.Page> {
    const page = await browser.newPage();
    console.log("sddfdsfdsdsf")
    //await page.goto(`sj`);
    return page
}

async function closeNotificationPage(browser: puppeteer.Browser): Promise<void> {
  browser.on('targetcreated', async (target) => {
    if (target.url().match('chrome-extension://[a-z]+/notification.html')) {
      try {
        const page = await target.page();
        await page.close();
      } catch {
        return;
      }
    }
  });
}

async function showTestNets(polkadotjsPage: puppeteer.Page): Promise<void> {
  const networkSwitcher = await polkadotjsPage.waitForSelector('.network-display');
  await networkSwitcher.click();
  await polkadotjsPage.waitForSelector('li.dropdown-menu-item');

  const showHideButton = await polkadotjsPage.waitForSelector('.network-dropdown-content--link');
  await showHideButton.click();

  const option = await polkadotjsPage.waitForSelector(
    '.settings-page__body > div:nth-child(7) > div:nth-child(2) > div > div > div:nth-child(1)',
  );
  await option.click();

  const header = await polkadotjsPage.waitForSelector('.app-header__logo-container');
  await header.click();
}

async function confirmWelcomeScreen(polkadotjsPage: puppeteer.Page): Promise<void> {
  const continueButton = await polkadotjsPage.waitForSelector('.welcome-page button');
  await continueButton.click();
}

async function importAccount(
  polkadotjsPage: puppeteer.Page,
  seed: string,
  password: string,
  hideSeed: boolean,
): Promise<void> {
  const importLink = await polkadotjsPage.waitForSelector('.first-time-flow button');
  await importLink.click();

  const metricsOptOut = await polkadotjsPage.waitForSelector('.metametrics-opt-in button.btn-primary');
  await metricsOptOut.click();

  if (hideSeed) {
    const seedPhraseInput = await polkadotjsPage.waitForSelector('.first-time-flow__seedphrase input[type=password]');
    await seedPhraseInput.click();
    await seedPhraseInput.type(seed);
  } else {
    const showSeedPhraseInput = await polkadotjsPage.waitForSelector('#ftf-chk1-label');
    await showSeedPhraseInput.click();

    const seedPhraseInput = await polkadotjsPage.waitForSelector('.first-time-flow textarea');
    await seedPhraseInput.type(seed);
  }

  const passwordInput = await polkadotjsPage.waitForSelector('#password');
  await passwordInput.type(password);

  const passwordConfirmInput = await polkadotjsPage.waitForSelector('#confirm-password');
  await passwordConfirmInput.type(password);

  const acceptTerms = await polkadotjsPage.waitForSelector('.first-time-flow__terms');
  await acceptTerms.click();

  const restoreButton = await polkadotjsPage.waitForSelector('.first-time-flow button');
  await restoreButton.click();

  const doneButton = await polkadotjsPage.waitForSelector('.end-of-flow button');
  await doneButton.click();

  const popupButton = await polkadotjsPage.waitForSelector('.popover-header__button');
  await popupButton.click();
}
