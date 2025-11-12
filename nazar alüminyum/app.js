(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function parseNum(value) {
    if (value === null || value === undefined) return 0;
    const normalized = String(value).replace(",", ".").trim();
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  function formatCurrency(n) {
    try {
      return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(n || 0);
    } catch (e) {
      return (n || 0).toFixed(2) + " TL";
    }
  }

  function formatNumber(n, digits = 3) {
    const f = Number.isFinite(n) ? n : 0;
    return f.toLocaleString("tr-TR", { maximumFractionDigits: digits });
  }

  // Tabs
  function setupTabs() {
    $$(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-target");
        $$(".tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        $$(".view").forEach((v) => v.classList.remove("active"));
        if (target) {
          const el = $(target);
          if (el) el.classList.add("active");
          // Update summary when switching
          if (target === "#ozet") updateSummary();
        }
      });
    });
  }

  // CAM calculations - multiple rows
  function computeCamTotals() {
    let toplamM2 = 0;
    let toplamFiyat = 0;
    $$(".cam-item").forEach((row) => {
      const enCm = parseNum(row.querySelector(".cam-en")?.value);
      const boyCm = parseNum(row.querySelector(".cam-boy")?.value);
      const adet = parseNum(row.querySelector(".cam-adet")?.value);
      const birim = parseNum(row.querySelector(".cam-birim")?.value);
      const en = enCm / 100;
      const boy = boyCm / 100;
      const parcaM2 = en * boy;
      const satirToplamM2 = parcaM2 * adet;
      const satirToplam = satirToplamM2 * birim;
      toplamM2 += satirToplamM2;
      toplamFiyat += satirToplam;
    });
    return { toplamM2, toplamFiyat };
  }

  function updateCam() {
    const { toplamM2, toplamFiyat } = computeCamTotals();
    $("#camToplamM2").textContent = formatNumber(toplamM2);
    $("#camToplamFiyat").textContent = formatCurrency(toplamFiyat);
    return { toplamM2, toplamFiyat };
  }

  function addCamRow() {
    const container = $("#camItems");
    const div = document.createElement("div");
    div.className = "item cam-item";
    div.innerHTML = `
      <div class="grid">
        <div class="field">
          <label>En (cm)</label>
          <input class="cam-en" inputmode="decimal" type="number" step="0.1" min="0" placeholder="Örn: 120">
        </div>
        <div class="field">
          <label>Boy (cm)</label>
          <input class="cam-boy" inputmode="decimal" type="number" step="0.1" min="0" placeholder="Örn: 240">
        </div>
      </div>
      <div class="grid">
        <div class="field">
          <label>Adet</label>
          <input class="cam-adet" inputmode="numeric" type="number" step="1" min="0" placeholder="Örn: 5">
        </div>
        <div class="field">
          <label>m² Birim Fiyatı</label>
          <input class="cam-birim" inputmode="decimal" type="number" step="0.01" min="0" placeholder="Örn: 750">
        </div>
      </div>`;
    container.appendChild(div);
  }

  function ensureProfilRowCount(count) {
    const container = $("#profilItems");
    if (!container) return;
    const current = container.querySelectorAll(".profil-item").length;
    for (let i = current; i < count; i++) {
      addProfilRow();
    }
  }

  function copyCamToProfil() {
    const camRows = $$(".cam-item");
    if (camRows.length === 0) return;
    ensureProfilRowCount(camRows.length);
    const profilRows = $$(".profil-item");
    camRows.forEach((camRow, idx) => {
      const profilRow = profilRows[idx];
      if (!profilRow) return;
      const camEn = camRow.querySelector(".cam-en");
      const camBoy = camRow.querySelector(".cam-boy");
      const camAdet = camRow.querySelector(".cam-adet");
      const profilEn = profilRow.querySelector(".profil-en");
      const profilBoy = profilRow.querySelector(".profil-boy");
      const profilAdet = profilRow.querySelector(".profil-adet");
      if (profilEn && camEn) profilEn.value = camEn.value ?? "";
      if (profilBoy && camBoy) profilBoy.value = camBoy.value ?? "";
      if (profilAdet && camAdet) profilAdet.value = camAdet.value ?? "";
    });
    updateProfil();
  }

  function setupCam() {
    $("#camItems").addEventListener("input", updateCam);
    $("#camItems").addEventListener("change", updateCam);
    $("#btnAddCam").addEventListener("click", () => { addCamRow(); updateCam(); });
    const copyBtn = $("#btnCopyCamToProfil");
    if (copyBtn) {
      copyBtn.addEventListener("click", copyCamToProfil);
    }
    updateCam();
  }

  // PROFIL calculations - multiple rows
  function computeProfilTotals() {
    let metraj = 0;
    let toplamFiyat = 0;
    $$(".profil-item").forEach((row) => {
      const enCm = parseNum(row.querySelector(".profil-en")?.value);
      const boyCm = parseNum(row.querySelector(".profil-boy")?.value);
      const adet = parseNum(row.querySelector(".profil-adet")?.value);
      const birim = parseNum(row.querySelector(".profil-birim")?.value);
      const en = enCm / 100;
      const boy = boyCm / 100;
      const satirMetraj = 2 * (en + boy) * adet;
      const satirToplam = satirMetraj * birim;
      metraj += satirMetraj;
      toplamFiyat += satirToplam;
    });
    return { metraj, toplamFiyat };
  }

  function updateProfil() {
    const { metraj, toplamFiyat } = computeProfilTotals();
    $("#profilMetraj").textContent = formatNumber(metraj);
    $("#profilToplamFiyat").textContent = formatCurrency(toplamFiyat);
    return { metraj, toplamFiyat };
  }

  function addProfilRow() {
    const container = $("#profilItems");
    const div = document.createElement("div");
    div.className = "item profil-item";
    div.innerHTML = `
      <div class="grid">
        <div class="field">
          <label>En (cm)</label>
          <input class="profil-en" inputmode="decimal" type="number" step="0.1" min="0" placeholder="Örn: 120">
        </div>
        <div class="field">
          <label>Boy (cm)</label>
          <input class="profil-boy" inputmode="decimal" type="number" step="0.1" min="0" placeholder="Örn: 240">
        </div>
      </div>
      <div class="grid">
        <div class="field">
          <label>Adet</label>
          <input class="profil-adet" inputmode="numeric" type="number" step="1" min="0" placeholder="Örn: 10">
        </div>
        <div class="field">
          <label>Profil Birim Fiyatı (m)</label>
          <input class="profil-birim" inputmode="decimal" type="number" step="0.01" min="0" placeholder="Örn: 45">
        </div>
      </div>`;
    container.appendChild(div);
  }

  function setupProfil() {
    $("#profilItems").addEventListener("input", updateProfil);
    $("#profilItems").addEventListener("change", updateProfil);
    $("#btnAddProfil").addEventListener("click", () => { addProfilRow(); updateProfil(); });
    updateProfil();
  }

  // SUMMARY
  function updateSummary() {
    const cam = updateCam();
    const profil = updateProfil();
    const camToplam = cam.toplamFiyat || 0;
    const profilToplam = profil.toplamFiyat || 0;
    const araToplam = camToplam + profilToplam; // KDV hariç
    const kdv = araToplam * 0.20;
    const genel = araToplam + kdv; // KDV dahil

    $("#ozetCamToplam").textContent = formatCurrency(camToplam);
    $("#ozetProfilToplam").textContent = formatCurrency(profilToplam);
    $("#ozetAraToplam").textContent = formatCurrency(araToplam);
    $("#ozetKdv").textContent = formatCurrency(kdv);
    $("#ozetGenelToplam").textContent = formatCurrency(genel);
    return { camToplam, profilToplam, araToplam, kdv, genel };
  }

  function buildWhatsappMessage() {
    const firma = ($("#camFirma").value || "").trim();

    const camRows = $$(".cam-item").map((row) => ({
      en: parseNum(row.querySelector(".cam-en")?.value),
      boy: parseNum(row.querySelector(".cam-boy")?.value),
      adet: parseNum(row.querySelector(".cam-adet")?.value),
      birim: parseNum(row.querySelector(".cam-birim")?.value),
    }));
    const profilRows = $$(".profil-item").map((row) => ({
      en: parseNum(row.querySelector(".profil-en")?.value),
      boy: parseNum(row.querySelector(".profil-boy")?.value),
      adet: parseNum(row.querySelector(".profil-adet")?.value),
      birim: parseNum(row.querySelector(".profil-birim")?.value),
    }));

    const { toplamM2, toplamFiyat: camToplam } = computeCamTotals();
    const { metraj, toplamFiyat: profilToplam } = computeProfilTotals();

    const araToplam = camToplam + profilToplam;
    const kdv = araToplam * 0.20;
    const genel = araToplam + kdv;

    const lines = [];
    if (firma) lines.push(`Firma: ${firma}`);
    lines.push("— Cam —");
    if (camRows.length === 0) {
      lines.push("(satır yok)");
    } else {
      camRows.forEach((r, idx) => {
        if (!r.en && !r.boy && !r.adet && !r.birim) return;
        lines.push(`#${idx + 1} En: ${r.en} cm, Boy: ${r.boy} cm, Adet: ${r.adet}, m² Birim: ${formatCurrency(r.birim)}`);
      });
      lines.push(`Toplam m²: ${formatNumber(toplamM2)}`);
      lines.push(`Toplam: ${formatCurrency(camToplam)}`);
    }
    lines.push("— Profil —");
    if (profilRows.length === 0) {
      lines.push("(satır yok)");
    } else {
      profilRows.forEach((r, idx) => {
        if (!r.en && !r.boy && !r.adet && !r.birim) return;
        lines.push(`#${idx + 1} En: ${r.en} cm, Boy: ${r.boy} cm, Adet: ${r.adet}, Birim: ${formatCurrency(r.birim)}`);
      });
      lines.push(`Metraj: ${formatNumber(metraj)} m`);
      lines.push(`Toplam: ${formatCurrency(profilToplam)}`);
    }
    lines.push("— Genel —");
    lines.push(`Ara Toplam (KDV hariç): ${formatCurrency(araToplam)}`);
    lines.push(`KDV (%20): ${formatCurrency(kdv)}`);
    lines.push(`Genel Toplam (KDV dahil): ${formatCurrency(genel)}`);

    return lines.join("\n");
  }

  function buildWhatsappTotalMessage() {
    const firma = ($("#camFirma").value || "").trim();
    const { toplamFiyat: camToplam } = computeCamTotals();
    const { toplamFiyat: profilToplam } = computeProfilTotals();
    const araToplam = camToplam + profilToplam;
    const kdv = araToplam * 0.20;
    const genel = araToplam + kdv;
    const lines = [];
    if (firma) lines.push(`Firma: ${firma}`);
    lines.push(`Genel Toplam (KDV dahil): ${formatCurrency(genel)}`);
    return lines.join("\n");
  }

  function setupWhatsapp() {
    const btnFull = $("#btnWhatsappFull");
    const btnTotal = $("#btnWhatsappTotal");
    if (btnFull) {
      btnFull.addEventListener("click", () => {
        const text = buildWhatsappMessage();
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank");
      });
    }
    if (btnTotal) {
      btnTotal.addEventListener("click", () => {
        const text = buildWhatsappTotalMessage();
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank");
      });
    }
  }

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    setupTabs();
    setupCam();
    setupProfil();
    setupWhatsapp();
  });
})();


