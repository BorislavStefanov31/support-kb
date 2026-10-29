// What the subject-line merge hid in a big ticket. causes.ts places a report by tenant and channel;
// desk-notes.json lists the reports the desk read as a one-day move, which a day/month flip cannot
// explain, so they are a problem of their own.
import { causeOf, type CauseGroup, type Report, type Tenant } from '#lib/kb/causes';

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): string {
  if (oneDayMove.includes(r.id)) return 'one-day move';
  return causeOf(r, t) ?? 'unplaced';
}

// Subject lines used by reports of more than one problem: the ones a subject-only merge cannot split.
export function sharedSubjects(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { shared: number; all: number } {
  const problems = new Map<string, Set<string>>();
  for (const r of reports) problems.set(r.subject, (problems.get(r.subject) ?? new Set()).add(problemOf(r, tenantOf(r), oneDayMove)));
  return { shared: [...problems.values()].filter((s) => s.size > 1).length, all: problems.size };
}

// Reports whose intake tag disagrees with the cause they are filed under.
export function mistagged(groups: CauseGroup[]): number {
  return groups.reduce((n, g) => n + g.reports.filter((r) => r.meta.intakeTag !== g.cause).length, 0);
}
