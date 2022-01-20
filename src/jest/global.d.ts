import { Config } from '@jest/types';
import puppeteer from 'puppeteer';

import { Polkateer, LaunchOptions, PolkadotjsOptions } from '..';

declare global {
  namespace NodeJS {
    interface Global {
      page: puppeteer.Page;
      browser: puppeteer.Browser;
      polkadotjs: Polkateer;
    }
  }
}

export type PolkateerConfig = Config.InitialOptions &
  Partial<{
    polkateer: LaunchOptions;
    polkadotjs: PolkadotjsOptions;
  }>;
