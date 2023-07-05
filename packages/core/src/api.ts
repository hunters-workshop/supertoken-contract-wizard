import type { CommonOptions } from './common-options';
import {
  CustomOptions,
  defaults as customDefaults,
  isAccessControlRequired as customIsAccessControlRequired,
  printCustom,
} from './custom';
import {
  ERC1155Options,
  isAccessControlRequired as erc1155IsAccessControlRequired,
  defaults as erc1155defaults,
  printERC1155,
} from './erc1155';
import {
  ERC20Options,
  isAccessControlRequired as erc20IsAccessControlRequired,
  defaults as erc20defaults,
  printERC20,
} from './erc20';
import {
  ERC721Options,
  isAccessControlRequired as erc721IsAccessControlRequired,
  defaults as erc721defaults,
  printERC721,
} from './erc721';
import {
  GovernorOptions,
  defaults as governorDefaults,
  isAccessControlRequired as governorIsAccessControlRequired,
  printGovernor,
} from './governor';
import { pureSupertokenDefaults, printPureSuperToken, type PureSuperTokenOptions } from './puretoken';
import { cappedSupertokenDefaults, printCappedSuperToken, type CappedSuperTokenOptions } from './cappedtoken';

export interface WizardContractAPI<Options extends CommonOptions> {
	/**
	 * Returns a string representation of a contract generated using the provided options. If opts is not provided, uses `defaults`.
	 */
	print: (opts?: Options) => string;

	/**
	 * The default options that are used for `print`.
	 */
	defaults: Required<Options>;

	/**
	 * Whether any of the provided options require access control to be enabled. If this returns `true`, then calling `print` with the
	 * same options would cause the `access` option to default to `'ownable'` if it was `undefined` or `false`.
	 */
	isAccessControlRequired: (opts: Partial<Options>) => boolean;
}
export type PureSuperToken = WizardContractAPI<PureSuperTokenOptions>;
export type ERC20 = WizardContractAPI<ERC20Options>;
export type ERC721 = WizardContractAPI<ERC721Options>;
export type ERC1155 = WizardContractAPI<ERC1155Options>;
export type Governor = WizardContractAPI<GovernorOptions>;
export type CappedSuperToken = WizardContractAPI<CappedSuperTokenOptions>;
export type Custom = WizardContractAPI<CustomOptions>;

export const pureSupertoken: PureSuperToken = {
	print: printPureSuperToken,
	defaults: pureSupertokenDefaults,
	isAccessControlRequired: erc20IsAccessControlRequired,
};
export const erc20: ERC20 = {
	print: printERC20,
	defaults: erc20defaults,
	isAccessControlRequired: erc20IsAccessControlRequired,
};
export const erc721: ERC721 = {
	print: printERC721,
	defaults: erc721defaults,
	isAccessControlRequired: erc721IsAccessControlRequired,
};
export const erc1155: ERC1155 = {
	print: printERC1155,
	defaults: erc1155defaults,
	isAccessControlRequired: erc1155IsAccessControlRequired,
};
export const governor: Governor = {
	print: printGovernor,
	defaults: governorDefaults,
	isAccessControlRequired: governorIsAccessControlRequired,
};
export const cappedSupertoken: CappedSuperToken = {
	print: printCappedSuperToken,
	defaults: cappedSupertokenDefaults,
	isAccessControlRequired: erc20IsAccessControlRequired,
};
export const custom: Custom = {
	print: printCustom,
	defaults: customDefaults,
	isAccessControlRequired: customIsAccessControlRequired,
};
