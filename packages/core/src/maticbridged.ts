import { CommonOptions, defaults as commonDefaults, withCommonDefaults } from './common-options';
import { Contract, ContractBuilder } from './contract';
import { premintPattern } from './erc20';
import { printContract } from './print';
import { Info, setInfo } from './set-info';

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

  c.omitAll = true;

  addFullCode(c, allOpts.name, allOpts.symbol, info);

  return c;
}

function addFullCode(c: ContractBuilder, name: string, symbol: string, info: Info) {
  const { securityContact, license } = info;
  const hasContact = !!securityContact;

  c.addVariable(
`/* SPDX-License-Identifier: ${license} */
pragma solidity ^0.8.9;
${hasContact ? '\n/// @custom:security-contact ' + securityContact : ''}

import { SuperTokenBase, ISuperToken } from "github.com/superfluid-finance/custom-supertokens/contracts/base/SuperTokenBase.sol";
import { IMaticBridgedSuperTokenCustom } from "github.com/superfluid-finance/custom-supertokens/contracts/interfaces/IMaticBridgedSuperToken.sol";
import { ISuperfluid } from "github.com/superfluid-finance/protocol-monorepo/packages/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

contract ${name} is SuperTokenBase, IMaticBridgedSuperTokenCustom {
    address public childChainManager;

    constructor(address childChainManager_) {
        childChainManager = childChainManager_;
    }

    function initialize(address factory, string memory name, string memory symbol)
        external
    {
        _initialize(factory, name, symbol);
    }

    function deposit(address user, bytes calldata depositData) external override {
        require(msg.sender == childChainManager, "MBST: no permission to deposit");
        uint256 amount = abi.decode(depositData, (uint256));
        ISuperToken(address(this)).selfMint(user, amount, new bytes(0));
    }

    function withdraw(uint256 amount) external override {
        ISuperToken(address(this)).selfBurn(msg.sender, amount, new bytes(0));
    }

    function updateChildChainManager(address newChildChainManager) external override {
        address host = ISuperToken(address(this)).getHost();
        address gov = address(ISuperfluid(host).getGovernance());
        require(msg.sender == gov, "MBST: only governance allowedr");

        childChainManager = newChildChainManager;
        emit ChildChainManagerChanged(newChildChainManager);
    }
}
  `);
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