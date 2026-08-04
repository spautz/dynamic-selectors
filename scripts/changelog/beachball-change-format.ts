// A beachball changelog-entry renderer, in the spirit of the old `changesets-changelog-format`
// package: it links each entry to the commit that introduced it, and to the PR/issue referenced
// in that commit's subject line (if any). This file has no dependency on this specific repo, so
// it could be pulled out into its own package later (see `beachball.config.ts` for the wiring).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ChangelogEntry } from 'beachball';

/**
 * Options for `createRenderEntry`, mirroring the fields the old `changesets-changelog-format`
 * package's `options.ts` exposed for the same purpose.
 */
export interface ChangelogLinkOptions {
  /**
   * Base URL for commit/issue links, e.g. `https://github.com/owner/repo`.
   *
   * If unset, this is inferred first from the repo's own `package.json` (`repository` field),
   * then from the `origin` git remote.
   */
  repoBaseUrl?: string;

  /** Pattern used to find a PR/issue number in a commit's subject line. */
  issuePattern?: string;
}

// GitHub's default squash-merge commit subject ends with the PR number in parens, e.g. "Fix thing (#123)".
const DEFAULT_ISSUE_PATTERN = '#(\\d+)\\)';

/**
 * Normalizes a repo URL from `package.json` or `git remote` into a plain `https://host/owner/repo`
 * link, stripping `git+`/`.git` and converting SSH forms (`git@host:owner/repo`, `ssh://git@host/...`).
 * Returns `undefined` if `rawUrl` doesn't look like a URL we can link to.
 */
export function normalizeRepoUrl(rawUrl: string): string | undefined {
  let url = rawUrl
    .trim()
    .replace(/^git\+/, '')
    .replace(/\.git$/, '');

  const scpMatch = url.match(/^git@([^:]+):(.+)$/);
  if (scpMatch) {
    return `https://${scpMatch[1]}/${scpMatch[2]}`;
  }

  url = url.replace(/^ssh:\/\/git@/, 'https://');

  return /^https?:\/\//.test(url) ? url : undefined;
}

/** Reads `repository.url` (or `repository`, if it's a bare string) from the repo's `package.json`. */
export function readRepoBaseUrlFromPackageJson(cwd: string = process.cwd()): string | undefined {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as {
      repository?: string | { url?: string };
    };
    const rawUrl = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
    return rawUrl ? normalizeRepoUrl(rawUrl) : undefined;
  } catch {
    return undefined;
  }
}

/** Reads the `origin` remote URL from git, for repos whose `package.json` doesn't have one set. */
export function readRepoBaseUrlFromGit(): string | undefined {
  try {
    const rawUrl = execFileSync('git', ['remote', 'get-url', 'origin'], {
      encoding: 'utf8',
    }).trim();
    return normalizeRepoUrl(rawUrl);
  } catch {
    return undefined;
  }
}

export function resolveRepoBaseUrl(options?: ChangelogLinkOptions): string | undefined {
  return options?.repoBaseUrl ?? readRepoBaseUrlFromPackageJson() ?? readRepoBaseUrlFromGit();
}

/**
 * Looks up the subject line of a commit, to check it for a trailing PR reference.
 * Returns `undefined` if the commit can't be found for any reason.
 *
 * No `cwd` is passed: git walks up from the process's cwd to find the repo root on its own,
 * and beachball is always run from somewhere inside the repo it's configuring.
 */
export function getCommitSubject(commitHash: string): string | undefined {
  try {
    return execFileSync('git', ['log', '-1', '--format=%s', commitHash], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return undefined;
  }
}

/**
 * Creates a beachball `renderEntry` function, replicating the behavior of the old
 * `changesets-changelog-format` package: the comment, followed by a link to the commit that
 * added the change file, followed by a link to the PR/issue if the commit was a squash-merge.
 *
 * Unlike beachball's default renderer, this intentionally omits the author: the old format never
 * included it either.
 */
export function createRenderEntry(
  options?: ChangelogLinkOptions,
): (entry: ChangelogEntry) => string {
  const repoUrl = resolveRepoBaseUrl(options);
  const issuePattern = new RegExp(options?.issuePattern ?? DEFAULT_ISSUE_PATTERN);

  return function renderEntry(entry: ChangelogEntry): string {
    const [firstLine, ...restLines] = entry.comment.split('\n').map((line) => line.trimEnd());
    const body = restLines.length ? `\n${restLines.map((line) => ` ${line}`).join('\n')}` : '';

    let line = `- ${firstLine}`;

    if (entry.commit && repoUrl) {
      line += ` ([${entry.commit.slice(0, 7)}](${repoUrl}/commit/${entry.commit}))`;

      const subject = getCommitSubject(entry.commit);
      const prMatch = subject?.match(issuePattern);
      if (prMatch) {
        line += ` ([#${prMatch[1]}](${repoUrl}/issues/${prMatch[1]}))`;
      }
    }

    return line + body;
  };
}
