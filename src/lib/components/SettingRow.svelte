<script>
  // One labelled row on the Settings page; the control goes in as children.
  let { label, children } = $props()
</script>

<div class="field">
  <span class="label">{label}</span>
  {@render children()}
</div>

<style>
  .field {
    display: flex;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 12px;
  }
  .label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    width: 100px;
    flex-shrink: 0;
  }
</style>
