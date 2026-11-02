<script>
  // A row of selectable cards, used for every multiple-choice setting.
  //
  //   options     [{ value, label, desc? }]
  //   value       the current value; the matching card is highlighted
  //   onselect    called with an option's value when its card is pressed
  //   isSelected  overrides the highlight test, for multi-select groups
  //   chip        compact cards with no description
  let {
    options,
    value = undefined,
    onselect,
    isSelected = opt => opt.value === value,
    chip = false,
  } = $props()
</script>

<div class="options">
  {#each options as opt}
    <button
      class="option"
      class:chip
      class:selected={isSelected(opt)}
      onclick={() => onselect(opt.value)}
    >
      <span class="opt-label">{opt.label}</span>
      {#if opt.desc}<span class="opt-desc">{opt.desc}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .options { display: flex; gap: 8px; flex-wrap: wrap; }
  .option {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    min-width: 110px;
    transition: border-color 0.1s;
  }
  .option.chip {
    min-width: auto;
    padding: 6px 12px;
  }
  :global(html:not(.no-hover)) .option:hover { border-color: var(--accent); }
  .option.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); }
  .opt-label { font-weight: 600; font-size: 13px; }
  .opt-desc { font-size: 11px; color: var(--text-muted); line-height: 1.4; }
</style>
