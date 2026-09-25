# Motion storyboards

Every composition is 1280×720 at 60 fps, 12 s, rendered twice: on the dark and on the light site palette (the `theme` input prop). Each one
explains one mechanism; the text alternative on the site is `content/site/motion.json`.

Motion vocabulary (see `packages/motion-tokens`):

| Concept           | Visual                                                    |
| ----------------- | --------------------------------------------------------- |
| Data              | a packet travelling along an edge                         |
| Architecture      | nodes appear progressively, edges draw between them       |
| Queue             | an item arrives, waits in place, then proceeds            |
| Security boundary | a dashed layer drawn around the nodes it contains         |
| Failure           | a path stops, or branches into a red terminal state       |
| Performance       | a long runtime path fades and collapses into a direct one |
| Arrival / engage  | an expanding ring pulse that damps out                    |
| Metric            | an odometer whose digit columns roll                      |
| Discard           | a particle dissolve                                       |

Timelines are authored on a 30 fps, 16 s story clock (`storyScale` in `packages/motion-tokens`) and rendered at 60 fps over 12 s, so every beat keeps its relative timing and gains sub-frame smoothness.

---

## GstReturnsArchitecture

**Concept.** Returns status is served from a projection kept fresh by domain events.

**States.**

1. GST data node.
2. Four stores fan out: Books, IMS, GSTR-2B, GSTR-1 · GSTR-3B. Packets fill them.
3. M9 reconciliation pulls from Books, IMS and GSTR-2B; five classification chips appear; the result leaves over SSE.
4. GSTR-1 · GSTR-3B emits source-changed domain events into a precomputed returns status projection.
5. The returns read API first shows a long dashed path back through the stores (`3,000ms+`), which fades and is replaced by one short edge to the projection (`sub-15ms at peak load`).

**Takeaway.** Read what is already computed.

## QrRedemptionFlow

**Concept.** Concurrent scans against one remaining unit produce exactly one redemption.

**States.**

1. Pipeline: QR scan → Pre-validation → Inventory check → Redis lock → Atomic redemption → SSE → Dashboard. Inventory counter shows 1.
2. Scans A and B arrive together, pass pre-validation and the inventory check.
3. A takes the lock; B waits at the lock (queue).
4. A redeems: counter 1 → 0; the update streams over SSE to the dashboard. Lock released.
5. B takes the lock, re-reads 0 and branches into a rejected state.

**Takeaway.** Two concurrent scans. One unit. One redemption.

## BaraMemoryArchitecture

**Concept.** Retrieval is decided by deterministic gates, and only the chosen tiers are read.

**States.**

1. Four memory tiers on the right; the message pipeline on the left; a 41-cell gate matrix between them.
2. Message 1 (acknowledgement) is classified, gates evaluate, retrieval is skipped; it goes straight to the LLM. Tiers stay dark.
3. Message 2 (refers back to an earlier decision) opens gates; only research memory and episodic memory light up and return context.
4. Context reaches the LLM and a response leaves.

**Takeaway.** Retrieval is a decision, not a reflex.

## AntigravityReviewPipeline

**Concept.** Review runs inside a disposable worktree; the main branch is never touched.

**States.**

1. A `main` lane across the top, marked protected.
2. A PR arrives; a dashed worktree boundary is drawn and the PR head is checked out inside it.
3. Five passes run in sequence, each dropping findings into a tray; some are line-anchored, some are not.
4. The evidence gate drops unanchored findings; anchored ones become a GitHub review.
5. The worktree boundary dissolves. `MAIN BRANCH / UNTOUCHED`.

**Takeaway.** Main branch untouched.

---

## AcfsForensicReport

**Concept.** Evidence stays tied to its source: the report carries the SHA-256 of the original artifact.

**States.**

1. Artifact node; its SHA-256 digest is computed first and pinned beneath it.
2. Three independent lanes read the same file: ViT / DeiT classifier, Error Level Analysis, EXIF anomaly check. Each packet carries the digest.
3. The classifier lane continues to a Grad-CAM heatmap.
4. Findings converge on the PDF forensic report; its rows fill in.
5. The intake digest travels along a dashed provenance path and is printed as "SHA-256 of original".

**Grounding.** `content/projects/acfs.md` (architecture diagram, "PDF forensic report generator that includes a SHA-256 hash of the original artifact"). The digest value is illustrative. The text lanes (RoBERTa / DeBERTa, stylometry, SHAP) are left out to keep the figure to one modality.

---

## DhvvsProofChain

**Concept.** Anchor a hash, not the record — and a retroactive edit becomes visible.

**States.**

1. Chain: presence (NFC / QR + GPS) → ECDSA sign on device → NestJS ingestion → BullMQ → EVM L2.
2. The signed payload is verified and persisted as a PostgreSQL visit record.
3. A BullMQ job anchors the record's hash on-chain.
4. Failure: one field (timestamp) is edited after anchoring; the recomputed hash no longer matches — MISMATCH.
5. Restore: the original value hashes to the anchored value again — MATCH.

**Grounding.** `content/projects/dhvvs.md` (proof chain, "Once on-chain, no database admin can retroactively alter it", "Anchor a hash, not the record"). The hash check illustrates that property; field values and hashes are illustrative.
