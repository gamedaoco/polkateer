import puppeteer from 'puppeteer';
import polkateer from '../dist/index.js';

const accountSeeds = {
  controller: "library garage course exist pyramid fever famous lab wild long situate turn",
  controllerAddr: "3Ve4x9qNr4aSnaBc1MRZ7tjH1zPiMeTucz3qQfEdzXuVVPmC",
  treasury: "together whisper tag work used border palm twelve suspect honey village orange",
  trasuryAddr: "3RomePhVGPVx6UShbzndR2xvT9k32Bisg6mUiq8g45KxXM7c" 
}

async function main() {
  const browser = await polkateer.launch(puppeteer, { version: 'v0.42.6' });

  const wallet = await polkateer.setupPolkadotjs(browser);

  // change network to ZERO
  await wallet.switchNetwork('24'); // TODO clearnames as options?

  await wallet.page.reload()

  await wallet.importSeed({
    seed: accountSeeds.treasury,
    name: "gameDAO Test Controller Account",
    password: "password1234"
  })

  await wallet.importSeed({
    seed: accountSeeds.controller,
    name: "gameDAO Test Treasury Account",
    password: "password1234"
  })

  // polka apps
  //
  const explorerPage = await browser.newPage()
  await explorerPage.goto("https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Falphaville.zero.io#/explorer")
  // allow access with wallet for polkadot.js.org
  await wallet.allow(wallet.page);
  await explorerPage.bringToFront()

  /*
  const chainMenu = await explorerPage.waitForSelector('.isClickable')
  chainMenu.click()

  await explorerPage.waitForTimeout(2000)

  await explorerPage.evaluate( () => {
    // open Test networks
    document.querySelector(".ui--Sidebar").children[6].children[0].click()

    const alltestnetworks = document.querySelector(".ui--Sidebar").children[6].children[1]
    // select zero 
    alltestnetworks.lastChild.firstChild.click()

    // switch network
    document.querySelector(".ui--Button").click()
  })
  */

  // gameDAO
  //
  const gameDAOPage  = await browser.newPage()
  await gameDAOPage.goto("https://beta.gamedao.co")

  const enter = await gameDAOPage.waitForSelector('button')
  await gameDAOPage.waitForTimeout(3000)
  await enter.click()

  await gameDAOPage.waitForTimeout(3000)
  // click connect and allow access with wallet for gameDAO
  const connect = await gameDAOPage.waitForSelector("button")
  await connect.click()
  await wallet.allow(wallet.page);

  await gameDAOPage.bringToFront()

  const menuOrgs = await gameDAOPage.$("a[href='/app/campaigns']")
  await menuOrgs.click()


  // 🏌
  // await wallet.confirmTransaction();
}

setTimeout( () => {
  main();
}, 4000)