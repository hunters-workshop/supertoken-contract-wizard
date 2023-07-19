import { ethers } from 'ethers';
import { BACKEND_URL, NETWORK_CONTRACTS_MAP } from './constants';

export const initializeData = {
  contractAddress: '',
  initializeABI: '',
}

export interface CompileContractResponse {
  abi: string;
  bytecode: string;
  artifacts: Record<string, any>;
  success: boolean;
  error?: string;
}

export interface CompileContractProps {
  contractData: string;
  contractName: string;
}

export interface DeployContractProps {
  abi: Record<string, any> | string | any;
  bytecode: string;
  signerAddress?: string;
  omit?: boolean;
}

export interface DeployContractResponse {
  contractAddress: string;
  txHash?: string;
  success: boolean;
  error?: string;
}

/**
 * `deployContract` deploys a contract to the currently selected blockchain (Ethereum, Polygon, etc.)
 * @param deployData contract data to deploy
 * @returns contractAddress
 */

export const deployContract = async (deployData: DeployContractProps) => {
  try {
    if (typeof window === 'undefined') {
      throw new Error('This function can only be run in a web browser environment');
    }
    console.log('Data about to be deployed', deployData);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    deployData = {
      ...deployData,
      signerAddress: signer ? await signer.getAddress() : undefined,
    };
    // console.log('deployData', deployData);
    // debugger;
    const response = await fetch(`${BACKEND_URL}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deployData)
    });
    const resData = await response.json();
    const gasLimit = 3000000;
    const transactionRequest = { data: resData.transactionData, gasLimit };
    const transactionResponse = await signer.sendTransaction(transactionRequest);

    const tx = await transactionResponse.wait(4); // Wait for transaction to be mined
    console.log('transactionResponse', transactionResponse);

    console.log(initializeData, 'test 1')
    if (tx.transactionHash !== undefined) {
      const receipt = await provider.getTransactionReceipt(tx.transactionHash);
      const contractAddress = receipt.contractAddress as string;
      initializeData.contractAddress = contractAddress;

      return {
        contractAddress,
        txHash: tx.transactionHash,
        success: true
      };
    } else {
      throw new Error('Deployment failed');
    }


  } catch (error: any) {
    console.log('deployContract', error.message);
    return {
      contractAddress: '',
      success: false,
      error: error.message
    };
  }
}

/**
 * Reformats the Solidity code to be compatible with the Solidity compiler
 * @param code
 * @returns code with solidity version and import format changed
 */
export function adjustSolidityCode(code: string, omit?: boolean) {
  // Change the Solidity version
  code = code.replace(/^pragma solidity [^;]+;/m, 'pragma solidity ^0.8.0;');

  if (omit) {
    // only change the reference to 'github.com/' to '@' and not the import format
    code = code.replace(/github.com\//g, '@');

    return code;
  }

  // Change the import format and replace github.com/ with @
  code = code.replace(/import "([^"]+)\/([^/]+)\.sol";/g, function (_, path, contractName) {
    // Replace 'github.com/' with '@' in the path
    path = path.replace('github.com/', '@');

    // Change the import to the requested format
    return `import { ${contractName} } from "${path}/${contractName}.sol";`;
  });

  return code;
}

/**
 * `compileContract` compiles a contract and returns the ABI and bytecode for later deployment
 * @param contractName
 * @param contractData
 * @returns {CompileContractResponse} { abi: string; bytecode: string;  success: boolean;  error?: string;}
 */
export const compileContract = async (compileData: CompileContractProps, omit: boolean): Promise<CompileContractResponse> => {
  const { contractData, contractName } = compileData;

  try {
    const reformattedContract = adjustSolidityCode(contractData, omit);

    // Send the contract name and data to your /compile endpoint at the backend
    const response = await fetch(`${BACKEND_URL}/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: contractName, code: reformattedContract.trim() })
    });

    const resData = await response.json();
    console.log('compileContract() resData...', resData);

    const { abi, bytecode, error: resError } = resData;

    const success = response.ok;

    if (success) {
      initializeData.initializeABI = abi;
      return {
        abi,
        bytecode,
        artifacts: resData,
        success
      };
    } else {
      throw new Error(resError);
    }

  } catch (error: any) {
    console.error('Compile error: ', error);
    return {
      abi: '',
      bytecode: '',
      artifacts: {},
      success: false,
      error: error.message
    };
  }
}


export const initializeContract = async (opts: any, chainId: number) => {
  if (!initializeData.contractAddress || !initializeData.initializeABI) return;
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log({provider});

    const factoryAddress = NETWORK_CONTRACTS_MAP[chainId ?? 1]?.contract;
    const signer = provider.getSigner();
    const supertoken = new ethers.Contract(initializeData.contractAddress, initializeData.initializeABI, signer);
    console.log(supertoken, 'supertoken')
    console.log(factoryAddress, 'factoryAddress');

    const tx = await supertoken.initialize(factoryAddress, opts.name, opts.symbol);
    console.log(tx, 'tx');
    return tx;
  } catch (error: any) {
    console.log('initializeContract', error.message);
  }
}
