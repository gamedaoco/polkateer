import { Page } from 'puppeteer';

export interface importSeedOptions {
  seed: string;
  password: string;
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const importSeed = (page:Page) => async (options: importSeedOptions)
: Promise<void> => {

  if(!options.seed) throw Error("Seed is Mandatory")
  if(!options.password) throw Error("Password is Mandatory")
  if(!options.name) throw Error("Name is Mandatory")

  const { seed, password, name } = options

  await page.waitForSelector('.popupToggle');
  await page.evaluate( () => {
    /* @ts-ignore */
    document.querySelectorAll(".popupToggle")[0].click()
  })

  await page.waitForSelector('svg[data-icon=key]');
  await page.evaluate( () => {
    /* @ts-ignore */
    document.querySelector("svg[data-icon=key]").parentElement.click()
  })

  const seedPhraseInput = await page.waitForSelector('textarea');
  await seedPhraseInput.click();
  await seedPhraseInput.type(seed);

  await page.waitForSelector('button');
  await page.evaluate( () => document.querySelector("button").click() )

  const acc = await Promise.race([
    page.waitForSelector("input", { timeout: 4000, visible: true }).catch(),
  ]);
  await acc.focus();
  await acc.type(name);

  const inputPw = await page.waitForSelector("input[type='password']");
  await inputPw.click();
  await inputPw.type(password);

  const validatePw = await page.$$("input[type='password']")
  await validatePw[1].click()
  await validatePw[1].type(password)

  const buttons = await page.$$("button")
  await buttons[1].click() // next button is 2nd

  return
}