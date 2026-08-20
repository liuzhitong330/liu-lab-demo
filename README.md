# Liu Lab — Intracranial CRISPR target-to-delivery gate

An academic-data-first interactive demo built for the UCSF Liu Lab and the Associate or Full Specialist application (JPF06084).

The demo combines:

- the lab's public GL261 CRISPRi screen (Genome Biology, 2024),
- the executed human GBM43 in vivo Perturb-seq analysis from `liuj-lab/human_gbm_dnapk_public`, and
- published intracerebral MC3-LNP reporter and editing benchmarks.

It lets the lab change the evidence gate, inspect replicate-level target evidence, and convert a selected target into a two-stage intracranial LNP validation plan.

## Methods and provenance

Detailed data sources, transformations, repository commit, and limitations are documented in `PROVENANCE.md`. The public interface also links directly to the primary paper, repository, and benchmark study.

## Run locally

Serve this directory with any static web server, for example:

```bash
python3 -m http.server 8765
```
