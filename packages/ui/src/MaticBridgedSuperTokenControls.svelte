<script lang="ts">
  import type { KindedOptions } from '@superfluid-wizard/core';
  import { infoDefaults, premintPattern } from '@superfluid-wizard/core';
  import { maticBridgedSuperToken } from '@superfluid-wizard/core/src/api';
  import { maticBridgedSuperTokenDefaults } from '@superfluid-wizard/core/src/maticbridged';

  import AccessControlSection from './AccessControlSection.svelte';
  import HelpTooltip from './HelpTooltip.svelte';
  import InfoSection from './InfoSection.svelte';
  import UpgradeabilitySection from './UpgradeabilitySection.svelte';

  export const opts: Required<KindedOptions['MaticBridged']> = {
    kind: 'MaticBridged',
    ...maticBridgedSuperTokenDefaults,
    info: { ...infoDefaults }, // create new object since Info is nested
  };

  $: requireAccessControl = maticBridgedSuperToken.isAccessControlRequired(opts);
</script>

<section class="controls-section">
  <h2>Settings</h2>

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

    <!-- <label class="labeled-input">
      <span class="flex justify-between pr-2">
        Premint
        <HelpTooltip>Create an initial amount of tokens for the deployer.</HelpTooltip>
      </span>
      <input bind:value={opts.initialSupply} type="number" placeholder="0" pattern={premintPattern.source}>
    </label>

    <label class="labeled-input">
      <span class="flex justify-between pr-2">
        Receiver
        <HelpTooltip>Create an initial receiver.</HelpTooltip>
      </span>
      <input bind:value={opts.receiver}>
    </label> -->
</section>

<!-- <section class="controls-section">
  <h2>Features</h2>

  <div class="checkbox-group">
    <label class:checked={opts.mintable}>
      <input type="checkbox" bind:checked={opts.mintable}>
      Mintable
      <HelpTooltip>
        Privileged accounts will be able to create more supply.
      </HelpTooltip>
    </label>
  </div>
</section> -->

<!-- <AccessControlSection bind:access={opts.access} required={requireAccessControl} /> -->

<UpgradeabilitySection bind:upgradeable={opts.upgradeable} />

<InfoSection bind:info={opts.info} />
