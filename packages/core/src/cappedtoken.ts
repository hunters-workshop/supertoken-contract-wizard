import { CommonOptions, defaults as commonDefaults, withCommonDefaults } from './common-options';
import { Contract, ContractBuilder } from './contract';
import { printContract } from './print';
import { setInfo } from './set-info';

export interface CappedSuperTokenOptions extends CommonOptions {
  name: string;
  symbol: string;
  initialSupply: number;
  receiver: string;
  mintable: boolean;
  burnable: boolean;
  capped: boolean;
  ownable: boolean;
  maticBridge: boolean;
}

export const cappedSupertokenDefaults: Required<CappedSuperTokenOptions> = {
  name: 'MyToken',
  symbol: 'MTK',
  initialSupply: 0,
  receiver: '',
  access: commonDefaults.access,
  upgradeable: commonDefaults.upgradeable,
  info: commonDefaults.info,
  mintable: false,
  burnable: false,
  capped: false,
  ownable: false,
  maticBridge: false,
} as const;

function withDefaults(opts: CappedSuperTokenOptions): Required<CappedSuperTokenOptions> {
  return {
    ...opts,
    ...withCommonDefaults(opts),
    initialSupply: opts.initialSupply ?? cappedSupertokenDefaults.initialSupply,
    receiver: opts.receiver || cappedSupertokenDefaults.receiver,
    ownable: opts.ownable ?? cappedSupertokenDefaults.ownable,
  };
}

export function printCappedSuperToken(opts: CappedSuperTokenOptions = cappedSupertokenDefaults): string {
  return printContract(buildCappedSuperToken(opts));
}

export function buildCappedSuperToken(opts: CappedSuperTokenOptions): Contract {
  const allOpts = withDefaults(opts);

  const c = new ContractBuilder(allOpts.name);

  const { access, info } = allOpts;

  addBase(c, allOpts.name, allOpts.symbol);
  addPremint(c, allOpts.receiver, allOpts.initialSupply);

  setInfo(c, info);

  if (allOpts.mintable) {
    addMintable(c, allOpts.receiver, allOpts.initialSupply);

    if (allOpts.ownable) {
      addOwnable(c);
    }
  }

  return c;
}

function addBase(c: ContractBuilder, name: string, symbol: string) {
  c.addParent({
    name: 'CappedSuperTokenBase',
    path: '../custom-supertokens/contracts/CappedSupertoken.sol',
  });

  c.addConstructorCode(`_initialize(factory, "${name}", "${symbol}");`);
}

function addPremint(c: ContractBuilder, receiver: string, initialSupply: number) {
  c.addFunctionCode(`_mint(${receiver}, ${initialSupply})`, functions._mint);
}

function addBurnable(c: ContractBuilder, amount?: number, ) {
  c.addFunctionCode(`burn(${amount})`, functions.burn);
}

function addOwnable(c: ContractBuilder) {
  c.addModifier(`onlyOwner`, functions.mint);
}

function addMintable(c: ContractBuilder, receiver: string, amount: number) {
  c.addFunctionCode(`mint(${receiver}, ${amount})`, functions.mint);
}

function addCapped(c: ContractBuilder) {
  c.addParent({
    name: 'ERC20Burnable',
    path: '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol',
  });
}


function addMaticBridge(c: ContractBuilder) {
  c.addParent({
    name: 'ERC20Burnable',
    path: '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol',
  });
}

//wtf
export const functions = {
  _mint: {
    kind: 'internal' as const,
    name: '_mint',
    args: [
      { name: 'receiver', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
  },
  mint: {
    kind: 'external' as const,
    name: 'mint',
    args: [
      { name: 'receiver', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'userData', type: 'bytes' },
    ]
  },
  burn: {
    kind: 'external' as const,
    name: 'burn',
    args: [
      { name: 'amount', type: 'uint256' },
      { name: 'userData', type: 'bytes' },
    ]
  }
};