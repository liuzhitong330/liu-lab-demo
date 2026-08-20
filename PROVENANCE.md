# Data and code provenance

## Primary Liu Lab sources

1. Liu SJ, Zou C, Pak J, et al. *In vivo perturb-seq of cancer and microenvironment cells dissects oncologic drivers and radiotherapy responses in glioblastoma.* Genome Biology 25, 256 (2024). DOI: `10.1186/s13059-024-03404-6`.
2. Supplementary Table S1 (`13059_2024_3404_MOESM2_ESM.xlsx`): gene- and sgRNA-level GL261 CRISPRi growth, radiation, and radiation-normalized phenotypes. Downloaded from Springer’s official open-access supplementary host.
3. Supplementary Table S2 (`13059_2024_3404_MOESM3_ESM.xlsx`): the in vivo GL261 malignant-cell and SB28 microenvironment sgRNA libraries and protospacer sequences.
4. Supplementary Table S3 (`13059_2024_3404_MOESM4_ESM.xlsx`): cytokine assay values; inspected but not used in the published interaction.
5. Majd N, Zou C, et al., Liu SJ. *DNA-PKcs inhibition sensitizes glioblastoma to radiotherapy through reprogramming of tumor cell states and immune microenvironment cell types.* Research Square preprint (2026), DOI `10.21203/rs.3.rs-9657955/v1`.
6. Liu Lab repository: <https://github.com/liuj-lab/human_gbm_dnapk_public>, commit `53c8ccf057461a4efff329aadc3794598147ef28`.
7. Repository-linked Zenodo record: `10.5281/zenodo.20334626`, **GBM43 In Vivo Perturb-seq Data Files**, CC BY 4.0. The record contains `gbm43.h5ad` (294,941,932 bytes). The published demo uses notebook outputs and the open supplementary screen tables, not a partial local download.

## Repository work performed

- Cloned the verified Liu Lab repository and pinned the commit above.
- Inspected its README, `renv.lock`, `environment.yml`, GBM43 preprocessing, DESeq/GSEA, LDA/Mixscape, and D-SPIN notebooks/scripts.
- Parsed the executed `dspin_run.ipynb` outputs rather than merely citing its README. The notebook reports 18,938 cells, 3,210 highly variable genes, 1,812 genes retained for program inference, 25 gene programs, and 30 modeled gene perturbations plus controls.
- Reused the repository's explicit in vivo perturbation classes: RT-dependent (`CENPT`, `PRKDC`, `RIF1`), RT-independent clustered (15 genes), and RT-independent distributed (12 genes).
- Extended that output by joining it to the 2024 genome-scale screen and adding an adjustable payload-priority gate.
- No repository license file was present in the checked commit. The demo therefore publishes only compact derived values, source citations, and independently written code; it does not redistribute repository code or the large AnnData object.

## Transformations

- Read the gene table after its four header rows.
- Extracted mean and replicate-specific gamma (untreated growth), tau (radiation-arm growth), and rho (radiation-normalized) phenotypes plus Mann–Whitney p values and the authors' hit calls.
- Defined a direction check as `sign(rho replicate 1) == sign(rho replicate 2)`.
- The adjustable gate requires the authors' rho hit call, a user-selected minimum absolute rho, a user-selected maximum rho p value, concordant replicate direction when enabled, and optional exclusion of baseline gamma hits and pseudo-annotated loci.
- Joined selected genes to Table S2 protospacer records and to the repository-derived in vivo perturbation classes after case normalization.

## Checked outputs

- 10,252 gene-level rows were parsed.
- 63 genes carry the authors' rho hit call: 28 negative/sensitizing and 35 positive/protective; all 63 have the same rho direction in both biological replicates.
- PRKDC is the strongest negative rho hit: mean `-1.974871`, replicate values `-2.266776` and `-1.682967`, rho Mann–Whitney p `0.000164`.
- XRCC5 is the next strongest negative hit at `-0.952656`.
- At the demo's default sensitizer gate (`rho ≤ −0.30`, p ≤ 0.05, concordant replicates, no baseline gamma hit, no pseudo loci), 14 named genes pass. Twenty-one named genes pass when both sensitizing and protective directions are allowed.
- The executed Liu Lab notebook reports 18,938 GBM43 cells and classifies only PRKDC, RIF1, and CENPT as RT-dependent among the 30 modeled gene perturbations.

## Limitations

- The genome-scale screen is mouse GL261 and in vitro; it nominates payload targets but does not prove human GBM efficacy.
- The GBM43 analysis is a 2026 preprint and should not be treated as peer-reviewed final evidence.
- The public data do not expose the Berkeley LNP chemistry library or measured formulation QC, so the LNP screen layout is a proposal, not a Liu Lab SOP.
- CRISPRi depletion and CRISPRoff mRNA/sgRNA delivery are related repression strategies but are not experimentally interchangeable.
