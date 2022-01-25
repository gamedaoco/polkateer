import { Page } from 'puppeteer';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const switchNetwork = (page: Page) => async (networkId?: string): Promise<void> => {

  await page.bringToFront();

  await page.waitForSelector(".popupToggle")
  const t = await page.$$(".popupToggle")
  t[1].click()

  await page.waitForSelector("select")
  await page.select('select', networkId || '24');

  // close popup again
  await page.waitForSelector(".popupToggle")
  const toggles = await page.$$(".popupToggle")
  toggles[1].click()

  await page.waitForTimeout(1000)

  /*
  const networkIndex = await page.evaluate((network) => {
    const elements = document.querySelectorAll('li.dropdown-menu-item');
    for (let i = 0; i < elements.length; i++) {
     const element = elements[i];
      if ((element as HTMLLIElement).innerText.toLowerCase().includes(network.toLowerCase())) {
        return i;
      }
    }
    return 0;
  }, network);
  */
};
