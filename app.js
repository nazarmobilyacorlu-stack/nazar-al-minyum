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

  // CAM calculations
  function updateCam() {
    const enCm = parseNum($("#camEn").value);
    const boyCm = parseNum($("#camBoy").value);
    const adet = parseNum($("#camAdet").value);
    const birim = parseNum($("#camBirimFiyat").value);

    const en = enCm / 100; // convert cm to m
    const boy = boyCm / 100; // convert cm to m
    const parcaM2 = en * boy; // m² of one piece
    const toplamM2 = parcaM2 * adet;
    const toplamFiyat = toplamM2 * birim;

    $("#camM2").textContent = formatNumber(parcaM2);
    $("#camToplamM2").textContent = formatNumber(toplamM2);
    $("#camToplamFiyat").textContent = formatCurrency(toplamFiyat);

    return { parcaM2, toplamM2, toplamFiyat };
  }

  function setupCam() {
    ["#camEn", "#camBoy", "#camAdet", "#camBirimFiyat"].forEach((sel) => {
      $(sel).addEventListener("input", updateCam);
      $(sel).addEventListener("change", updateCam);
    });
    updateCam();
  }

  // PROFIL calculations
  function updateProfil() {
    const enCm = parseNum($("#profilEn").value);
    const boyCm = parseNum($("#profilBoy").value);
    const adet = parseNum($("#profilAdet").value);
    const birim = parseNum($("#profilBirimFiyat").value);

    const en = enCm / 100; // m
    const boy = boyCm / 100; // m
    const metraj = 2 * (en + boy) * adet; // toplam profil uzunluğu (m)
    const toplamFiyat = metraj * birim;

    $("#profilMetraj").textContent = formatNumber(metraj);
    $("#profilToplamFiyat").textContent = formatCurrency(toplamFiyat);

    return { metraj, toplamFiyat };
  }

  function setupProfil() {
    ["#profilEn", "#profilBoy", "#profilAdet", "#profilBirimFiyat"].forEach((sel) => {
      $(sel).addEventListener("input", updateProfil);
      $(sel).addEventListener("change", updateProfil);
    });
    updateProfil();
  }

  // SUMMARY
  function updateSummary() {
    const cam = updateCam();
    const profil = updateProfil();
    const camToplam = cam.toplamFiyat || 0;
    const profilToplam = profil.toplamFiyat || 0;
    const genel = camToplam + profilToplam;

    $("#ozetCamToplam").textContent = formatCurrency(camToplam);
    $("#ozetProfilToplam").textContent = formatCurrency(profilToplam);
    $("#ozetGenelToplam").textContent = formatCurrency(genel);
    return { camToplam, profilToplam, genel };
  }

  function buildWhatsappMessage() {
    const firma = ($("#camFirma").value || "").trim();

    const enCam = parseNum($("#camEn").value);
    const boyCam = parseNum($("#camBoy").value);
    const adetCam = parseNum($("#camAdet").value);
    const birimCam = parseNum($("#camBirimFiyat").value);
    const { parcaM2, toplamM2, toplamFiyat: camToplam } = updateCam();

    const enPr = parseNum($("#profilEn").value);
    const boyPr = parseNum($("#profilBoy").value);
    const adetPr = parseNum($("#profilAdet").value);
    const birimPr = parseNum($("#profilBirimFiyat").value);
    const { metraj, toplamFiyat: profilToplam } = updateProfil();

    const genel = camToplam + profilToplam;

    const lines = [];
    if (firma) lines.push(`Firma: ${firma}`);
    lines.push("— Cam —");
    lines.push(`En: ${enCam} cm, Boy: ${boyCam} cm, Adet: ${adetCam}`);
    lines.push(`Parça m²: ${formatNumber(parcaM2)}, Toplam m²: ${formatNumber(toplamM2)}`);
    lines.push(`m² Birim: ${formatCurrency(birimCam)}, Toplam: ${formatCurrency(camToplam)}`);
    lines.push("— Profil —");
    lines.push(`En: ${enPr} cm, Boy: ${boyPr} cm, Adet: ${adetPr}`);
    lines.push(`Metraj: ${formatNumber(metraj)} m`);
    lines.push(`Birim: ${formatCurrency(birimPr)}, Toplam: ${formatCurrency(profilToplam)}`);
    lines.push("— Genel —");
    lines.push(`Genel Toplam: ${formatCurrency(genel)}`);

    return lines.join("\n");
  }

  function setupWhatsapp() {
    $("#btnWhatsapp").addEventListener("click", () => {
      const text = buildWhatsappMessage();
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    });
  }

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    setupTabs();
    setupCam();
    setupProfil();
    setupWhatsapp();
  });
})();


