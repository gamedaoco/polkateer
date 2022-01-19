# Polkateer
## WIP Not ready for Usage WIP

E2E testing for dApps using Puppeteer + Polkadot.js Extension

## Installation

```
$ npm install -s @zeroio/polkateer
$ yarn add @zeroio/polkateer
```

## Usage

```js
import puppeteer from 'puppeteer';
import polkateer from '@zeroio/polkateer';

async function main() {
  const browser = await polkateer.launch(puppeteer, { version: 'v0.42.6' });
  const polka = await polkateer.setupPolkadotjs(browser);

  // you can change the network if you want
  await polka.switchNetwork('zero');

  // go to a dapp and do something that prompts polka to confirm a transaction
  const page = await browser.newPage();
  await page.goto('http://my-dapp.com');
  const payButton = await page.$('#transact');
  await payButton.click();

  // 🏌
  await polka.confirmTransaction();
}

main();
```

- All methods can be found on [API page](docs/API.md)  
- Instructions to setup [with Jest](docs/JEST.md)  
- Mocha example can be found [inside test folder](./test)
