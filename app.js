(function () {
  "use strict";

  const data = window.LIU_LAB_DEMO_DATA;
  if (!data) return;

  const genes = data.genes.filter((gene) => gene.rho !== null && gene.rhoP !== null);
  const geneMap = new Map(genes.map((gene) => [gene.gene.toLowerCase(), gene]));
  let selected = geneMap.get("prkdc");

  const form = document.getElementById("target-form");
  const input = document.getElementById("target-select");
  const datalist = document.getElementById("target-options");
  const suggestions = document.getElementById("suggestions");
  const effect = document.getElementById("effect-threshold");
  const pValue = document.getElementById("p-threshold");
  const direction = document.getElementById("direction-filter");
  const concordance = document.getElementById("require-concordance");
  const excludeGrowth = document.getElementById("exclude-growth");
  const excludePseudo = document.getElementById("exclude-pseudo");
  const canvas = document.getElementById("volcano");
  const ctx = canvas.getContext("2d");
  const candidateList = document.getElementById("candidate-list");
  const profileSvg = document.getElementById("profile-viz");

  const suggestedGenes = ["Prkdc", "Xrcc5", "Fanca", "Trp53bp1", "Bard1", "Ercc4", "Rif1", "Cenpt"];
  genes.filter((gene) => gene.rhoHit).sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho)).forEach((gene) => {
    const option = document.createElement("option");
    option.value = gene.gene;
    datalist.appendChild(option);
  });
  suggestedGenes.forEach((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.addEventListener("click", () => selectGene(name));
    suggestions.appendChild(button);
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[character]));
  }

  function format(value, digits) {
    if (value === null || Number.isNaN(value)) return "not measured";
    return Number(value).toFixed(digits);
  }

  function passesGate(gene) {
    const minEffect = Number(effect.value);
    const maxP = Number(pValue.value);
    const directionPass = direction.value === "both" ||
      (direction.value === "sensitizer" && gene.rho < 0) ||
      (direction.value === "protector" && gene.rho > 0);
    return gene.rhoHit && Math.abs(gene.rho) >= minEffect && gene.rhoP <= maxP && directionPass &&
      (!concordance.checked || gene.directionConcordant) &&
      (!excludeGrowth.checked || !gene.gammaHit) &&
      (!excludePseudo.checked || !gene.pseudo);
  }

  function getCandidates() {
    const list = genes.filter(passesGate);
    if (direction.value === "sensitizer") return list.sort((a, b) => a.rho - b.rho);
    if (direction.value === "protector") return list.sort((a, b) => b.rho - a.rho);
    return list.sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho));
  }

  function drawVolcano(candidates) {
    const width = canvas.width;
    const height = canvas.height;
    const left = 56;
    const right = 18;
    const top = 18;
    const bottom = 44;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const xMin = -2.5;
    const xMax = 1.5;
    const yMax = 4.5;
    const candidateNames = new Set(candidates.map((gene) => gene.gene));
    const x = (value) => left + ((Math.max(xMin, Math.min(xMax, value)) - xMin) / (xMax - xMin)) * plotWidth;
    const y = (p) => top + (1 - Math.min(yMax, -Math.log10(Math.max(p, 0.00001))) / yMax) * plotHeight;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fcfcfc";
    ctx.fillRect(0, 0, width, height);
    ctx.font = "12px system-ui, sans-serif";
    ctx.strokeStyle = "#e2e2e2";
    ctx.fillStyle = "#777";
    [-2, -1, 0, 1].forEach((tick) => {
      const px = x(tick);
      ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, top + plotHeight); ctx.stroke();
      ctx.fillText(String(tick), px - 7, height - 20);
    });
    [1, 2, 3, 4].forEach((tick) => {
      const py = top + (1 - tick / yMax) * plotHeight;
      ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(left + plotWidth, py); ctx.stroke();
      ctx.fillText(String(tick), 30, py + 4);
    });
    ctx.fillText("rho (radiation-normalized effect)", 202, height - 4);
    ctx.save(); ctx.translate(12, 218); ctx.rotate(-Math.PI / 2); ctx.fillText("−log10 p", 0, 0); ctx.restore();

    genes.forEach((gene, index) => {
      if (!gene.rhoHit && index % 7 !== 0) return;
      ctx.beginPath();
      ctx.arc(x(gene.rho), y(gene.rhoP), candidateNames.has(gene.gene) ? 3.2 : 1.8, 0, Math.PI * 2);
      ctx.fillStyle = candidateNames.has(gene.gene) ? "#1f7a8c" : gene.rhoHit ? "#8f989a" : "#d9d9d9";
      ctx.fill();
    });
    if (selected && selected.rho !== null) {
      const sx = x(selected.rho);
      const sy = y(selected.rhoP);
      ctx.beginPath(); ctx.arc(sx, sy, 6.5, 0, Math.PI * 2); ctx.strokeStyle = "#171717"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#171717";
      ctx.fillText(selected.gene, Math.min(sx + 9, width - 74), Math.max(sy - 8, 18));
    }
    canvas.setAttribute("aria-label", `${candidates.length} genes pass the current gate. ${selected.gene} has rho ${format(selected.rho, 2)} and p ${format(selected.rhoP, 4)}.`);
  }

  function renderCandidates(candidates) {
    document.getElementById("effect-label").textContent = Number(effect.value).toFixed(2);
    document.getElementById("pass-count").textContent = `${candidates.length} pass`;
    document.getElementById("metric-three").textContent = candidates.length.toLocaleString();
    document.getElementById("metric-three-label").textContent = "pass the current evidence gate";
    candidateList.replaceChildren();
    if (!candidates.length) {
      candidateList.innerHTML = "<p>No author-called hits pass these settings. Relax one gate or inspect a named gene directly.</p>";
      return;
    }
    candidates.slice(0, 10).forEach((gene, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = gene.gene === selected.gene ? "selected" : "";
      button.innerHTML = `<span>${index + 1}. <strong>${escapeHtml(gene.gene)}</strong></span><span>rho ${format(gene.rho, 2)}</span><span>p ${format(gene.rhoP, 4)}</span>`;
      button.addEventListener("click", () => selectGene(gene.gene));
      candidateList.appendChild(button);
    });
  }

  function svgElement(tag, attributes, text) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function drawProfile(gene) {
    profileSvg.replaceChildren();
    const left = 112;
    const width = 458;
    const min = -2.5;
    const max = 1.5;
    const x = (value) => left + ((Math.max(min, Math.min(max, value)) - min) / (max - min)) * width;
    const rows = [
      ["gamma", "untreated growth", gene.gammaR1, gene.gammaR2, gene.gamma],
      ["rho", "radiation-specific", gene.rhoR1, gene.rhoR2, gene.rho],
      ["tau", "growth under RT", gene.tauR1, gene.tauR2, gene.tau],
    ];
    [-2, -1, 0, 1].forEach((tick) => {
      const px = x(tick);
      profileSvg.appendChild(svgElement("line", {x1:px, y1:24, x2:px, y2:190, stroke:tick === 0 ? "#999" : "#e7e7e7", "stroke-width":tick === 0 ? 1.5 : 1}));
      profileSvg.appendChild(svgElement("text", {x:px, y:214, "text-anchor":"middle", class:"axis-text"}, tick));
    });
    rows.forEach((row, index) => {
      const y = 52 + index * 60;
      profileSvg.appendChild(svgElement("text", {x:0, y:y - 5, class:"row-title"}, row[0]));
      profileSvg.appendChild(svgElement("text", {x:0, y:y + 13, class:"axis-text"}, row[1]));
      if ([row[2], row[3], row[4]].some((value) => value === null)) return;
      profileSvg.appendChild(svgElement("line", {x1:x(row[2]), y1:y, x2:x(row[3]), y2:y, stroke:"#87989b", "stroke-width":3}));
      profileSvg.appendChild(svgElement("circle", {cx:x(row[2]), cy:y, r:5, fill:"#fff", stroke:"#1f7a8c", "stroke-width":2}));
      profileSvg.appendChild(svgElement("circle", {cx:x(row[3]), cy:y, r:5, fill:"#fff", stroke:"#1f7a8c", "stroke-width":2}));
      profileSvg.appendChild(svgElement("path", {d:`M ${x(row[4])} ${y - 7} L ${x(row[4]) + 7} ${y} L ${x(row[4])} ${y + 7} L ${x(row[4]) - 7} ${y} Z`, fill:"#1f7a8c"}));
    });
  }

  function classLabel(value) {
    return ({
      rt_dependent: "Human GBM43: RT-dependent",
      rt_independent_clustered: "Human GBM43: RT-independent clustered",
      rt_independent_distributed: "Human GBM43: RT-independent distributed",
    })[value] || "Not among the 30 modeled GBM43 perturbations";
  }

  function renderGene(gene) {
    selected = gene;
    input.value = gene.gene;
    document.getElementById("selected-gene").textContent = gene.gene;
    const badge = document.getElementById("evidence-badge");
    badge.textContent = classLabel(gene.inVivoClass);
    badge.className = `evidence-badge ${gene.inVivoClass === "rt_dependent" ? "high" : ""}`;
    drawProfile(gene);
    const cross = gene.inVivoClass ? `The lab's human GBM43 CED notebook places it in the ${classLabel(gene.inVivoClass).replace("Human GBM43: ", "")} class.` : "It was not among the 30 perturbations modeled in the public human GBM43 notebook.";
    if (gene.rho === null) {
      document.getElementById("target-readout").innerHTML = `<strong>${escapeHtml(gene.gene)}</strong> is present in the human GBM43 CED notebook but has no matching gene-level row in the 2024 mouse GL261 screen table. ${cross} It needs a separate guide and baseline-growth check before entering a payload shortlist.`;
    } else {
      const interpretation = gene.rho < 0 ? "sensitizing" : "protective";
      const baseline = gene.gammaHit ? "It is also an author-called baseline growth hit, so the treatment-specific interpretation is confounded." : "It is not an author-called baseline growth hit, which makes the radiation-specific interpretation cleaner.";
      document.getElementById("target-readout").innerHTML = `<strong>${escapeHtml(gene.gene)}</strong> has a mean rho of ${format(gene.rho, 2)} (${format(gene.rhoR1, 2)} and ${format(gene.rhoR2, 2)} across replicates), a ${interpretation} radiation-normalized phenotype. ${baseline} ${cross}`;
    }
    const guideRecord = document.getElementById("guide-record");
    if (gene.guides.length) {
      guideRecord.innerHTML = `<span class="label-inline">Published GL261 in vivo guide pair</span>${gene.guides.map((guide) => `<code>${escapeHtml(guide.protospacer)}</code>`).join("")}`;
    } else {
      guideRecord.innerHTML = "<span class=\"label-inline\">Published GL261 in vivo guide pair</span><p>No matching Table S2 guide pair for this gene. A new payload would require independent guide design and validation.</p>";
    }
    renderAll();
    renderScreenPlan();
  }

  function selectGene(name) {
    const normalized = String(name).trim();
    const key = normalized.toLowerCase();
    let gene = geneMap.get(key);
    if (!gene) {
      const inVivoClass = Object.entries(data.inVivoClasses).find(([, list]) => list.some((item) => item.toLowerCase() === key));
      if (inVivoClass) {
        gene = {gene:normalized.toUpperCase(), gamma:null, gammaR1:null, gammaR2:null, gammaP:null, rho:null, rhoR1:null, rhoR2:null, rhoP:null, tau:null, tauR1:null, tauR2:null, tauP:null, gammaHit:false, rhoHit:false, tauHit:false, directionConcordant:false, pseudo:false, guides:[], inVivoClass:inVivoClass[0]};
      }
    }
    if (!gene) {
      document.getElementById("target-readout").textContent = `${name} is not in the 10,252-gene table. Check the mouse gene symbol or choose a suggested target.`;
      return;
    }
    renderGene(gene);
  }

  function renderAll() {
    const candidates = getCandidates();
    renderCandidates(candidates);
    drawVolcano(candidates);
  }

  Object.entries(data.inVivoClasses).forEach(([className, classGenes]) => {
    const section = document.createElement("div");
    section.className = "class-row";
    const label = document.createElement("span");
    label.textContent = className.replaceAll("_", " ");
    const buttons = document.createElement("div");
    classGenes.forEach((gene) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = gene;
      button.addEventListener("click", () => selectGene(gene));
      buttons.appendChild(button);
    });
    section.append(label, buttons);
    document.getElementById("class-selector").appendChild(section);
  });

  function renderScreenPlan() {
    const formulations = Number(document.getElementById("formulation-count").value);
    const replicates = Number(document.getElementById("replicate-count").value);
    const target = selected.gene.toUpperCase();
    document.getElementById("formulation-label").textContent = formulations;
    const pooledUnits = formulations + 2;
    const confirmatoryAnimals = 2 * 2 * 2 * replicates;
    const confidence = selected.inVivoClass === "rt_dependent" ? "cross-model priority" : selected.inVivoClass ? "in vivo modeled, but not RT-dependent" : "GL261-only nomination";
    document.getElementById("screen-plan").innerHTML = `
      <ol>
        <li><strong>Stage 1 — formulation delivery:</strong> ${pooledUnits} barcode units (${formulations} candidates + benchmark LNP + payload-free control) carrying the same reporter mRNA. Gate on size/PDI/encapsulation before CED; read IVIS, tissue barcode recovery, and regional distribution.</li>
        <li><strong>Stage 2 — payload validation:</strong> take the top two formulations into ${target} versus non-targeting sgRNA, each ± RT, with ${replicates} biological replicates per arm (${confirmatoryAnimals} animals before any separate survival cohort). Read target engagement, guide capture, IVIS, and a target-specific molecular endpoint.</li>
        <li><strong>Decision:</strong> ${target} is currently a ${confidence}. Advance only if delivery and target engagement pass before interpreting tumor response.</li>
      </ol>`;
    document.getElementById("class-detail").innerHTML = `<strong>${target}</strong>: ${classLabel(selected.inVivoClass)}. ${selected.inVivoClass === "rt_dependent" ? "This is the strongest public cross-model evidence tier for an RT-combination payload." : "Keep the formulation test exploratory until human-model target engagement is shown."}`;
  }

  function renderBenchmark() {
    const site = document.getElementById("brain-site").value;
    const floor = Number(document.getElementById("editing-floor").value);
    const values = data.brainBenchmarks[site];
    document.getElementById("editing-label").textContent = `${floor}%`;
    const status = values.editing >= floor ? "meets" : "misses";
    document.getElementById("benchmark-bars").innerHTML = `
      <div><span>Reporter transfection</span><span class="bar"><i style="width:${values.reporter / 60 * 100}%"></i></span><strong>${values.reporter}%</strong></div>
      <div><span>Cas9 + sgRNA editing</span><span class="bar"><i style="width:${values.editing / 60 * 100}%"></i></span><strong>${values.editing}%</strong></div>
      <p>The reported ${site} editing fraction <strong>${status}</strong> the ${floor}% example gate. ${status === "meets" ? "Proceed to target-engagement QC before efficacy." : "Return to formulation or payload optimization; do not call the target inactive."}</p>`;
  }

  form.addEventListener("submit", (event) => { event.preventDefault(); selectGene(input.value); });
  input.addEventListener("change", () => selectGene(input.value));
  [effect, pValue, direction, concordance, excludeGrowth, excludePseudo].forEach((control) => control.addEventListener("input", renderAll));
  document.getElementById("formulation-count").addEventListener("input", renderScreenPlan);
  document.getElementById("replicate-count").addEventListener("change", renderScreenPlan);
  document.getElementById("brain-site").addEventListener("change", renderBenchmark);
  document.getElementById("editing-floor").addEventListener("input", renderBenchmark);

  document.getElementById("metric-one").textContent = data.summary.geneCount.toLocaleString();
  document.getElementById("metric-two").textContent = data.summary.rhoHitCount.toLocaleString();
  renderGene(selected);
  renderBenchmark();
}());
