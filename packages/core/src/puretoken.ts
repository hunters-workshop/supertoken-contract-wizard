import { CommonOptions, defaults as commonDefaults, withCommonDefaults } from './common-options';
import { Contract, ContractBuilder } from './contract';
import { printContract } from './print';
import { setInfo } from './set-info';
import { premintPattern } from './cappedtoken';
export interface PureSuperTokenOptions extends CommonOptions {
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

export const pureSuperTokenDefaults: Required<PureSuperTokenOptions> = {
  name: 'MyToken',
  symbol: 'MTK',
  initialSupply: 0,
  receiver: '0x1A6784925814a13334190Fd249ae0333B90b6443',
  access: commonDefaults.access,
  upgradeable: commonDefaults.upgradeable,
  info: commonDefaults.info,
  mintable: false,
  burnable: false,
  capped: false,
  ownable: false,
  maticBridge: false,
} as const;

function withDefaults(opts: PureSuperTokenOptions): Required<PureSuperTokenOptions> {
  return {
    ...opts,
    ...withCommonDefaults(opts),
    initialSupply: opts.initialSupply ?? pureSuperTokenDefaults.initialSupply,
    receiver: opts.receiver || pureSuperTokenDefaults.receiver,
  };
}

export function printPureSuperToken(opts: PureSuperTokenOptions = pureSuperTokenDefaults): string {
  return printContract(buildPureSuperToken(opts));
}

export function buildPureSuperToken(opts: PureSuperTokenOptions): Contract {
  const allOpts = withDefaults(opts);

  const c = new ContractBuilder(allOpts.name);

  const { access, info } = allOpts;
  console.log(allOpts.receiver, 'test')
  addBase(c, allOpts.name, allOpts.symbol);

  if (allOpts.initialSupply > 0) addPremint(c, allOpts.receiver, allOpts.initialSupply);

  setInfo(c, info);

  if (allOpts.burnable) {
    addBurnable(c)
  }

  if (allOpts.mintable) {
    addMintable(c, allOpts.receiver, allOpts.initialSupply);
  }

  if (access === 'ownable') {
    addOwnable(c);
  }

  if (access === 'roles') {
    addRoles(c);
  }

  return c;
}

function addBase(c: ContractBuilder, name: string, symbol: string) {
  c.addParent({
    name: 'PureSuperToken',
    path: 'github.com/superfluid-finance/custom-supertokens/contracts/PureSuperToken.sol',
  });

  c.addConstructorCode(`_initialize(factory, "${name}", "${symbol}");`);
}

function addPremint(c: ContractBuilder, receiver: string, initialSupply: number) {
  const amount = initialSupply.toString();
  const m = amount.match(premintPattern);
  if (m) {
    const integer = m[1]?.replace(/^0+/, '') ?? '';
    const decimals = m[2]?.replace(/0+$/, '') ?? '';
    const exponent = Number(m[3] ?? 0);

    if (Number(integer + decimals) > 0) {
      const decimalPlace = decimals.length - exponent;
      const zeroes = new Array(Math.max(0, -decimalPlace)).fill('0').join('');
      const units = integer + decimals + zeroes;
      const exp = decimalPlace <= 0 ? 'decimals()' : `(decimals() - ${decimalPlace})`;
      c.addConstructorCode(`_mint(msg.sender, ${units} * 10 ** ${exp});`);
    }
  }
}

function addBurnable(c: ContractBuilder, amount?: number,) {
  c.addParent({
    name: 'ERC20Burnable',
    path: '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol',
  });

  c.addFunctionCode(`burn(amount, userData)`, functions.burn);
}

function addMintable(c: ContractBuilder, receiver: string, amount: number, userData?: string) {
  c.addFunctionCode(`_mint(${receiver}, ${amount}, ${userData})`, functions.mint);
}

function addOwnable(c: ContractBuilder) {
  c.addParent({
    name: 'Ownable',
    path: '@openzeppelin/contracts/access/Ownable.sol',
  });
  c.addModifier(`onlyOwner`, functions.mint);
}

function addRoles(c: ContractBuilder) {
  c.addVariable(`bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");`);
  c.addVariable(`bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");`);
  c.addParent({
    name: 'AccessControl',
    path: '@openzeppelin/contracts/access/AccessControl.sol',
  });

  c.addModifier(`onlyMinter`, functions.mint);
  c.addModifier(`onlyBurner`, functions.burn);

  c.addConstructorCode(`_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);`);
  c.addConstructorCode(`_setupRole(MINTER_ROLE, msg.sender);`);
  c.addConstructorCode(`_setupRole(BURNER_ROLE, msg.sender);`);
}


// function addCapped(c: ContractBuilder) {
//   c.addParent({
//     name: 'ERC20Burnable',
//     path: '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol',
//   });
// }

// function addMaticBridge(c: ContractBuilder) {
//   c.addParent({
//     name: 'ERC20Burnable',
//     path: '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol',
//   });
// }

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