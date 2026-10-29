<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, readAs, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { mistagged, sharedSubjects } from '#lib/kb/problems';

  // Counts the desk's way (causes.ts, as CauseTable does); the one-day moves the desk noted get a row
  // and a ticket of their own, and stay counted where they're filed.
  // tickets: problem → link to the ticket it was filed as.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Record<string, string> } = $props();

  const rows = $derived(reports as Report[]);
  const merged = $derived(uniqueById(rows).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByCause(merged, tenantOf));
  const moved = $derived(groups.find((g) => readAs(g, notes.oneDayMove) > 0));
  const problems = $derived([
    ...groups.map((g) => ({ problem: g.cause as string, n: g.reports.length, taggedAs: g.taggedAs, tenants: g.tenants, seen: `${g.firstSeen} → ${g.lastSeen}`, filedUnder: null as string | null })),
    ...(moved ? [oneDayRow(moved.cause)] : []),
  ]);
  const subjects = $derived(sharedSubjects(merged, tenantOf, notes.oneDayMove));
  const wrongTag = $derived(mistagged(groups));

  function oneDayRow(filedUnder: string) {
    const rs = merged.filter((r) => notes.oneDayMove.includes(r.id));
    const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
    return {
      problem: 'one-day move',
      n: rs.length,
      taggedAs: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {}),
      tenants: new Set(rs.map((r) => r.tenant)).size,
      seen: `${days[0]} → ${days[days.length - 1]}`,
      filedUnder,
    };
  }
  const tags = (t: Record<string, number>) =>
    Object.entries(t)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
  const ticketNo = (href: string) => `#${href.split('/').pop()}`;
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{problems.length}</strong>
  {problems.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tagged as</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each problems as p (p.problem)}
      {@const href = tickets[p.problem]}
      <tr class:open={!href}>
        <td><code>{p.problem}</code></td>
        <td>{p.n}{#if p.filedUnder}<sup>*</sup>{/if}</td>
        <td class="tags">{tags(p.taggedAs)}</td>
        <td>{p.tenants}</td>
        <td>{p.seen}</td>
        <td>{#if href}<a {href}>{ticketNo(href)}</a>{:else}no ticket yet{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each problems.filter((p) => p.filedUnder) as p (p.problem)}
  <p class="note">* {p.n} reports read as a one-day move; filed under <code>{p.filedUnder}</code> by tenant and counted there too.</p>
{/each}
<p class="note">
  {rows.length - uniqueById(rows).length} rows in the export repeat an id and are counted once ·
  {wrongTag} reports carry an intake tag that is not their cause ·
  {subjects.shared} of {subjects.all} subject lines are used by more than one problem.
</p>

<style>
  .sum { font-size: 1.1rem; }
  .tags { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
  .open td { background: var(--warn-bg); }
</style>
