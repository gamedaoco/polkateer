import puppeteer from 'puppeteer';

import { launch, LaunchOptions, setupPolkadotjs } from '../index';

import { PolkateerConfig } from './global';

export const Polkateer_DEFAULT_CONFIG: LaunchOptions = { version: 'latest' };

export default async function (jestConfig: PolkateerConfig = { polkateer: Polkateer_DEFAULT_CONFIG }): Promise<void> {
  const browser = await launch(puppeteer, jestConfig.polkateer || Polkateer_DEFAULT_CONFIG);
  try {
    await setupPolkadotjs(browser, jestConfig.polkadotjs);
    global.browser = browser;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    throw error;
  }
  process.env.PUPPETEER_WS_ENDPOINT = browser.wsEndpoint();
}
