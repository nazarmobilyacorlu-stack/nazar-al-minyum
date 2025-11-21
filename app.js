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
    let toplamKar = 0;
    const rows = [];
    $$(".cam-item").forEach((row) => {
      const enCm = parseNum(row.querySelector(".cam-en")?.value);
      const boyCm = parseNum(row.querySelector(".cam-boy")?.value);
      const adet = parseNum(row.querySelector(".cam-adet")?.value);
      const birim = parseNum(row.querySelector(".cam-birim")?.value);
      const girdiBirim = parseNum(row.querySelector(".cam-girdi")?.value);
      const en = enCm / 100;
      const boy = boyCm / 100;
      const parcaM2 = en * boy;
      const satirToplamM2 = parcaM2 * adet;
      const satirToplam = satirToplamM2 * birim;
      const satirMaliyet = satirToplamM2 * girdiBirim;
      const satirKar = satirToplam - satirMaliyet;
      toplamM2 += satirToplamM2;
      toplamFiyat += satirToplam;
      toplamKar += satirKar;
      rows.push({ row, satirToplamM2, satirToplam, satirMaliyet, satirKar });
    });
    return { toplamM2, toplamFiyat, toplamKar, rows };
  }

  function updateCam() {
    const { toplamM2, toplamFiyat, toplamKar, rows } = computeCamTotals();
    rows.forEach(({ row, satirToplam, satirMaliyet, satirKar }) => {
      const toplamEl = row.querySelector(".cam-satir-toplam");
      const maliyetEl = row.querySelector(".cam-satir-maliyet");
      const karEl = row.querySelector(".cam-satir-kar");
      if (toplamEl) toplamEl.textContent = formatCurrency(satirToplam);
      if (maliyetEl) maliyetEl.textContent = formatCurrency(satirMaliyet);
      if (karEl) karEl.textContent = formatCurrency(satirKar);
    });
    $("#camToplamM2").textContent = formatNumber(toplamM2);
    $("#camToplamFiyat").textContent = formatCurrency(toplamFiyat);
    $("#camToplamKar").textContent = formatCurrency(toplamKar);
    return { toplamM2, toplamFiyat, toplamKar };
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
      </div>
      <div class="grid">
        <div class="field">
          <label>Girdi m² Fiyatı</label>
          <input class="cam-girdi" inputmode="decimal" type="number" step="0.01" min="0" placeholder="Örn: 500">
        </div>
      </div>
      <div class="row-stats cam-stats">
        <div><span>Satır Toplam:</span><strong class="cam-satir-toplam">0</strong></div>
        <div><span>Girdi Tutarı:</span><strong class="cam-satir-maliyet">0</strong></div>
        <div class="profit"><span>Kar:</span><strong class="cam-satir-kar">0</strong></div>
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

  // OCR and measurement extraction
  async function processMeasurementImage(file) {
    const statusEl = $("#uploadStatus");
    const btn = $("#btnUploadMeasurements");
    
    if (!file) return;
    
    btn.disabled = true;
    statusEl.style.display = "block";
    statusEl.className = "upload-status processing";
    statusEl.textContent = "Ölçü kağıdı işleniyor... Lütfen bekleyin.";

    try {
      // For PDF files, we'll convert to image first (simplified: only handle images for now)
      if (file.type === "application/pdf") {
        statusEl.className = "upload-status error";
        statusEl.textContent = "PDF desteği yakında eklenecek. Lütfen resim formatı (JPG, PNG) kullanın.";
        btn.disabled = false;
        return;
      }

      // Create image element to process
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      statusEl.textContent = "OCR ile metin çıkarılıyor...";

      // Use Tesseract.js for OCR
      const { data: { text } } = await Tesseract.recognize(img, 'tur+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            statusEl.textContent = `İşleniyor... ${Math.round(m.progress * 100)}%`;
          }
        }
      });

      URL.revokeObjectURL(imageUrl);

      statusEl.textContent = "Ölçüler bulunuyor...";

      // Parse measurements from text
      const measurements = parseMeasurementsFromText(text);
      
      if (measurements.length === 0) {
        statusEl.className = "upload-status error";
        statusEl.textContent = "Ölçü bulunamadı. Lütfen net bir görüntü yükleyin veya manuel girin.";
        btn.disabled = false;
        return;
      }

      // Auto-populate form with extracted measurements
      populateMeasurements(measurements);

      statusEl.className = "upload-status success";
      statusEl.textContent = `✓ ${measurements.length} ölçü başarıyla eklendi!`;
      
      setTimeout(() => {
        statusEl.style.display = "none";
      }, 3000);

      updateCam();

    } catch (error) {
      console.error("OCR Error:", error);
      statusEl.className = "upload-status error";
      statusEl.textContent = "Hata: " + (error.message || "Ölçü kağıdı işlenirken bir sorun oluştu.");
    } finally {
      btn.disabled = false;
    }
  }

  function parseMeasurementsFromText(text) {
    const measurements = [];
    const seen = new Set(); // Track seen measurements to avoid duplicates
    
    // Normalize text: replace common OCR mistakes
    let normalized = text
      .replace(/[|]/g, 'l') // | to l
      .replace(/[O0]/g, '0') // O to 0 in numbers
      .replace(/[Il]/g, '1') // I, l to 1
      .replace(/\s+/g, ' ')
      .toLowerCase();

    // Helper function to create a key for deduplication
    const createKey = (en, boy, adet) => `${Math.round(en)}_${Math.round(boy)}_${adet}`;

    // Helper function to add measurement if valid and not duplicate
    const addMeasurement = (en, boy, adet) => {
      // Validate: En and Boy should be reasonable (10-5000 cm), Adet should be reasonable (1-1000)
      if (en >= 10 && en <= 5000 && boy >= 10 && boy <= 5000 && adet >= 1 && adet <= 1000) {
        const key = createKey(en, boy, adet);
        if (!seen.has(key)) {
          seen.add(key);
          measurements.push({ en, boy, adet });
        }
      }
    };

    // Pattern 1: "En: XXX Boy: XXX Adet: XXX" format
    const pattern1 = /en\s*:?\s*(\d+(?:[,.]?\d+)?)\s*(?:cm|m)?.*?boy\s*:?\s*(\d+(?:[,.]?\d+)?)\s*(?:cm|m)?.*?adet\s*:?\s*(\d+)/gi;
    let match;
    
    while ((match = pattern1.exec(normalized)) !== null) {
      const en = parseFloat(match[1].replace(',', '.'));
      const boy = parseFloat(match[2].replace(',', '.'));
      const adet = parseInt(match[3], 10);
      addMeasurement(en, boy, adet);
    }

    // Pattern 2: "XXXxXXXxXXX" or "XXX X XXX X XXX" format (En x Boy x Adet)
    const pattern2 = /(\d+(?:[,.]?\d+)?)\s*[x×*]\s*(\d+(?:[,.]?\d+)?)\s*[x×*]\s*(\d+)/gi;
    while ((match = pattern2.exec(normalized)) !== null) {
      const en = parseFloat(match[1].replace(',', '.'));
      const boy = parseFloat(match[2].replace(',', '.'));
      const adet = parseInt(match[3], 10);
      addMeasurement(en, boy, adet);
    }

    // Pattern 3: Three consecutive numbers on same line (En Boy Adet)
    const lines = normalized.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const numbers = line.match(/\d+(?:[,.]?\d+)?/g);
      if (numbers && numbers.length >= 3) {
        // Try different combinations: first three, or groups of three
        for (let i = 0; i <= numbers.length - 3; i++) {
          const en = parseFloat(numbers[i].replace(',', '.'));
          const boy = parseFloat(numbers[i + 1].replace(',', '.'));
          const adet = parseInt(numbers[i + 2], 10);
          if (!isNaN(en) && !isNaN(boy) && !isNaN(adet)) {
            addMeasurement(en, boy, adet);
          }
        }
      }
    }

    // Pattern 4: Tab-separated or multiple spaces (En   Boy   Adet)
    for (const line of lines) {
      const parts = line.split(/\s{2,}|\t/).filter(p => p.trim());
      if (parts.length >= 3) {
        const num1 = parseFloat(parts[0].replace(/[^\d,.]/g, '').replace(',', '.'));
        const num2 = parseFloat(parts[1].replace(/[^\d,.]/g, '').replace(',', '.'));
        const num3 = parseInt(parts[2].replace(/[^\d]/g, ''), 10);
        if (!isNaN(num1) && !isNaN(num2) && !isNaN(num3)) {
          addMeasurement(num1, num2, num3);
        }
      }
    }

    return measurements;
  }

  function populateMeasurements(measurements) {
    if (measurements.length === 0) return;

    // Ensure we have enough rows
    const currentRows = $$(".cam-item").length;
    if (measurements.length > currentRows) {
      for (let i = currentRows; i < measurements.length; i++) {
        addCamRow();
      }
    }

    // Populate each row
    const rows = $$(".cam-item");
    measurements.forEach((m, idx) => {
      if (idx >= rows.length) return;
      
      const row = rows[idx];
      const enInput = row.querySelector(".cam-en");
      const boyInput = row.querySelector(".cam-boy");
      const adetInput = row.querySelector(".cam-adet");
      
      if (enInput && m.en) enInput.value = m.en;
      if (boyInput && m.boy) boyInput.value = m.boy;
      if (adetInput && m.adet) adetInput.value = m.adet;
    });
  }

  function setupCam() {
    $("#camItems").addEventListener("input", updateCam);
    $("#camItems").addEventListener("change", updateCam);
    $("#btnAddCam").addEventListener("click", () => { addCamRow(); updateCam(); });
    const copyBtn = $("#btnCopyCamToProfil");
    if (copyBtn) {
      copyBtn.addEventListener("click", copyCamToProfil);
    }
    
    // Setup upload button
    const uploadBtn = $("#btnUploadMeasurements");
    const uploadInput = $("#uploadMeasurements");
    if (uploadBtn && uploadInput) {
      uploadBtn.addEventListener("click", () => {
        uploadInput.click();
      });
      uploadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          processMeasurementImage(file);
          // Reset input to allow re-uploading same file
          uploadInput.value = "";
        }
      });
    }
    
    updateCam();
  }

  // PROFIL calculations - multiple rows
  function computeProfilTotals() {
    let metraj = 0;
    let toplamFiyat = 0;
    let toplamKar = 0;
    const rows = [];
    $$(".profil-item").forEach((row) => {
      const enCm = parseNum(row.querySelector(".profil-en")?.value);
      const boyCm = parseNum(row.querySelector(".profil-boy")?.value);
      const adet = parseNum(row.querySelector(".profil-adet")?.value);
      const birim = parseNum(row.querySelector(".profil-birim")?.value);
      const girdiBirim = parseNum(row.querySelector(".profil-girdi")?.value);
      const en = enCm / 100;
      const boy = boyCm / 100;
      const satirMetraj = 2 * (en + boy) * adet;
      const satirToplam = satirMetraj * birim;
      const satirMaliyet = satirMetraj * girdiBirim;
      const satirKar = satirToplam - satirMaliyet;
      metraj += satirMetraj;
      toplamFiyat += satirToplam;
      toplamKar += satirKar;
      rows.push({ row, satirToplam, satirMaliyet, satirKar });
    });
    return { metraj, toplamFiyat, toplamKar, rows };
  }

  function updateProfil() {
    const { metraj, toplamFiyat, toplamKar, rows } = computeProfilTotals();
    rows.forEach(({ row, satirToplam, satirMaliyet, satirKar }) => {
      const toplamEl = row.querySelector(".profil-satir-toplam");
      const maliyetEl = row.querySelector(".profil-satir-maliyet");
      const karEl = row.querySelector(".profil-satir-kar");
      if (toplamEl) toplamEl.textContent = formatCurrency(satirToplam);
      if (maliyetEl) maliyetEl.textContent = formatCurrency(satirMaliyet);
      if (karEl) karEl.textContent = formatCurrency(satirKar);
    });
    $("#profilMetraj").textContent = formatNumber(metraj);
    $("#profilToplamFiyat").textContent = formatCurrency(toplamFiyat);
    $("#profilToplamKar").textContent = formatCurrency(toplamKar);
    return { metraj, toplamFiyat, toplamKar };
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
      </div>
      <div class="grid">
        <div class="field">
          <label>Girdi Birim Fiyatı (m)</label>
          <input class="profil-girdi" inputmode="decimal" type="number" step="0.01" min="0" placeholder="Örn: 25">
        </div>
      </div>
      <div class="row-stats profil-stats">
        <div><span>Satır Toplam:</span><strong class="profil-satir-toplam">0</strong></div>
        <div><span>Girdi Tutarı:</span><strong class="profil-satir-maliyet">0</strong></div>
        <div class="profit"><span>Kar:</span><strong class="profil-satir-kar">0</strong></div>
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
    const camKar = cam.toplamKar || 0;
    const profilKar = profil.toplamKar || 0;
    const araToplam = camToplam + profilToplam; // KDV hariç
    const kdv = araToplam * 0.20;
    const genel = araToplam + kdv; // KDV dahil

    $("#ozetCamToplam").textContent = formatCurrency(camToplam);
    $("#ozetProfilToplam").textContent = formatCurrency(profilToplam);
    $("#ozetCamKar").textContent = formatCurrency(camKar);
    $("#ozetProfilKar").textContent = formatCurrency(profilKar);
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


