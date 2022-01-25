import { Page } from 'puppeteer';
import { Polkateer } from '..';

import { allow } from './allow';
import { confirmTransaction } from './confirmTransaction';
import { importSeed } from './importSeed';
import { switchNetwork } from './switchNetwork';


export const getPolkadotjs = async (page: Page, version?: string): Promise<Polkateer> => {

  return {
    allow: allow(page),
    confirmTransaction: confirmTransaction(page),
    importSeed: importSeed(page),
    switchNetwork: switchNetwork(page),
    openAccountsPopup: openAccountsPopup(page),
    openSettingsPopup: openSettingsPopup(page),
    page,
  };
};


function openAccountsPopup(page:Page){
  return async () => {
    await page.waitForSelector('.popupToggle');
    await page.evaluate( () => {
      /* @ts-ignore */
      document.querySelectorAll(".popupToggle")[0].click()
    })
    return await page.waitForTimeout(500)
  }
}

function openSettingsPopup(page:Page){
  return async () => {
    await page.waitForSelector('.popupToggle');
    await page.evaluate( () => {
      /* @ts-ignore */
      document.querySelectorAll(".popupToggle")[1].click()
    })
    return await page.waitForTimeout(500)
  }
}