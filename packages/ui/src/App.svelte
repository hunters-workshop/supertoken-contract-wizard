<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { connected } from "svelte-wagmi";
  import hljs from "./highlightjs";

  import type {
    Contract,
    Kind,
    KindedOptions,
    OptionsErrorMessages,
  } from "@superfluid-wizard/core";
  import {
    ContractBuilder,
    OptionsError,
    buildGeneric,
    printContract,
    sanitizeKind,
  } from "@superfluid-wizard/core";
  import { saveAs } from "file-saver";
  import {
    chainId,
    configureWagmi,
    signerAddress,
    wagmiLoaded,
    web3Modal,
  } from "svelte-wagmi";
  import CappedSuperTokenControls from "./CappedSuperTokenControls.svelte";
  import Dropdown from "./Dropdown.svelte";
  import MaticBridgedSuperTokenControls from "./MaticBridgedSuperTokenControls.svelte";
  import OverflowMenu from "./OverflowMenu.svelte";
  import PureSuperTokenControls from "./PureSuperTokenControls.svelte";
  import Tooltip from "./Tooltip.svelte";
  import CheckIcon from "./icons/CheckIcon.svelte";
  import CompileIcon from "./icons/CompileIcon.svelte";
  import CopyIcon from "./icons/CopyIcon.svelte";
  import DeployIcon from "./icons/DeployIcon.svelte";
  import DownloadIcon from "./icons/DownloadIcon.svelte";
  import FileIcon from "./icons/FileIcon.svelte";
  import ProcessingIcon from "./icons/ProcessingIcon.svelte";
  import RemixIcon from "./icons/RemixIcon.svelte";
  import ZipIcon from "./icons/ZipIcon.svelte";
  import { postConfig } from "./post-config";
  import { remixURL } from "./remix";
  import { injectHyperlinks } from "./utils/inject-hyperlinks";
  import { copy, copyText } from "svelte-copy";
  import {
    CompileContractProps,
    DeployContractProps,
    compileContract,
    deployContract,
  } from "./utils/contract-utils";
  import { chainName } from "./stores";
  import { ethers } from "ethers";
  import { clsx } from "clsx";
  import { SvelteToast, toast } from "@zerodevx/svelte-toast";
  // Optionally set default options here
  const toastOptions = {
    theme: {
      "--toastBackground": "#000",
      "--toastProgressBackground": "#444",
      "--toastProgressFill": "#888",
      "--toastColor": "#fff",
    },
  };

  configureWagmi({
    walletconnect: true,
    walletconnectProjectID: "68fcbeed1aee822daef920257ba3f2de",
    alchemyKey: "abcdefghijklmnopqrstuvwxyz123456",
    autoConnect: true,
  });

  const dispatch = createEventDispatcher();

  export let initialTab: string | undefined = "PURE";

  export let tab: Kind = sanitizeKind(initialTab);
  $: {
    tab = sanitizeKind(tab);
    dispatch("tab-change", tab);
  }

  let allOpts: { [k in Kind]?: Required<KindedOptions[k]> } = {};
  let errors: { [k in Kind]?: OptionsErrorMessages } = {};

  let contract: Contract = new ContractBuilder("MyToken");

  $: opts = allOpts[tab];

  $: {
    if (opts) {
      try {
        contract = buildGeneric(opts);
        errors[tab] = undefined;
      } catch (e: unknown) {
        if (e instanceof OptionsError) {
          errors[tab] = e.messages;
        } else {
          throw e;
        }
      }
    }
  }

  $: code = printContract(contract);
  $: highlightedCode = injectHyperlinks(hljs.highlight("solidity", code).value);

  const language = "solidity";

  let copied = false;
  const copyHandler = async () => {
    await navigator.clipboard.writeText(code);
    copied = true;
    if (opts) {
      await postConfig(opts, "copy", language);
    }
    toast.push("Copied to clipboard!");
    setTimeout(() => {
      copied = false;
    }, 1000);
  };

  const remixHandler = async (e: MouseEvent) => {
    e.preventDefault();
    if ((e.target as Element)?.classList.contains("disabled")) return;

    const { printContractVersioned } = await import(
      "@superfluid-wizard/core/print-versioned"
    );

    const versionedCode = printContractVersioned(contract);
    window.open(
      remixURL(versionedCode, !!opts?.upgradeable).toString(),
      "_blank"
    );
    if (opts) {
      await postConfig(opts, "remix", language);
    }
  };

  const downloadNpmHandler = async () => {
    const blob = new Blob([code], { type: "text/plain" });
    if (opts) {
      saveAs(blob, opts.name + ".sol");
      await postConfig(opts, "download-npm", language);
    }
  };

  const zipModule = import("@superfluid-wizard/core/zip");

  const downloadVendoredHandler = async () => {
    const { zipContract } = await zipModule;
    const zip = zipContract(contract);
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "contracts.zip");
    if (opts) {
      await postConfig(opts, "download-vendored", language);
    }
  };

  const zipEnvModule = import("@superfluid-wizard/core/zip-env");

  const handleCopy = async (data: Record<string, any> | string) => {
    console.log("handleCopy", { data });
    if (typeof data === "object") {
      data = JSON.stringify(data, null, 2);
    }
    await navigator.clipboard.writeText(data);

      toast.push("Copied to clipboard!");
  };

  const downloadHardhatHandler = async () => {
    const { zipHardhat } = await zipEnvModule;
    const zip = await zipHardhat(contract, opts);
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "project.zip");
    if (opts) {
      await postConfig(opts, "download-hardhat", language);
    }
  };

  let compiling = false;
  let compiled = false;
  let deploying = false;
  let erroring = false;
  let contractError: string | undefined = undefined;
  let contractAbi: string | undefined = undefined;
  let contractBytecode: string | undefined = undefined;
  let contractArtifacts: Record<string, any> | string | undefined = undefined;
  let deployedContractAddress: string | undefined = undefined;

  const getNetworkName = async () => {
    let provider = new ethers.providers.Web3Provider(window.ethereum);
    let network = await provider.getNetwork();
    console.log("network", network, provider);
    return network.name;
  };

  const chainResponse = getNetworkName();
  chainResponse.then((res) => {
    console.log("chainName", res);
    chainName.set(res);
    return;
  });

  const compileContractHandler = async (): Promise<void> => {
    if (!opts) return;
    const compileData: CompileContractProps = {
      contractData: code,
      contractName: opts.name,
    };

    compiling = true;
    const compiledData = await compileContract(compileData);

    const { abi, bytecode, artifacts, success, error } = compiledData;
    // console.log('compileContractHandler destructured', { abi, bytecode, success, error });

    if (success) {
      // console.log('compileContractHandler success', { abi, bytecode });
      contractAbi = abi;
      contractBytecode = bytecode;
      contractArtifacts = artifacts;
      compiling = false;
      compiled = artifacts !== undefined;
      toast.push(`Compiled ${opts.name} contract successfully!`,
      {
        theme: {
          '--toastBackground': '#4caf50',
          '--toastColor': '#fff',
        }
      });
      setTimeout(() => {
        compiled = false;
      }, 2000);
    } else {
      erroring = true;
      console.log("compileContractHandler error", { error });
      compiling = false;
      compiled = false;
      contractError = error;
      toast.push(`Ru roh! Error compiling ${opts.name} contract!`,
      {
        theme: {
          '--toastBackground': 'var(--color-red-500)',
          '--toastColor': 'var(--color-white)',
        }
      });
      setTimeout(() => {
        erroring = false;
        contractError = undefined;
      }, 2000);
    }
    return;
  };

  let deployError: string | undefined = undefined;
  const deployContractHandler = async (): Promise<void> => {
    try {
      if (!contractAbi || !contractBytecode) return;
      deploying = true;
      const deployData: DeployContractProps = {
        abi: contractAbi,
        bytecode: contractBytecode,
      };
      const deployedContractData = await deployContract(deployData);
      const { contractAddress, success, error, txHash } = deployedContractData;

      if (success) {
        deployedContractAddress = contractAddress;
        console.log("deployContractHandler deployed...", {
          contractAddress,
          success,
          error,
        });
        toast.push(`Deployed contract successfully! ${deployedContractAddress} <br /> ${txHash}`, {
          theme: {
            '--toastBackground': '#4caf50',
            '--toastColor': '#fff',
          }
        });
      } else {
        throw new Error("Error deploying contract");
      }
      deploying = false;

      return;
    } catch (error: any) {
      console.log("deployContractHandler error", { error });
      contractError = error.message;
      toast.push(`Ru roh! Error deploying contract! check the console.log for more info.`,
      {
        theme: {
          '--toastBackground': 'var(--color-red-500)',
          '--toastColor': 'var(--color-white)',
        }
      });
      deploying = false;
      return;
    }
  };
</script>

<div class="container flex flex-col gap-8 p-4">
  <div class="flex items-center justify-between gap-4">
    <!-- <p>{BACKEND_URL}</p> -->
    {#if $wagmiLoaded}
      <div>
        <p class="font-bold">@wagmi/core status</p>
        <p>loaded and initialized</p>
      </div>
    {:else}
      <div>
        <p class="font-bold">@wagmi/core status</p>
        <p>not yet loaded</p>
      </div>
    {/if}
    {#if $chainId}
      <div>
        <p class="font-bold">Current chain</p>
        <p><span class="capitalize text-green-500">{$chainName}</span></p>
      </div>
    {:else}
      <div>
        <p class="font-bold">Current chain</p>
        <p>Chain not yet available</p>
      </div>
    {/if}
    {#if $signerAddress}
      <div>
        <p class="font-bold">Current signer address</p>
        <p>
          {$signerAddress}
          <button
            class="copy-button"
            use:copy={$signerAddress}
            on:svelte-copy={(event) =>
              alert(`Copied ${$signerAddress} to clipboard`)}
            ><CopyIcon /></button
          >
        </p>
      </div>
    {:else}
      <div>
        <p class="font-bold">Current signer address</p>
        <p>Signer address not yet available</p>
      </div>
    {/if}
    {#if $web3Modal}
      <div class="max-w-2xl">
        <button class="primary-button" on:click={$web3Modal.openModal}>
          {#if $connected}
            Connected
          {:else}
            Connect Wallet
          {/if}
        </button>
      </div>
    {:else}
      <p>Web3Modal not yet available</p>
    {/if}
  </div>

  <div class="header flex flex-row justify-between">
    <div class="tab overflow-hidden">
      <OverflowMenu>
        <button class:selected={tab === "PURE"} on:click={() => (tab = "PURE")}>
          Pure
        </button>
        <button
          class:selected={tab === "Capped"}
          on:click={() => (tab = "Capped")}
        >
          Capped
        </button>
        <button
          class:selected={tab === "MaticBridged"}
          on:click={() => (tab = "MaticBridged")}
        >
          MaticBridged
        </button>
      </OverflowMenu>
    </div>

    <div class="action flex flex-row gap-2 shrink-0">
      <Tooltip let:trigger theme="border" hideOnClick={false} interactive>
      <button class="action-button min-w-[165px]" on:click={copyHandler}>
        {#if copied}
          <CheckIcon />
          Copied Contract Code
        {:else}
          <CopyIcon />
          Copy Contract Code
        {/if}
      </button>
      <div slot="content">Copy the contract code.</div>
      </Tooltip>
      <Tooltip let:trigger theme="border" hideOnClick={false} interactive>
        <button
          use:trigger
          class={clsx(
            "action-button min-w-[165px] transition-colors",
            contractError && "text-red-500",
            compiled && "text-green-500"
          )}
          on:click={compileContractHandler}
        >
          {#if compiling}
            <ProcessingIcon />
            Compiling contract
          {:else}
            <CompileIcon />
            Compile contract
          {/if}
        </button>
        <div slot="content">Compile this contract.</div>
      </Tooltip>
      <Tooltip let:trigger theme="border" hideOnClick={false} interactive>
        <button
          use:trigger
          class="action-button min-w-[165px]"
          on:click={() => contractArtifacts && handleCopy(contractArtifacts)}
          disabled={contractArtifacts === undefined}
        >
          <CopyIcon />
          Copy Artifacts
        </button>
        <div slot="content">Copy the artifacts for this contract.</div>
      </Tooltip>
      <Tooltip let:trigger theme="border" hideOnClick={false} interactive>
        <button
          use:trigger
          class={clsx("action-button min-w-[165px]", {
            "text-green-500": contractArtifacts && !deploying,
            "text-red-500": contractError,
          })}
          on:click={deployContractHandler}
          disabled={contractArtifacts === undefined}
        >
          {#if deploying}
            <ProcessingIcon />
            Deploying Contract
          {:else}
            <DeployIcon />
            Deploy Contract
          {/if}
        </button>
        <div slot="content">
          {#if contractArtifacts}
            Deploy this contract on <i class="text-green-400 capitalize"
              >{$chainName}</i
            > network.
          {:else}
            Please compile your contract before you deploy it.
          {/if}
        </div>
      </Tooltip>
      <Tooltip
        let:trigger
        disabled={!(opts?.upgradeable === "transparent")}
        theme="border"
        hideOnClick={false}
        interactive
      >
        <button
          use:trigger
          class="action-button"
          class:disabled={opts?.upgradeable === "transparent"}
          on:click={remixHandler}
        >
          <RemixIcon />
          Open in Remix
        </button>
        <div slot="content">
          Transparent upgradeable contracts are not supported on Remix. Try
          using Remix with UUPS upgradability or use Hardhat or Truffle with
          <a
            href="https://docs.openzeppelin.com/upgrades-plugins/"
            target="_blank"
            rel="noopener noreferrer">OpenZeppelin Upgrades</a
          >.
          <br />
          <!-- svelte-ignore a11y-invalid-attribute -->
          <a href="#" on:click={remixHandler}>Open in Remix anyway</a>.
        </div>
      </Tooltip>

      <Dropdown let:active>
        <button class="action-button" class:active slot="button">
          <DownloadIcon />
          Download
        </button>

        <button class="download-option" on:click={downloadNpmHandler}>
          <FileIcon />
          <div class="download-option-content">
            <p>Single file</p>
            <p>
              Requires installation of npm package (<code
                >@openzeppelin/contracts</code
              >).
            </p>
            <p>Simple to receive updates.</p>
          </div>
        </button>

        {#if opts?.kind !== "Governor"}
          <button
            class="download-option"
            on:click={downloadHardhatHandler}
            disabled
          >
            <ZipIcon />
            <div class="download-option-content">
              <p>Development Package (Hardhat)</p>
              <p>Sample project to get started with development and testing.</p>
            </div>
          </button>
        {/if}

        <button
          class="download-option"
          on:click={downloadVendoredHandler}
          disabled
        >
          <ZipIcon />
          <div class="download-option-content">
            <p>Vendored ZIP</p>
            <p>Does not require npm package.</p>
            <p>Must be updated manually.</p>
            <p>Not recommended for beginners.</p>
          </div>
        </button>
      </Dropdown>
    </div>
  </div>

  <div class="flex flex-row gap-4 grow">
    <div class="controls w-64 flex flex-col shrink-0 justify-between">
      <div class:hidden={tab !== "PURE"}>
        <PureSuperTokenControls bind:opts={allOpts.PURE} />
      </div>
      <div class:hidden={tab !== "Capped"}>
        <CappedSuperTokenControls bind:opts={allOpts.Capped} />
      </div>
      <div class:hidden={tab !== "MaticBridged"}>
        <MaticBridgedSuperTokenControls bind:opts={allOpts.MaticBridged} />
      </div>
    </div>

    <div class="output flex flex-col grow overflow-auto">
      <pre class="flex flex-col grow basis-0 overflow-auto"><code
          class="hljs grow overflow-auto p-4">{@html highlightedCode}</code
        ></pre>
    </div>
  </div>
</div>

<SvelteToast options={toastOptions} />

<style lang="postcss">
  :root {
    --toastFontSize: 0.8rem;
  }

  .container {
    background-color: var(--gray-1);
    border: 1px solid var(--gray-2);
    border-radius: 10px;
    min-width: 32rem;
    min-height: 53rem;
  }

  .header {
    font-size: var(--text-small);
  }

  .tab {
    color: var(--gray-5);
  }

  .tab button,
  .action-button,
  .primary-button,
  :global(.overflow-btn) {
    padding: var(--size-2) var(--size-3);
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
  }

  .tab button,
  :global(.overflow-btn) {
    border: 0;
    background-color: transparent;
  }

  .tab button:hover,
  :global(.overflow-btn):hover {
    background-color: var(--gray-2);
  }

  .tab button.selected {
    background-color: var(--solidity-blue-2);
    color: white;
    order: -1;
  }

  :global(.overflow-menu) button.selected {
    order: unset;
  }

  .action-button {
    background-color: var(--gray-1);
    border: 1px solid var(--gray-3);
    color: var(--gray-6);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    text-transform: capitalize;

    &:hover {
      background-color: var(--gray-2);
    }

    &:active,
    &.active {
      background-color: var(--gray-2);
    }

    &.disabled,
    &:disabled,
    &[disabled] {
      color: var(--gray-4);
    }

    :global(.icon) {
      margin-right: var(--size-1);
      width: auto;
      height: 20px;
    }
  }

  .primary-button {
    background-color: var(--green-1);
    border: 1px solid var(--green-1);
    color: var(--gray-1);
    cursor: pointer;
    display: inline-flex;
    align-items: center;

    &:hover {
      background-color: var(--green-2);
    }

    &:active,
    &.active {
      background-color: var(--green-2);
    }

    &.disabled {
      color: var(--gray-4);
    }

    :global(.icon) {
      margin-right: var(--size-1);
      width: auto;
      height: 20px;
    }
  }

  .copy-button {
    background-color: transparent;
    border: none;
    cursor: pointer;
  }

  .controls {
    background-color: white;
    padding: var(--size-4);
  }

  .controls,
  .output {
    border-radius: 5px;
    box-shadow: var(--shadow);
  }

  .controls-footer {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    color: var(--gray-5);
    margin-top: var(--size-3);
    padding: 0 var(--size-2);
    font-size: var(--text-small);

    & > * + * {
      margin-left: var(--size-3);
    }

    :global(.icon) {
      margin-right: 0.2em;
      opacity: 0.8;
    }

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        color: var(--text-color);
      }
    }
  }

  .download-option {
    display: flex;
    padding: var(--size-2);
    text-align: left;
    background: none;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;

    :global(.icon) {
      margin-top: var(--icon-adjust);
    }

    :not(:hover) + & {
      border-top: 1px solid var(--gray-2);
    }

    &:hover,
    &:focus {
      background-color: var(--gray-1);
      border: 1px solid var(--gray-3);
    }

    &[disabled] {
      color: var(--gray-4);
      cursor: not-allowed;

      &:hover,
      &:focus {
        background-color: transparent;
        border: 1px solid transparent;
      }
    }

    & div {
      display: block;
    }
  }

  .download-option-content {
    margin-left: var(--size-3);
    font-size: var(--text-small);

    & > :first-child {
      margin-bottom: var(--size-2);
      color: var(--gray-6);
      font-weight: bold;
    }

    & > :not(:first-child) {
      margin-top: var(--size-1);
      color: var(--gray-5);
    }
  }

  .download-zip-beta {
    text-transform: uppercase;
    padding: 0 0.2em;
    border: 1px solid;
    border-radius: 4px;
    font-size: 0.8em;
    margin-left: 0.25em;
  }
</style>
