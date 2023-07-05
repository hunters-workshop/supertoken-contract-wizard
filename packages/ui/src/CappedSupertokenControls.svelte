<script lang="ts">
  import type { KindedOptions } from '@openzeppelin/wizard';
  import { infoDefaults, premintPattern } from '@openzeppelin/wizard';
  import { cappedSupertoken } from '@openzeppelin/wizard/src/api';
  import { cappedSupertokenDefaults } from '@openzeppelin/wizard/src/cappedtoken';

  import AccessControlSection from './AccessControlSection.svelte';
  import HelpTooltip from './HelpTooltip.svelte';
  import InfoSection from './InfoSection.svelte';
  import UpgradeabilitySection from './UpgradeabilitySection.svelte';

  export const opts: Required<KindedOptions['Capped']> = {
    kind: 'Capped',
    ...cappedSupertokenDefaults,
    info: { ...infoDefaults }, // create new object since Info is nested
  };

  $: requireAccessControl = cappedSupertoken.isAccessControlRequired(opts);
</script>

<section class="controls-section">
  <h1>Settings</h1>

    <div class="grid grid-cols-[2fr,1fr] gap-2">
      <label class="labeled-input">
        <span>Name</span>
        <input bind:value={opts.name}>
      </label>

      <label class="labeled-input">
        <span>Symbol</span>
        <input bind:value={opts.symbol}>
      </label>
    </div>

    <label class="labeled-input">
      <span class="flex justify-between pr-2">
        Premint
        <HelpTooltip>Create an initial amount of tokens for the deployer.</HelpTooltip>
      </span>
      <input bind:value={opts.initialSupply} placeholder="0" pattern={premintPattern.source}>
    </label>
</section>

<section class="controls-section">
  <h1>Features</h1>

  <div class="checkbox-group">
    <label class:checked={opts.mintable}>
      <input type="checkbox" bind:checked={opts.mintable}>
      Mintable
      <HelpTooltip>
        Privileged accounts will be able to create more supply.
      </HelpTooltip>
    </label>
  </div>
  <div class={`checkbox-group ${!opts.mintable && 'is-disabled'}`}>
    <label class:checked={opts.ownable}>
      <input type="checkbox" bind:checked={opts.ownable} disabled={!opts.mintable ?? true} >
      Ownable (Modifier)
      <HelpTooltip>
        {!opts.mintable ? 'This is a modifier for the Mintable method. Please select Mintable first' : 'Only the owner will be able to mint the tokens'}.
      </HelpTooltip>
    </label>
  </div>
</section>

<AccessControlSection bind:access={opts.access} required={requireAccessControl} />

<UpgradeabilitySection bind:upgradeable={opts.upgradeable} />

<InfoSection bind:info={opts.info} />
