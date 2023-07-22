# [OpenZeppelin Contracts Wizard](https://wizard.openzeppelin.com)

[![Solidity NPM Package](https://img.shields.io/npm/v/@superfluid-wizard/core?color=%234e5de4&label=%40openzeppelin%2Fwizard)](https://www.npmjs.com/package/@superfluid-wizard/core)
[![Cairo NPM Package](https://img.shields.io/npm/v/@superfluid-wizard/core-cairo?color=%23e55233&label=%40openzeppelin%2Fwizard-cairo)](https://www.npmjs.com/package/@superfluid-wizard/core-cairo)

Contracts Wizard is a web application to interactively build a contract out of components from Superfluid's Supertoken Smart Contracts. Select the kind of contract that you want, set your parameters and desired features, and the Wizard will generate all of the code necessary. The resulting code is ready to be compiled and deployed, or it can serve as a starting point and customized further with application specific logic.

From the app you can copy the raw code, compile it & copy the artefacts and even deploy it to a a range of blockchain networks.

[![](./screenshot.png)](https://wizard.openzeppelin.com/)
[![Supertoken wizard](image.png)](https://supertoken-wizard.huntersworkshop.xyz)

## Development

Install dependencies with `yarn install`.

`packages/core` contains the code generation logic for Solidity.

`packages/ui` is the interface built in Svelte. From the root of the monorepo, `yarn workspace @superfluid-wizard/ui run dev` spins up a local server to develop the UI.

TODO: It would be good to see the [backend server](https://github.com/hunters-workshop/solidity-compiler-express-server) getting added to this repo rather than being separate

## Embedding

To embed Contracts Wizard on your site, first include the script tag:

```html
<script async src="https://supertoken-wizard.huntersworkshop.xyz/build/embed.js"></script>
```

Then place `<oz-wizard></oz-wizard>` in the body where you want Contracts Wizard to load.

Optionally focus on specific tab with the `data-tab` attribute as in `<oz-wizard data-tab="PURE"></oz-wizard>`.

## API

The following describes how to use the Contracts Wizard programmatic API in your own applications.

- [Contracts Wizard API for Solidity](packages/core/README.md)
