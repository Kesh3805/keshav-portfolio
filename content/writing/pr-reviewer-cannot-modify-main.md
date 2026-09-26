---
title: How I Built a PR Reviewer That Cannot Modify the Main Branch
slug: pr-reviewer-cannot-modify-main
description: A threat model for Antigravity, an unattended PR reviewer — per-PR worktrees, an AST-level ban on mutation paths, an evidence gate, and the risk a worktree does not remove.
publishedAt: 2026-09-25
tags:
  - Rust
  - Developer Infrastructure
  - Security
relatedProjects:
  - antigravity-pr-reviewer
---

[Antigravity](/projects/antigravity-pr-reviewer) is a Rust daemon that reviews pull requests on a production NestJS codebase without being asked. It polls GitHub for PRs labelled `review-requested`, filters to the ones still awaiting its review, checks each out, runs five analysis passes — CodeGraph impact analysis, an AST check for tenant isolation, `tsc --noEmit`, ESLint and dependency-cruiser — and submits a GitHub review with line-anchored comments. Reviews run in parallel.

Anything that runs unattended with repository access deserves a threat model before it deserves features. This is that model, and the controls that answer it.

> The Rust below is written for this post to show each technique; Antigravity's own source differs in detail.

## Assets and trust boundaries

**What must not be harmed:** the repository's refs (above all the main branch), the host checkout the daemon runs from, the GitHub credential it holds, and — less obviously — the team's trust in its comments. A reviewer people learn to ignore has failed even if it never breaks anything.

**What is untrusted:** the contents of every pull request. The daemon checks out code it has never seen and runs tooling against it.

**What is trusted but fallible:** the daemon's own code, today and after every future change to it.

## Threats and controls

| # | Threat | Control |
| --- | --- | --- |
| T1 | One review's state leaks into another, or into the host checkout | One `git worktree` per PR, detached at the PR's head commit, in a temp directory |
| T2 | A failed or panicking review leaves a worktree behind | Worktree lifetime bound to a value; removal runs on every exit path |
| T3 | The daemon pushes, merges or otherwise mutates the repository — through a bug or a future change | `src/github.rs` may not contain mutation paths; unit tests parse its AST and fail if they appear |
| T4 | Findings are noisy enough that people stop reading them | Evidence gate: a finding needs a line in the diff; comments are pinned to that line |
| T5 | Running the PR's own tooling executes code from the PR | **Residual** — see below |

## T1, T2: isolation that can't be forgotten

Every PR gets its own worktree at its head SHA. All five passes run inside it; the main checkout is never switched, stashed or built. Using `--detach` means the worktree has no branch checked out at all, so there is no local branch that could be pushed from it.

"Cleaned up after every review, whether it succeeds or fails" is the kind of rule that is easy to state and easy to break with one early `return`. In Rust it can be made structural by tying the worktree to a value whose destructor removes it:

```rust title="worktree.rs"
use std::path::{Path, PathBuf};
use std::process::Command;

pub struct Worktree {
    repo: PathBuf,
    path: PathBuf,
}

impl Worktree {
    pub fn create(repo: &Path, head_sha: &str) -> std::io::Result<Self> {
        let path = std::env::temp_dir().join(format!("review-{head_sha}"));
        let status = Command::new("git")
            .arg("-C").arg(repo)
            .args(["worktree", "add", "--detach"])
            .arg(&path)
            .arg(head_sha)
            .status()?;
        if !status.success() {
            return Err(std::io::Error::other(format!("git worktree add failed for {head_sha}")));
        }
        Ok(Self { repo: repo.to_path_buf(), path })
    }

    pub fn path(&self) -> &Path {
        &self.path
    }
}

impl Drop for Worktree {
    // Runs on success, on early return, on `?`, and while unwinding from a panic.
    fn drop(&mut self) {
        let _ = Command::new("git")
            .arg("-C").arg(&self.repo)
            .args(["worktree", "remove", "--force"])
            .arg(&self.path)
            .status();
    }
}
```

The review function takes the `Worktree` by value or holds it for its whole scope; there is no code path that finishes a review with the directory still registered.

## T3: prove the mutation paths don't exist

Isolation keeps the review from damaging the checkout. It doesn't stop code from deliberately calling `git push`.

All GitHub interaction lives in `src/github.rs`, and that file is **prohibited from containing any `git push`, `git merge` or repository-mutation code path**. The prohibition is a unit test that **parses the file's AST** and fails the build if a banned pattern appears.

Parsing is the point. A `grep` for "push" also matches comments, docs and unrelated identifiers, so it gets loosened until it catches nothing. An AST visitor looks only at the method calls and string literals the compiler sees:

```rust title="tests/no_mutation.rs"
use std::fs;
use syn::visit::{self, Visit};
use syn::{ExprMethodCall, LitStr};

const BANNED_CALLS: &[&str] = &["push", "merge", "force_push", "delete_ref"];
const BANNED_GIT_VERBS: &[&str] = &["push", "merge", "rebase", "reset"];

#[derive(Default)]
struct Findings(Vec<String>);

impl<'ast> Visit<'ast> for Findings {
    fn visit_lit_str(&mut self, lit: &'ast LitStr) {
        // Catches Command::new("git").args(["push", …]) and similar.
        let value = lit.value();
        if BANNED_GIT_VERBS.contains(&value.as_str()) {
            self.0.push(format!("git verb literal {value:?}"));
        }
    }

    fn visit_expr_method_call(&mut self, call: &'ast ExprMethodCall) {
        let name = call.method.to_string();
        if BANNED_CALLS.contains(&name.as_str()) {
            self.0.push(format!("method call .{name}()"));
        }
        visit::visit_expr_method_call(self, call);
    }
}

#[test]
fn github_module_has_no_mutation_paths() {
    let source = fs::read_to_string("src/github.rs").expect("read src/github.rs");
    let file = syn::parse_file(&source).expect("parse src/github.rs");
    let mut findings = Findings::default();
    findings.visit_file(&file);
    assert!(findings.0.is_empty(), "src/github.rs must not mutate the repository: {:?}", findings.0);
}
```

What this buys is not safety today — a reviewer could establish that by reading the file once. It is that **the next change can't quietly remove it**: a commit that adds a push path to the GitHub module fails CI before it can merge.

The AST test constrains code, not credentials. The real ceiling is the token: it should carry read access to contents and pull requests, and write access only to reviews — so that even a path the test missed has nothing to push with.

## T4: findings that earn a comment

The second failure mode of an automated reviewer is the quiet one: it is technically harmless and routinely ignored.

Every finding from the five passes goes through an **evidence gate**. It becomes a comment only if it is anchored to a **specific line in a file the PR changed** — not a pattern match somewhere in the repository, not a general observation about a module. Surviving findings are pinned to those exact diff lines through the GitHub Pull Request Review API, and the daemon submits one complete review — `REQUEST_CHANGES` or `APPROVE` — from the aggregate severity, rather than a stream of loose comments.

The tenant-isolation pass shows why the anchor matters. It verifies that every TypeORM repository query **in the changed files** carries an `account_id` scope. A missing scope on a line the PR added is a finding with evidence; a pre-existing pattern three modules away is not this PR's finding, however valid.

## T5: the risk a worktree doesn't remove

Three of the five passes execute the project's own tooling: `tsc`, ESLint and dependency-cruiser. Inside a PR's worktree, that means running **that PR's** configuration. ESLint configs are JavaScript and plugins are packages; a PR that changes them changes what runs.

A worktree isolates git state. It does not isolate a process: the passes run with the daemon's user, filesystem and network. The controls above keep the repository and the host checkout intact; they don't make executing untrusted configuration safe.

What bounds this today is where the daemon runs and what triggers it: it reviews one team's repository, and a review only starts when someone applies the `review-requested` label — a human decision per PR. Making it safe for untrusted contributors would take more:

- run the tooling passes in a container with no network and no credentials, mounting only the worktree;
- take lint and type-check configuration from the base branch rather than the PR's head;
- keep the GitHub token out of the tooling processes' environment entirely — only the review-posting step needs it.

That list is the difference between "cannot modify the main branch" and "safe to point at anyone's pull request". The first is what the design guarantees. The second is a separate problem, and naming it is part of the model.
