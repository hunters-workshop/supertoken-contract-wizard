import { CommonOptions, defaults as commonDefaults, withCommonDefaults } from './common-options';
import { Contract, ContractBuilder } from './contract';
import { premintPattern } from './erc20';
import { printContract } from './print';
import { setInfo } from './set-info';

export interface MaticBridgedSuperTokenOptions extends CommonOptions {
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

export const maticBridgedSuperTokenDefaults: Required<MaticBridgedSuperTokenOptions> = {
  name: 'MyToken',
  symbol: 'MTK',
  initialSupply: 69,
  receiver: 'msg.sender',
  access: commonDefaults.access,
  upgradeable: commonDefaults.upgradeable,
  info: commonDefaults.info,
  mintable: false,
  burnable: false,
  capped: false,
  ownable: false,
  maticBridge: false,
} as const;

function withDefaults(opts: MaticBridgedSuperTokenOptions): Required<MaticBridgedSuperTokenOptions> {
  return {
    ...opts,
    ...withCommonDefaults(opts),
    initialSupply: opts.initialSupply ?? maticBridgedSuperTokenDefaults.initialSupply,
    receiver: opts.receiver || maticBridgedSuperTokenDefaults.receiver,
  };
}

export function printMaticBridgedSuperToken(opts: MaticBridgedSuperTokenOptions = maticBridgedSuperTokenDefaults): string {
  return printContract(buildMaticBridgedSuperToken(opts));
}

export function buildMaticBridgedSuperToken(opts: MaticBridgedSuperTokenOptions): Contract {
  const allOpts = withDefaults(opts);

  const c = new ContractBuilder(allOpts.name);

  const { info } = allOpts;

  setInfo(c, info);

  addBase(c, allOpts.name, allOpts.symbol);

  addDeposit(c);

  addWithdraw(c);

  addUpdateChildChainManager(c);

  return c;
}

function addBase(c: ContractBuilder, name: string, symbol: string) {
  c.addParent({
    name: 'SuperTokenBase',
    path: 'github.com/superfluid-finance/custom-supertokens/contracts/base/SuperTokenBase.sol',
  });

  c.addParent({
    name: "IMaticBridgedSuperToken",
    path: "github.com/superfluid-finance/custom-supertokens/contracts/interfaces/IMaticBridgedSuperToken.sol",
  });

  c.addVariable(`address public childChainManager;`)

  c.addConstructorArgument({type: 'address', name: 'childChainManager_'});
  c.addConstructorCode(`childChainManager = childChainManager_;`),

  c.addFunctionCode(`_initialize(factory, name, symbol);`, functions.initialize);
}

function addDeposit(c: ContractBuilder) {
  c.addFunctionCode(`require(msg.sender == childChainManager, "MBST: no permission to deposit");`, functions.deposit);
  c.addFunctionCode(`uint256 amount = abi.decode(depositData, (uint256));`, functions.deposit);
  // c.addFunctionCode(`deposit(user, depositData);`, functions.deposit);



  c.addFunctionCode(`ISuperToken(address(this)).selfMint(user, amount, new bytes(0));`, functions.deposit);

}

function addWithdraw(c: ContractBuilder) {
  // c.addParent({
  //   name: "ISuperToken",
  //   path: "github.com/superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol",
  // });
  c.addFunctionCode(`ISuperToken(address(this)).selfBurn(amount, new bytes(0));`, functions.withdraw);
}

function addUpdateChildChainManager(c: ContractBuilder) {
  c.addFunctionCode(`address host = ISuperToken(address(this)).getHost();`, functions.updateChildChainManager);

  /*
   TO DO / TODO: I can't figure out how to import `ISuperfluid` without
    it getting added to the contract declaration. I expected
    to have an `addImport` function, but I don't see one.
   */
  c.addParent({
    name: "ISuperfluid",
    path: "github.com/superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol",
  });


  c.addFunctionCode(`address gov = address(ISuperfluid(host).getGovernance());`, functions.updateChildChainManager)
  c.addFunctionCode(`require(msg.sender == gov, "MBST: only governance allowedr");\n`, functions.updateChildChainManager);

  c.addFunctionCode(`childChainManager = newChildChainManager;`, functions.updateChildChainManager);
  c.addFunctionCode(`emit ChildChainManagerChanged(newChildChainManager);`, functions.updateChildChainManager);
}

//wtf
export const functions = {
  initialize: {
    kind: 'external' as const,
    name: 'initialize',
    args: [
      { name: 'factory', type: 'address' },
      { name: 'name', type: 'string memory' },
      { name: 'symbol', type: 'string memory' },
    ]
  },
  deposit: {
    kind: 'external' as const,
    name: 'deposit',
    args: [
      { name: 'user', type: 'address' },
      { name: 'depositData', type: 'bytes calldata' },
    ],
  },
  withdraw: {
    kind: 'external' as const,
    name: 'withdraw',
    args: [
      { name: 'amount', type: 'uint256' },
    ]
  },
  updateChildChainManager: {
    kind: 'external' as const,
    name: 'updateChildChainManager',
    args: [
      { name: 'newChildChainManager', type: 'address' },
    ]
  },
};