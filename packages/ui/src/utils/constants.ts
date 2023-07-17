const BACKEND_URL = 'https://superfluid-backend.huntersworkshop.xyz';

enum NetworkId {
  Mainnet = 1,
  GnosisChain = 100,
  Polygon = 137,
  Optimism = 10,
  Arbitrum = 42161,
  Avalanche = 43114,
  BinanceSmartChain = 56,
  Celo = 42220,
}

const NETWORK_MAP: NetworkMap = {
  [NetworkId.Mainnet]: 'Mainnet',
  [NetworkId.GnosisChain]: 'Gnosis Chain',
  [NetworkId.Polygon]: 'Polygon',
  [NetworkId.Optimism]: 'Optimism',
  [NetworkId.Arbitrum]: 'Arbitrum',
  [NetworkId.Avalanche]: 'Avalanche',
  [NetworkId.BinanceSmartChain]: 'Binance Smart Chain',
  [NetworkId.Celo]: 'Celo',
};

const FACTORY_CONTRACT_MAP: FactoryContractMap = {
  [NetworkId.Mainnet]: '0x0422689cc4087b6B7280e0a7e7F655200ec86Ae1',
  [NetworkId.GnosisChain]: '0x23410e2659380784498509698ed70E414D384880',
  [NetworkId.Polygon]: '0x2C90719f25B10Fc5646c82DA3240C76Fa5BcCF34',
  [NetworkId.Optimism]: '0x8276469A443D5C6B7146BED45e2abCaD3B6adad9',
  [NetworkId.Arbitrum]: '0x1C21Ead77fd45C84a4c916Db7A6635D0C6FF09D6',
  [NetworkId.Avalanche]: '0x464AADdBB2B80f3Cb666522EB7381bE610F638b4',
  [NetworkId.BinanceSmartChain]: '0x8bde47397301F0Cd31b9000032fD517a39c946Eb',
  [NetworkId.Celo]: '0x36be86dEe6BC726Ed0Cbd170ccD2F21760BC73D9',
};

const NETWORK_CONTRACTS_MAP: NetworkContractsMap = {
  [NetworkId.Mainnet]: {
    name: NETWORK_MAP[NetworkId.Mainnet]!,
    contract: FACTORY_CONTRACT_MAP[NetworkId.Mainnet]!,
    blockExplorer: 'https://etherscan.io',
  },
  [NetworkId.GnosisChain]: {
    name: NETWORK_MAP[NetworkId.GnosisChain]!,
    contract: FACTORY_CONTRACT_MAP[NetworkId.GnosisChain]!,
    blockExplorer: 'https://gnosisscan.io',
  },
  [NetworkId.Polygon]: {
    name: NETWORK_MAP[NetworkId.Polygon]!,
    contract: FACTORY_CONTRACT_MAP[NetworkId.Polygon]!,
    blockExplorer: 'https://polygonscan.com',
  },
};

export {
  BACKEND_URL,
  NETWORK_MAP,
  FACTORY_CONTRACT_MAP,
  NETWORK_CONTRACTS_MAP,
  NetworkId,
}
