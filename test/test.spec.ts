import * as assert from 'assert';
import { readdir } from 'fs/promises';
import path from 'path';

import { expect } from 'chai';
import puppeteer from 'puppeteer';

import { RECOMMENDED_POLKADOTJS_VERSION } from '../src';
import * as polkateer from '../src/index';


function pause(seconds: number): Promise<void> {
  return new Promise((res) => setTimeout(res, 1000 * seconds));
}

async function clickElement(page, selector): Promise<void> {
  await page.bringToFront();
  await page.waitForSelector(selector);
  const element = await page.$(selector);
  await element.click();
}

let browser, polka, testpage;

describe('polkateer', () => {

  before(async () => {

    browser = await polkateer.launch(puppeteer, {
      //devtools: true,
      version: process.env.POLKADOTJS_VERSION || RECOMMENDED_POLKADOTJS_VERSION,
    });

    polka = await polkateer.setupPolkadotjs(browser, {
      // optional, else it will use a default seed
      seed: 'pioneer casual canoe gorilla embrace width fiction bounce spy exhibit another dog',
      password: 'password1234',
    });

    // output version
    const directory = path.resolve(__dirname, '..', 'polkadotjs');
    const files = await readdir(directory);
    console.log(`::set-output name=version::${files.pop().replace(/_/g, '.')}`);
  });

  it('should running, puppeteer', async () => {
    assert.ok(browser);
  });

  it('should open, polka', async () => {
    assert.ok(polka);
  });


  it('should switch network, ZERO', async () => {
    await polka.switchNetwork('24');

    await polka.openSettingsPopup()

    await polka.page.waitForSelector("select")

    const selectedNetwork = await polka.page.evaluate( () => {
      const s = document.querySelector("select")
      const selected = s.selectedOptions[0].innerText
      return selected
    })

    assert.strictEqual(selectedNetwork, 'ZERO');
  });

  it('should import seed', async () => {
    const name = "TestAccount"+Date.now()

    await polka.importSeed({
      seed: 'library garage course exist pyramid fever famous lab wild long situate turn',
      password: 'password1234',
      name
    });

    await polka.page.waitForSelector(".address")

    const results = await polka.page.evaluate( () => {
      const addresses = document.querySelectorAll(".address")
      return {length: addresses.length, accountname: addresses[1].querySelector("span").innerText}
    })

    assert.strictEqual(results.length, 2);
    assert.strictEqual(results.accountname, name);
  });

  after(async () => {
    // close browser
    await browser.close();
  });
});
