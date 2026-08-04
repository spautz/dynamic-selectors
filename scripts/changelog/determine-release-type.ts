#!/usr/bin/env node
/** biome-ignore-all lint/suspicious/noConsole: This is a shell script */

// Determines whether the change files pending on this branch are safe to auto-publish (patch-only)
// or need an explicit review PR (minor/major), without invoking beachball itself: beachball has no
// programmatic API (its `index.ts` only exports types) and no CLI mode that reports this directly.

import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { ChangeType } from 'beachball';

/** Matches beachball's own default `changeDir` option, which this repo does not override. */
const DEFAULT_CHANGE_DIR = 'change';

/**
 * Change types, ordered least to most significant severity (the index is the severity). Mirrors
 * beachball's internal `SortedChangeTypes` (see `changefile/changeTypes.ts` in the `beachball`
 * package), which is not exported publicly.
 */
const SORTED_CHANGE_TYPES = [
  'none',
  'prerelease',
  'prepatch',
  'patch',
  'preminor',
  'minor',
  'premajor',
  'major',
] as const satisfies readonly ChangeType[];

const PATCH_TIER_SEVERITY = SORTED_CHANGE_TYPES.indexOf('patch');

export type ReleaseType = 'none' | 'patch' | 'minor-or-major';

/** The subset of a beachball change file's fields this script cares about. */
interface ChangeFileEntry {
  type: ChangeType;
  packageName: string;
  /** How dependent packages should be bumped, if this change cascades via `bumpDeps`. */
  dependentChangeType?: ChangeType;
}

/** A grouped change file (written when beachball's `groupChanges` option is enabled). */
interface GroupedChangeFile {
  changes: ChangeFileEntry[];
}

function isGroupedChangeFile(value: unknown): value is GroupedChangeFile {
  return Array.isArray((value as Partial<GroupedChangeFile> | undefined)?.changes);
}

function isChangeFileEntry(value: unknown): value is ChangeFileEntry {
  const entry = value as Partial<ChangeFileEntry> | undefined;
  return typeof entry?.type === 'string' && typeof entry.packageName === 'string';
}

/** Reads every change file entry under `changeDir`, flattening grouped change files. */
function readChangeEntries(changeDir: string): ChangeFileEntry[] {
  if (!existsSync(changeDir)) {
    return [];
  }

  const entries: ChangeFileEntry[] = [];

  for (const fileName of readdirSync(changeDir)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }

    const filePath = path.join(changeDir, fileName);
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw new Error(
        `Failed to parse change file ${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const changes = isGroupedChangeFile(parsed) ? parsed.changes : [parsed];

    for (const change of changes) {
      if (!isChangeFileEntry(change)) {
        throw new Error(
          `${filePath} does not look like a valid change file entry: ${JSON.stringify(change)}`,
        );
      }
      entries.push(change);
    }
  }

  return entries;
}

function severityOf(changeType: ChangeType | undefined): number {
  return changeType ? Math.max(SORTED_CHANGE_TYPES.indexOf(changeType), 0) : 0;
}

/**
 * The severity of a single change entry is the greater of its own bump type and the bump type it
 * would cascade to dependents (relevant since this repo has `bumpDeps: true`).
 */
function entrySeverity(entry: ChangeFileEntry): number {
  return Math.max(severityOf(entry.type), severityOf(entry.dependentChangeType));
}

/**
 * Classifies pending change files as `'none'` (nothing to release), `'patch'` (safe to publish
 * directly), or `'minor-or-major'` (should go through a reviewable release PR).
 */
export function determineReleaseType(changeDir: string): ReleaseType {
  const entries = readChangeEntries(changeDir);
  const maxSeverity = entries.reduce((max, entry) => Math.max(max, entrySeverity(entry)), 0);

  if (maxSeverity === 0) {
    return 'none';
  }
  return maxSeverity <= PATCH_TIER_SEVERITY ? 'patch' : 'minor-or-major';
}

function main(): void {
  const changeDir = path.resolve(process.cwd(), process.argv[2] ?? DEFAULT_CHANGE_DIR);
  const releaseType = determineReleaseType(changeDir);

  const githubOutputPath = process.env['GITHUB_OUTPUT'];
  if (githubOutputPath) {
    appendFileSync(githubOutputPath, `release-type=${releaseType}\n`);
  }

  console.log(releaseType);
}

main();
