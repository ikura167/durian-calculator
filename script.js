/**
 * Durian Revenue Calculator - Script Logic
 */

// --- CONSTANTS & DEFAULT SETTINGS ---
const DEFAULT_SETTINGS = {
  prices: {
    THAI: { A: 72000, B: 52000, CD: 34000, KEM: 17000 },
    RI6: { A: 38000, B: 19000, CD: 16000, KEM: 7000 },
  },
  ratios: {
    groupAB: { A: 70, B: 30 },
    groupCDKem: { CD: 80, KEM: 20 },
  },
  costs: {
    catRotGoc: 1500,
    lenXe: 1500,
    vanChuyen: 2000,
  },
  discountFaulty: 10000,
  maxHistory: 20,
};

const STORAGE_KEY_SETTINGS = "durian_calc_settings";
const STORAGE_KEY_HISTORY = "durian_calc_history";

// Active configuration state
let currentSettings = {};
let calcHistory = [];

// Track active view state (are we viewing a history record or a fresh calculation)
let currentCalculationRecord = null;

// --- DOM ELEMENTS ---
// Settings elements
const settingsSection = document.getElementById("settings-section");
const btnToggleSettings = document.getElementById("btn-toggle-settings");
const btnToggleResults = document.getElementById("btn-toggle-results");
const settingsBody = document.getElementById("settings-body");
const resultsBody = document.getElementById("results-body");
const btnSaveSettings = document.getElementById("btn-save-settings");
const btnResetSettings = document.getElementById("btn-reset-settings");

// Settings input fields
const inThaiA = document.getElementById("price-thai-A");
const inThaiB = document.getElementById("price-thai-B");
const inThaiCD = document.getElementById("price-thai-CD");
const inThaiKEM = document.getElementById("price-thai-KEM");
const inRi6A = document.getElementById("price-ri6-A");
const inRi6B = document.getElementById("price-ri6-B");
const inRi6CD = document.getElementById("price-ri6-CD");
const inRi6KEM = document.getElementById("price-ri6-KEM");

const inRatioABA = document.getElementById("ratio-groupAB-A");
const inRatioABB = document.getElementById("ratio-groupAB-B");
const inRatioCDCD = document.getElementById("ratio-groupCDKem-CD");
const inRatioCDKEM = document.getElementById("ratio-groupCDKem-KEM");

const inCostCatGoc = document.getElementById("cost-cat-goc");
const inCostLenXe = document.getElementById("cost-len-xe");
const inCostVanChuyen = document.getElementById("cost-van-chuyen");
const displaySettingTotalCost = document.getElementById(
  "setting-total-cost-display",
);
const inDiscountFaulty = document.getElementById("const-discount-faulty");
const inMaxHistory = document.getElementById("const-max-history");

// Form input elements
const calcForm = document.getElementById("calc-form");
const inputTotalWeight = document.getElementById("input-total-weight");
const inputRealPrice = document.getElementById("input-real-price");
const ratioOptions = document.getElementsByName("garden-ratio-opt");
const customRatioContainer = document.getElementById("custom-ratio-container");
const inputCustomRatio = document.getElementById("input-custom-ratio");

// Results elements
const resultsSection = document.getElementById("results-section");
const displayCalcTime = document.getElementById("display-calc-time");
const resultsTableBody = document.getElementById("results-table-body");
const displayTotalWeight = document.getElementById("total-weight-display");
const displayTotalRevenue = document.getElementById("total-revenue-display");

const costDetailCatGoc = document.getElementById("cost-detail-catgoc");
const costDetailLenXe = document.getElementById("cost-detail-lenxe");
const costDetailVanChuyen = document.getElementById("cost-detail-vanchuyen");
const displayCostPerKg = document.getElementById("cost-per-kg-display");
const displayTotalCost = document.getElementById("total-cost-display");

const displayNetRevenue = document.getElementById("net-revenue-display");
const displayBreakevenPriceKg = document.getElementById(
  "breakeven-price-kg-display",
);
const displayFaultyPriceKg = document.getElementById("faulty-price-kg-display");
const displayErrorDiscountLabel = document.getElementById(
  "error-discount-label",
);
const displayProfitLossBadge = document.getElementById("profit-loss-badge");
const displayProfitLossText = document.getElementById("profit-loss-text");
const btnCopyText = document.getElementById("btn-copy-text");

// History elements
const historyEmptyState = document.getElementById("history-empty-state");
const historyTimeline = document.getElementById("history-timeline");
const btnClearHistory = document.getElementById("btn-clear-history");
const historyPagination = document.getElementById("history-pagination");
const btnPrevPage = document.getElementById("btn-prev-page");
const btnNextPage = document.getElementById("btn-next-page");
const displayPageInfo = document.getElementById("display-page-info");

let currentPage = 1;
const ITEMS_PER_PAGE = 5;

// Toast element
const toast = document.getElementById("toast");

// --- INIT APP ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Init Settings
  initSettings();

  // 2. Set Up Event Listeners
  initEventListeners();

  // 3. Init History
  initHistory();

  // 4. Force calculate cost/kg realtime in settings
  updateSettingsCostDisplay();
});

// --- SETTINGS MANAGEMENT ---
function initSettings() {
  const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (saved) {
    try {
      currentSettings = JSON.parse(saved);
      // Default collapse if we have saved settings
      collapseSettings();
    } catch (e) {
      console.error("Error parsing settings, fallback to default", e);
      currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      expandSettings();
    }
  } else {
    currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    expandSettings(); // Keep open for first time
  }

  populateSettingsInputs(currentSettings);
}

function populateSettingsInputs(settings) {
  inThaiA.value = settings.prices.THAI.A;
  inThaiB.value = settings.prices.THAI.B;
  inThaiCD.value = settings.prices.THAI.CD;
  inThaiKEM.value = settings.prices.THAI.KEM;

  inRi6A.value = settings.prices.RI6.A;
  inRi6B.value = settings.prices.RI6.B;
  inRi6CD.value = settings.prices.RI6.CD;
  inRi6KEM.value = settings.prices.RI6.KEM;

  inRatioABA.value = settings.ratios.groupAB.A;
  inRatioABB.value = settings.ratios.groupAB.B;
  inRatioCDCD.value = settings.ratios.groupCDKem.CD;
  inRatioCDKEM.value = settings.ratios.groupCDKem.KEM;

  inCostCatGoc.value = settings.costs.catRotGoc;
  inCostLenXe.value = settings.costs.lenXe;
  inCostVanChuyen.value = settings.costs.vanChuyen;
  inDiscountFaulty.value = settings.discountFaulty;
  inMaxHistory.value =
    settings.maxHistory !== undefined ? settings.maxHistory : 20;
}

function updateSettingsCostDisplay() {
  const total =
    Number(inCostCatGoc.value || 0) +
    Number(inCostLenXe.value || 0) +
    Number(inCostVanChuyen.value || 0);
  displaySettingTotalCost.textContent = formatCurrency(total);
}

function autoBalancePair(inputA, inputB) {
  function clamp(val) {
    val = Number(val || 0);
    if (isNaN(val)) val = 0;
    return Math.min(100, Math.max(0, val));
  }

  inputA.addEventListener("input", () => {
    const valA = clamp(inputA.value);
    inputA.value = valA;
    inputB.value = 100 - valA;
  });

  inputB.addEventListener("input", () => {
    const valB = clamp(inputB.value);
    inputB.value = valB;
    inputA.value = 100 - valB;
  });
}

function saveSettings() {
  const sumAB = Number(inRatioABA.value || 0) + Number(inRatioABB.value || 0);
  const sumCDK =
    Number(inRatioCDCD.value || 0) + Number(inRatioCDKEM.value || 0);

  if (sumAB !== 100 || sumCDK !== 100) {
    alert(
      "Cảnh báo: Tỉ lệ phần trăm phân chia trong các nhóm đang không bằng 100%! Vui lòng kiểm tra lại để kết quả tính chính xác nhất.",
    );
  }

  currentSettings = {
    prices: {
      THAI: {
        A: Number(inThaiA.value || 0),
        B: Number(inThaiB.value || 0),
        CD: Number(inThaiCD.value || 0),
        KEM: Number(inThaiKEM.value || 0),
      },
      RI6: {
        A: Number(inRi6A.value || 0),
        B: Number(inRi6B.value || 0),
        CD: Number(inRi6CD.value || 0),
        KEM: Number(inRi6KEM.value || 0),
      },
    },
    ratios: {
      groupAB: {
        A: Number(inRatioABA.value || 0),
        B: Number(inRatioABB.value || 0),
      },
      groupCDKem: {
        CD: Number(inRatioCDCD.value || 0),
        KEM: Number(inRatioCDKEM.value || 0),
      },
    },
    costs: {
      catRotGoc: Number(inCostCatGoc.value || 0),
      lenXe: Number(inCostLenXe.value || 0),
      vanChuyen: Number(inCostVanChuyen.value || 0),
    },
    discountFaulty: Number(inDiscountFaulty.value || 0),
    maxHistory: Number(inMaxHistory.value || 20),
  };

  const maxHistVal = currentSettings.maxHistory;
  if (maxHistVal < 1 || maxHistVal > 500) {
    alert("Số lịch sử giữ lại tối đa phải nằm trong khoảng từ 1 đến 500.");
    inMaxHistory.focus();
    return;
  }

  saveDataToLocalStorage(STORAGE_KEY_SETTINGS, currentSettings);
  showToast("💾 Đã lưu cài đặt thành công!");

  // Automatically recalculate if a calculation is already displayed
  if (currentCalculationRecord && !currentCalculationRecord.isHistorical) {
    calculateCurrent();
  }
}

function resetSettings() {
  if (
    confirm(
      "Bạn có chắc chắn muốn khôi phục toàn bộ cài đặt về giá trị mặc định ban đầu?",
    )
  ) {
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    populateSettingsInputs(currentSettings);
    updateSettingsCostDisplay();
    showToast("↩️ Đã khôi phục cài đặt mặc định!");
  }
}

// Collapsible Toggle Functions
function collapseSettings() {
  settingsBody.style.maxHeight = "0px";
  settingsBody.style.opacity = "0";
  settingsBody.style.padding = "0px 20px";
  btnToggleSettings.setAttribute("aria-expanded", "false");
  btnToggleSettings.querySelector(".toggle-icon").textContent = "▲";
}

function expandSettings() {
  settingsBody.style.maxHeight = "unset"; // sufficiently large
  settingsBody.style.opacity = "1";
  settingsBody.style.padding = "20px";
  btnToggleSettings.setAttribute("aria-expanded", "true");
  btnToggleSettings.querySelector(".toggle-icon").textContent = "▼";
}

function collapseResults() {
  resultsBody.style.maxHeight = "0px";
  resultsBody.style.opacity = "0";
  resultsBody.style.padding = "0px 20px";
  btnToggleResults.setAttribute("aria-expanded", "false");
  btnToggleResults.querySelector(".toggle-icon").textContent = "▲";
}

function expandResults() {
  resultsBody.style.maxHeight = "1000px"; // sufficiently large
  resultsBody.style.opacity = "1";
  resultsBody.style.padding = "20px";
  btnToggleResults.setAttribute("aria-expanded", "true");
  btnToggleResults.querySelector(".toggle-icon").textContent = "▼";
}

// --- CALCULATION FORM LOGIC ---
function getSelectedGardenRatio() {
  let selectedVal = "0.6";
  for (const option of ratioOptions) {
    if (option.checked) {
      selectedVal = option.value;
      break;
    }
  }

  if (selectedVal === "custom") {
    return Number(inputCustomRatio.value || 0);
  }
  return Number(selectedVal);
}

function getSelectedGardenRatioText() {
  let selectedVal = "0.6";
  let selectedId = "ratio-64";
  for (const option of ratioOptions) {
    if (option.checked) {
      selectedVal = option.value;
      selectedId = option.id;
      break;
    }
  }

  if (selectedVal === "custom") {
    const val = Number(inputCustomRatio.value || 0);
    return `Khác (${val * 100}%)`;
  }

  if (selectedId === "ratio-64") return "6/4";
  if (selectedId === "ratio-73") return "7/3";
  if (selectedId === "ratio-82") return "8/2";
  return selectedVal;
}

function calculateCurrent() {
  // 1. Validate Form Inputs
  if (!calcForm.checkValidity()) {
    calcForm.reportValidity();
    return;
  }

  const variety = document.querySelector('input[name="variety"]:checked').value;
  const totalWeight = Number(inputTotalWeight.value || 0);
  const realPrice = Number(inputRealPrice.value || 0);

  let ratioType = "0.6";
  for (const option of ratioOptions) {
    if (option.checked) {
      ratioType = option.value;
      break;
    }
  }

  let customRatioVal = null;
  if (ratioType === "custom") {
    customRatioVal = Number(inputCustomRatio.value || 0);
    if (customRatioVal <= 0 || customRatioVal > 1) {
      alert(
        "Vui lòng nhập tỷ lệ vườn là một số thập phân lớn hơn 0 và nhỏ hơn hoặc bằng 1 (Ví dụ: 0.65).",
      );
      inputCustomRatio.focus();
      return;
    }
  }

  if (totalWeight <= 0) {
    alert("Tổng lượng hàng phải lớn hơn 0.");
    inputTotalWeight.focus();
    return;
  }

  if (realPrice < 0) {
    alert("Giá mua thực tế không thể âm.");
    inputRealPrice.focus();
    return;
  }

  const tyLeVuon = ratioType === "custom" ? customRatioVal : Number(ratioType);

  // 2. Perform Math Calculations
  // Retrieve prices from currently active settings
  const activePrices = currentSettings.prices[variety];
  const activeRatios = currentSettings.ratios;
  const activeCosts = currentSettings.costs;

  // Weights (Tons)
  const KL_A = (activeRatios.groupAB.A / 100) * tyLeVuon * totalWeight;
  const KL_B = (activeRatios.groupAB.B / 100) * tyLeVuon * totalWeight;
  const KL_CD =
    (activeRatios.groupCDKem.CD / 100) * (1 - tyLeVuon) * totalWeight;
  const KL_Kem =
    (activeRatios.groupCDKem.KEM / 100) * (1 - tyLeVuon) * totalWeight;

  // Revenues (VNĐ)
  const ThanhTien_A = activePrices.A * KL_A * 1000;
  const ThanhTien_B = activePrices.B * KL_B * 1000;
  const ThanhTien_CD = activePrices.CD * KL_CD * 1000;
  const ThanhTien_Kem = activePrices.KEM * KL_Kem * 1000;

  const TongDoanhThu = ThanhTien_A + ThanhTien_B + ThanhTien_CD + ThanhTien_Kem;

  // Costs
  const CatRotGoc = activeCosts.catRotGoc;
  const LenXe = activeCosts.lenXe;
  const VanChuyenRaKho = activeCosts.vanChuyen;

  const TongChiPhiTrenKg = CatRotGoc + LenXe + VanChuyenRaKho;
  const TongChiPhiLoHang = TongChiPhiTrenKg * totalWeight * 1000;

  // Financial Results
  const GiaGocHueVonLoHang = TongDoanhThu - TongChiPhiLoHang;
  const GiaGocHueVonTrenKg = GiaGocHueVonLoHang / (totalWeight * 1000);
  const GiaNeuHangLoi = GiaGocHueVonTrenKg - currentSettings.discountFaulty;
  const LaiLo = (GiaGocHueVonTrenKg - realPrice) * (totalWeight * 1000);

  // Timestamp
  const now = new Date();
  const timestamp = now.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // 3. Create calculation record object
  const newRecord = {
    id: Date.now().toString(),
    timestamp: timestamp,
    rawDate: now.toISOString(),
    inputs: {
      variety: variety,
      totalWeight: totalWeight,
      ratioType: ratioType,
      customRatioVal: customRatioVal,
      realPrice: realPrice,
    },
    results: {
      weights: { A: KL_A, B: KL_B, CD: KL_CD, KEM: KL_Kem },
      prices: {
        A: activePrices.A,
        B: activePrices.B,
        CD: activePrices.CD,
        KEM: activePrices.KEM,
      },
      revenues: {
        A: ThanhTien_A,
        B: ThanhTien_B,
        CD: ThanhTien_CD,
        KEM: ThanhTien_Kem,
      },
      totalRevenue: TongDoanhThu,
      costsDetail: {
        catRotGoc: CatRotGoc * totalWeight * 1000,
        lenXe: LenXe * totalWeight * 1000,
        vanChuyen: VanChuyenRaKho * totalWeight * 1000,
      },
      totalCost: TongChiPhiLoHang,
      costPerKg: TongChiPhiTrenKg,
      netRevenue: GiaGocHueVonLoHang,
      breakevenPerKg: GiaGocHueVonTrenKg,
      faultyPerKg: GiaNeuHangLoi,
      profit: LaiLo,
      discountFaultyUsed: currentSettings.discountFaulty,
    },
    isHistorical: false, // This was generated dynamically right now
  };

  currentCalculationRecord = newRecord;

  // 4. Render Results to UI
  renderResults(newRecord);

  // 5. Save to History List
  saveToHistory(newRecord);

  // 6. Scroll smoothly to results on mobile
  resultsSection.scrollIntoView({ behavior: "smooth" });
}

function renderResults(record) {
  // Show results card container
  resultsSection.style.display = "block";

  const isHistorical = record.isHistorical;
  displayCalcTime.innerHTML = `Thời gian tính toán: <strong class="color-primary">${record.timestamp}</strong> ${isHistorical ? "<em>(Xem lại từ lịch sử)</em>" : ""}`;

  // Variety name for presentation
  const varietyName = record.inputs.variety === "THAI" ? "THÁI (DONA)" : "RI6";

  // Render revenue table body
  const w = record.results.weights;
  const p = record.results.prices;
  const rev = record.results.revenues;

  resultsTableBody.innerHTML = `
        <tr>
            <td class="type-label">Hàng A</td>
            <td class="text-right">${formatWeight(w.A)}</td>
            <td class="text-right">${formatNumberOnly(p.A)}</td>
            <td class="text-right font-weight-medium">${formatCurrency(rev.A)}</td>
        </tr>
        <tr>
            <td class="type-label">Hàng B</td>
            <td class="text-right">${formatWeight(w.B)}</td>
            <td class="text-right">${formatNumberOnly(p.B)}</td>
            <td class="text-right font-weight-medium">${formatCurrency(rev.B)}</td>
        </tr>
        <tr>
            <td class="type-label">Hàng C;D (Dạt)</td>
            <td class="text-right">${formatWeight(w.CD)}</td>
            <td class="text-right">${formatNumberOnly(p.CD)}</td>
            <td class="text-right font-weight-medium">${formatCurrency(rev.CD)}</td>
        </tr>
        <tr>
            <td class="type-label">Hàng Kem</td>
            <td class="text-right">${formatWeight(w.KEM)}</td>
            <td class="text-right">${formatNumberOnly(p.KEM)}</td>
            <td class="text-right font-weight-medium">${formatCurrency(rev.KEM)}</td>
        </tr>
    `;

  // Table footer total
  displayTotalWeight.textContent = formatWeight(record.inputs.totalWeight);
  displayTotalRevenue.textContent = formatCurrency(record.results.totalRevenue);

  // Costs Section
  costDetailCatGoc.textContent = formatCurrency(
    record.results.costsDetail?.catRotGoc ||
      (record.results.costPerKg * record.inputs.totalWeight * 1000) / 3,
  ); // Fallback if old history doesn't have details
  costDetailLenXe.textContent = formatCurrency(
    record.results.costsDetail?.lenXe ||
      (record.results.costPerKg * record.inputs.totalWeight * 1000) / 3,
  );
  costDetailVanChuyen.textContent = formatCurrency(
    record.results.costsDetail?.vanChuyen ||
      (record.results.costPerKg * record.inputs.totalWeight * 1000) / 3,
  );
  displayCostPerKg.textContent = `${formatNumberOnly(record.results.costPerKg)}đ/kg`;
  displayTotalCost.textContent = formatCurrency(record.results.totalCost);

  // Financial Summary Panel
  displayNetRevenue.textContent = formatCurrency(record.results.netRevenue);
  displayBreakevenPriceKg.textContent = `${formatNumberOnly(record.results.breakevenPerKg)}đ/kg`;

  const disc = record.results.discountFaultyUsed || 10000;
  displayErrorDiscountLabel.textContent = formatNumberOnly(disc);
  displayFaultyPriceKg.textContent = `${formatNumberOnly(record.results.faultyPerKg)}đ/kg`;

  // Profit/Loss Badge Styling
  const profit = record.results.profit;
  displayProfitLossBadge.className = "badge text-center";

  if (profit > 0) {
    displayProfitLossBadge.classList.add("badge-profit");
    displayProfitLossText.innerHTML = `🟢 LÃI: +${formatCurrency(profit)}`;
  } else if (profit < 0) {
    displayProfitLossBadge.classList.add("badge-loss");
    displayProfitLossText.innerHTML = `🔴 LỖ: ${formatCurrency(profit)}`;
  } else {
    displayProfitLossBadge.classList.add("badge-even");
    displayProfitLossText.innerHTML = `🟡 HÒA VỐN: 0đ`;
  }
}

// --- HISTORY LOGIC ---
function initHistory() {
  const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
  if (saved) {
    try {
      calcHistory = JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing calculation history", e);
      calcHistory = [];
    }
  }

  updateHistoryUI();

  // Load the most recent record into results on page load
  if (calcHistory.length > 0) {
    const latest = calcHistory[0];
    // Mark it as historical to display the correct label
    const viewRecord = JSON.parse(JSON.stringify(latest));
    viewRecord.isHistorical = true;

    currentCalculationRecord = viewRecord;

    // Restore values into the inputs
    restoreInputs(latest.inputs);
    // Render the results
    renderResults(viewRecord);
  }
}

// Helper for safe localStorage write with quota exceed cleanup
function saveDataToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Error writing to localStorage:", e);
    if (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014) {
      if (key === STORAGE_KEY_HISTORY && calcHistory.length > 1) {
        // FIFO cleanup - remove oldest half of history
        const keepCount = Math.max(1, Math.floor(calcHistory.length / 2));
        calcHistory = calcHistory.slice(0, keepCount);
        showToast("⚠️ Bộ nhớ trình duyệt đầy! Đã tự động xóa lịch sử cũ.");
        // Retry save
        return saveDataToLocalStorage(key, calcHistory);
      }
    }
    alert(
      "Không thể ghi dữ liệu: Bộ nhớ trình duyệt đầy hoặc không được cấp quyền.",
    );
    return false;
  }
}

function saveToHistory(record) {
  // Add to top of history array
  calcHistory.unshift(record);

  // Limit history records (FIFO) - max 500
  const maxHistoryLimit =
    currentSettings.maxHistory !== undefined ? currentSettings.maxHistory : 20;
  if (calcHistory.length > maxHistoryLimit) {
    calcHistory = calcHistory.slice(0, maxHistoryLimit);
  }

  // Reset to first page when new calculation is added
  currentPage = 1;

  // Keep clean (save to storage)
  saveDataToLocalStorage(STORAGE_KEY_HISTORY, calcHistory);

  updateHistoryUI();
}

function deleteHistoryItem(id, event) {
  // Prevent event from bubbling and launching item restore
  if (event) {
    event.stopPropagation();
  }

  if (confirm("Bạn có chắc chắn muốn xóa bản ghi lịch sử này?")) {
    calcHistory = calcHistory.filter((item) => item.id !== id);
    saveDataToLocalStorage(STORAGE_KEY_HISTORY, calcHistory);

    // Recalculate total pages and adjust current page if necessary
    const totalPages = Math.ceil(calcHistory.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) {
      currentPage = Math.max(1, totalPages);
    }

    updateHistoryUI();
    showToast("🗑️ Đã xóa bản ghi!");

    // If we deleted the active record, hide results or load the next available
    if (currentCalculationRecord && currentCalculationRecord.id === id) {
      if (calcHistory.length > 0) {
        const latest = calcHistory[0];
        const viewRecord = JSON.parse(JSON.stringify(latest));
        viewRecord.isHistorical = true;
        currentCalculationRecord = viewRecord;
        restoreInputs(latest.inputs);
        renderResults(viewRecord);
      } else {
        resultsSection.style.display = "none";
        currentCalculationRecord = null;
      }
    }
  }
}

function clearAllHistory() {
  if (
    confirm(
      "Cảnh báo! Bạn có chắc muốn xóa TOÀN BỘ lịch sử tính toán? Hành động này không thể hoàn tác.",
    )
  ) {
    calcHistory = [];
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    currentPage = 1;
    updateHistoryUI();
    resultsSection.style.display = "none";
    currentCalculationRecord = null;
    showToast("🗑️ Đã xóa toàn bộ lịch sử!");
  }
}

function restoreFromHistory(id) {
  const record = calcHistory.find((item) => item.id === id);
  if (!record) return;

  // Mark as historical for display label
  const viewRecord = JSON.parse(JSON.stringify(record));
  viewRecord.isHistorical = true;
  currentCalculationRecord = viewRecord;

  // Restore inputs to form
  restoreInputs(record.inputs);

  // Render results
  renderResults(viewRecord);

  showToast("📋 Đã tải kết quả từ lịch sử!");

  // Scroll to results section
  resultsSection.scrollIntoView({ behavior: "smooth" });
}

function restoreInputs(inputs) {
  // Variety
  if (inputs.variety === "THAI") {
    document.getElementById("variety-thai").checked = true;
  } else {
    document.getElementById("variety-ri6").checked = true;
  }

  // Total Weight
  inputTotalWeight.value = inputs.totalWeight;

  // Garden Ratio Radio Option
  let found = false;
  for (const option of ratioOptions) {
    if (option.value === inputs.ratioType) {
      option.checked = true;
      found = true;
      break;
    }
  }

  if (inputs.ratioType === "custom") {
    document.getElementById("ratio-custom").checked = true;
    customRatioContainer.style.display = "block";
    inputCustomRatio.value = inputs.customRatioVal;
  } else {
    customRatioContainer.style.display = "none";
    inputCustomRatio.value = "";
  }

  // Real Purchase Price
  inputRealPrice.value = inputs.realPrice;
}

function updateHistoryUI() {
  if (calcHistory.length === 0) {
    historyEmptyState.style.display = "block";
    historyTimeline.style.display = "none";
    historyPagination.style.display = "none";
    btnClearHistory.style.display = "none";
    return;
  }

  historyEmptyState.style.display = "none";
  historyTimeline.style.display = "flex";
  btnClearHistory.style.display = "block";

  // Calculate pagination properties
  const totalRecords = calcHistory.length;
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  // Adjust currentPage bounds
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  if (currentPage < 1) {
    currentPage = 1;
  }

  // Get sliced items for current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalRecords);
  const pageItems = calcHistory.slice(startIndex, endIndex);

  // Group page items by date
  const groups = groupHistoryByDate(pageItems);

  historyTimeline.innerHTML = "";

  // Generate markup for grouped timeline
  for (const [dateLabel, items] of Object.entries(groups)) {
    const groupEl = document.createElement("div");
    groupEl.className = "history-day-group";

    const headerEl = document.createElement("div");
    headerEl.className = "history-date-header";
    headerEl.textContent = dateLabel;
    groupEl.appendChild(headerEl);

    items.forEach((item) => {
      const itemEl = document.createElement("div");
      // Class list depends on profit/loss status
      const profit = item.results.profit;
      let statusClass = "history-item-even";
      let badgeText = "0đ";
      let badgeClass = "badge-text-even";

      if (profit > 0) {
        statusClass = "history-item-profit";
        badgeText = `+${formatCurrency(profit)}`;
        badgeClass = "badge-text-profit";
      } else if (profit < 0) {
        statusClass = "history-item-loss";
        badgeText = `${formatCurrency(profit)}`;
        badgeClass = "badge-text-loss";
      }

      itemEl.className = `history-item ${statusClass}`;
      itemEl.setAttribute("onclick", `restoreFromHistory('${item.id}')`);

      // Format input display
      const ratioText = getRatioTextFromRecordInputs(item.inputs);
      const varText = item.inputs.variety === "THAI" ? "THÁI" : "RI6";

      itemEl.innerHTML = `
                <div class="history-item-summary">
                    <div class="history-item-info">
                        <div class="history-item-title">${varText} - ${formatWeight(item.inputs.totalWeight)} Kg (Vườn: ${ratioText})</div>
                        <div class="history-item-meta">🕒 ${item.timestamp.split(" ")[0]} | Giá mua: ${formatNumberOnly(item.inputs.realPrice)}đ/kg</div>
                    </div>
                    <div class="history-item-actions">
                        <span class="history-item-badge ${badgeClass}">${badgeText}</span>
                        <button class="btn-delete-item" onclick="deleteHistoryItem('${item.id}', event)" title="Xóa bản ghi này">🗑️</button>
                    </div>
                </div>
            `;
      groupEl.appendChild(itemEl);
    });

    historyTimeline.appendChild(groupEl);
  }

  // Update pagination bar text and button status
  if (totalPages > 1) {
    historyPagination.style.display = "flex";
    displayPageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;

    btnPrevPage.disabled = currentPage === 1;
    btnNextPage.disabled = currentPage === totalPages;

    btnPrevPage.style.opacity = currentPage === 1 ? "0.5" : "1";
    btnPrevPage.style.pointerEvents = currentPage === 1 ? "none" : "auto";
    btnNextPage.style.opacity = currentPage === totalPages ? "0.5" : "1";
    btnNextPage.style.pointerEvents =
      currentPage === totalPages ? "none" : "auto";
  } else {
    historyPagination.style.display = "none";
  }
}

function getRatioTextFromRecordInputs(inputs) {
  if (inputs.ratioType === "custom") {
    return `${inputs.customRatioVal * 100}%`;
  }
  if (inputs.ratioType === "0.6") return "6/4";
  if (inputs.ratioType === "0.7") return "7/3";
  if (inputs.ratioType === "0.8") return "8/2";
  return inputs.ratioType;
}

// Groups records by "Hôm nay", "Hôm qua", or standard date DD/MM/YYYY
function groupHistoryByDate(historyList) {
  const groups = {};
  const todayStr = getLocalDateString(new Date());

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  historyList.forEach((item) => {
    // Parse date from rawDate
    const itemDate = new Date(item.rawDate);
    const itemDateStr = getLocalDateString(itemDate);

    let groupKey = "";
    if (itemDateStr === todayStr) {
      groupKey = "Hôm nay";
    } else if (itemDateStr === yesterdayStr) {
      groupKey = "Hôm qua";
    } else {
      groupKey = itemDate.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
  });

  return groups;
}

function getLocalDateString(date) {
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}

// --- SHARE TEXT PREPARATION ---
function copyResultsToClipboard(e) {
  e.preventDefault();
  e.stopPropagation();
  if (!currentCalculationRecord) return;
  const rec = currentCalculationRecord;
  const varietyName = rec.inputs.variety === "THAI" ? "THÁI (DONA)" : "RI6";
  const ratioText = getRatioTextFromRecordInputs(rec.inputs);

  const w = rec.results.weights;
  const p = rec.results.prices;
  const rev = rec.results.revenues;

  const plText =
    rec.results.profit > 0
      ? `🟢 LÃI: +${formatCurrency(rec.results.profit)}`
      : rec.results.profit < 0
        ? `🔴 LỖ: ${formatCurrency(rec.results.profit)}`
        : `🟡 HÒA VỐN`;

  const message = `=== BÁO CÁO THU MUA SẦU RIÊNG ===
Thời gian: ${rec.timestamp}
Giống: ${varietyName}
Tổng sản lượng: ${formatWeight(rec.inputs.totalWeight)} Kg
Tỷ lệ vườn: ${ratioText}
Giá mua tại vườn: ${formatNumberOnly(rec.inputs.realPrice)} đ/kg
------------------------------
BÁN KHO DỰ KIẾN:
- Hàng A: ${formatWeight(w.A)} Kg x ${formatNumberOnly(p.A)}đ = ${formatCurrency(rev.A)}
- Hàng B: ${formatWeight(w.B)} Kg x ${formatNumberOnly(p.B)}đ = ${formatCurrency(rev.B)}
- Hàng C,D (Dạt): ${formatWeight(w.CD)} Kg x ${formatNumberOnly(p.CD)}đ = ${formatCurrency(rev.CD)}
- Hàng Kem: ${formatWeight(w.KEM)} Kg x ${formatNumberOnly(p.KEM)}đ = ${formatCurrency(rev.KEM)}
=> TỔNG DOANH THU: ${formatCurrency(rec.results.totalRevenue)}

CHI PHÍ LÔ HÀNG:
- Cắt rớt gốc + Lên xe + Vận chuyển: ${formatNumberOnly(rec.results.costPerKg)}đ/kg
=> Tổng chi phí: ${formatCurrency(rec.results.totalCost)}

HÒA VỐN VÀ LÃI LỖ:
- Tổng thu (đã trừ chi phí): ${formatCurrency(rec.results.netRevenue)}
- Giá gốc hòa vốn: ${formatNumberOnly(rec.results.breakevenPerKg)} đ/kg
- Giá nếu hàng lỗi (giảm ${formatNumberOnly(rec.results.discountFaultyUsed)}đ): ${formatNumberOnly(rec.results.faultyPerKg)} đ/kg

=> KẾT QUẢ: ${plText}
==============================`;

  navigator.clipboard
    .writeText(message)
    .then(() => {
      showToast("📋 Đã sao chép báo cáo vào khay nhớ tạm!");
    })
    .catch((err) => {
      console.error("Cannot copy text to clipboard", err);
      alert("Có lỗi xảy ra khi sao chép kết quả. Vui lòng thử lại.");
    });
}

// --- UTILITIES ---
function formatCurrency(value) {
  return (
    new Intl.NumberFormat("vi-VN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value) + "đ"
  );
}

function formatNumberOnly(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatWeight(value) {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// --- EVENT LISTENERS ---
function initEventListeners() {
  // Settings panel collapsible button
  btnToggleSettings.addEventListener("click", () => {
    const isExpanded =
      btnToggleSettings.getAttribute("aria-expanded") === "true";
    if (isExpanded) {
      collapseSettings();
    } else {
      expandSettings();
    }
  });

  btnToggleResults.addEventListener("click", () => {
    const isExpanded =
      btnToggleResults.getAttribute("aria-expanded") === "true";
    if (isExpanded) {
      collapseResults();
    } else {
      expandResults();
    }
  });

  // Settings inputs dynamic update of total costs
  const costInputs = [inCostCatGoc, inCostLenXe, inCostVanChuyen];
  costInputs.forEach((input) => {
    input.addEventListener("input", updateSettingsCostDisplay);
  });

  // auto balance ratio
  autoBalancePair(inRatioABA, inRatioABB);
  autoBalancePair(inRatioCDCD, inRatioCDKEM);

  // Save settings button
  btnSaveSettings.addEventListener("click", saveSettings);

  // Reset settings button
  btnResetSettings.addEventListener("click", resetSettings);

  // Form Garden Ratio radio buttons
  for (const option of ratioOptions) {
    option.addEventListener("change", (e) => {
      if (e.target.value === "custom") {
        customRatioContainer.style.display = "block";
        inputCustomRatio.setAttribute("required", "required");
        inputCustomRatio.focus();
      } else {
        customRatioContainer.style.display = "none";
        inputCustomRatio.removeAttribute("required");
        inputCustomRatio.value = "";
      }
    });
  }

  // Calculation submit action
  calcForm.addEventListener("submit", (e) => {
    e.preventDefault();
    calculateCurrent();
  });

  // Copy result button
  btnCopyText.addEventListener("click", copyResultsToClipboard);

  // Clear all history button
  btnClearHistory.addEventListener("click", clearAllHistory);

  // Pagination buttons
  btnPrevPage.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      updateHistoryUI();
    }
  });

  btnNextPage.addEventListener("click", () => {
    const totalPages = Math.ceil(calcHistory.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
      currentPage++;
      updateHistoryUI();
    }
  });
}
