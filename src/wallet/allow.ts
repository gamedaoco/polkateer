import { Page } from 'puppeteer';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const allow = (page: Page) => async (): Promise<void> => {
  await page.bringToFront();
  page.reload()
  page.bringToFront()

  await page.waitForSelector(".acceptButton")
  /* @ts-ignore */
  await page.evaluate( () => document.querySelector(".acceptButton").click())
};
