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

    const response = await fetch(`${BACKEND_URL}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deployData)
    });
    const resData = await response.json();
    // console.log('deploy response', {response, resData});
    // debugger;
    // const address = await signer.getAddress();
    const gasLimit = 3000000;
    // this brings up MM but tx fails
    const transactionRequest = { data: resData.transactionData, gasLimit };
    const transactionResponse = await signer.sendTransaction(transactionRequest);

    const tx = await transactionResponse.wait(); // Wait for transaction to be mined
    console.log('transactionResponse', transactionResponse);

    // if (transactionResponse.hash === null) {
    //   throw new Error('Transaction failed');
    // }
    console.log(initializeData, 'test 1')
    if (tx.transactionHash !== undefined) {
      const receipt = await provider.getTransactionReceipt(tx.transactionHash);
      const contractAddress = receipt.contractAddress as string;
      // console.log('contract deployed to', contractAddress);
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
 * @returns code with solidity version changed and import format changed
 */
export function adjustSolidityCode(code: string) {
  // Change the Solidity version
  code = code.replace(/^pragma solidity [^;]+;/m, 'pragma solidity ^0.8.0;');

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
export const compileContract = async (compileData: CompileContractProps): Promise<CompileContractResponse> => {
  const { contractData, contractName } = compileData;
  console.log('compileContract() compileData...', { contractData, contractName });

  try {
    const reformattedContract = adjustSolidityCode(contractData)

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

    //TO DO: DYNAMICALLY FETCH THE supertokenfactory ADDRESS FOR CHAIN WHICH YOU ARE DEPLOYING ON AND PASS IT IN THE FIRST PARAMETER
    const tx = await supertoken.initialize(factoryAddress, opts.name, opts.symbol);
    return tx;
  } catch (error: any) {
    console.log('initializeContract', error.message);
  }
}
