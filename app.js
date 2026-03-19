const STORAGE_KEY = "doctor.consultation.records.v1";
const STATUS_FALLBACK = "已完成";
const CHART_DAYS = 7;
const DEMO_RECORD_COUNT = 100;
const SEARCH_RESULT_LIMIT = 8;
const CASE_IMAGE_LIMIT = 6;
const CASE_IMAGE_MAX_EDGE = 1600;
const CASE_IMAGE_JPEG_QUALITY = 0.82;
const DEMO_SURNAMES = ["赵", "钱", "孙", "李", "周", "吴", "郑", "王", "冯", "陈", "褚", "卫", "蒋", "沈", "韩", "杨", "朱", "秦", "尤", "许", "何", "吕", "施", "张", "孔"];
const DEMO_GIVEN_NAMES = ["伟", "敏", "静", "磊", "娜", "洋", "婷", "杰", "丽", "鹏", "艳", "超", "勇", "娟", "涛", "玲"];
const DEMO_SCENARIOS = [
    {
        department: "内科",
        doctors: ["李晓峰", "周明辉", "孙海燕"],
        symptoms: ["发热伴咳嗽 3 天", "头晕乏力反复 1 周", "胃胀反酸，夜间明显"],
        diagnoses: ["上呼吸道感染", "病毒性感冒", "慢性胃炎"],
        notes: ["建议清淡饮食，多饮水", "按时服药，3 天后复诊", "注意休息，观察体温变化"]
    },
    {
        department: "外科",
        doctors: ["王立新", "高晨", "邱志宏"],
        symptoms: ["切口换药复查", "软组织挫伤疼痛", "腰背部牵拉痛"],
        diagnoses: ["术后恢复期", "皮下软组织损伤", "肌肉劳损"],
        notes: ["保持伤口干燥", "减少负重活动", "如疼痛加重及时复诊"]
    },
    {
        department: "儿科",
        doctors: ["陈雨欣", "林子恒", "邓嘉雯"],
        symptoms: ["夜间咳嗽明显", "流涕发热伴食欲差", "腹泻 2 天"],
        diagnoses: ["小儿支气管炎", "急性上呼吸道感染", "小儿肠胃炎"],
        notes: ["家长注意补液", "建议 48 小时内回访", "避免生冷饮食"]
    },
    {
        department: "口腔科",
        doctors: ["刘思远", "严洁", "胡文涛"],
        symptoms: ["牙龈肿痛", "智齿区反复疼痛", "口腔溃疡反复"],
        diagnoses: ["牙龈炎", "智齿冠周炎", "复发性口腔溃疡"],
        notes: ["保持口腔清洁", "避免辛辣刺激", "必要时拍片进一步检查"]
    },
    {
        department: "皮肤科",
        doctors: ["许安琪", "丁凯", "叶婷"],
        symptoms: ["双上肢瘙痒起疹", "面部痤疮反复", "足部脱屑瘙痒"],
        diagnoses: ["过敏性皮炎", "痤疮", "足癣"],
        notes: ["注意皮肤保湿", "避免抓挠", "按疗程外用药物"]
    },
    {
        department: "中医科",
        doctors: ["宋文博", "温雅琴", "贺春雷"],
        symptoms: ["睡眠差，易醒", "颈肩僵硬酸痛", "脾胃虚弱食少"],
        diagnoses: ["肝郁失眠", "颈肩综合征", "脾胃虚弱"],
        notes: ["建议中药调理 5 天", "配合热敷理疗", "饮食规律，少食寒凉"]
    }
];

const state = {
    records: [],
    filters: {
        keyword: "",
        startDate: "",
        endDate: "",
        department: "",
        status: ""
    },
    editingId: null,
    pendingImages: [],
    isProcessingImages: false,
    storageInfo: {
        mode: "browser-localStorage",
        filePath: ""
    },
    pendingToast: null
};

const dom = {
    form: document.getElementById("recordForm"),
    formTitle: document.getElementById("formTitle"),
    formHint: document.getElementById("formHint"),
    submitButton: document.getElementById("submitButton"),
    cancelEditButton: document.getElementById("cancelEditButton"),
    resetFormButton: document.getElementById("resetFormButton"),
    newRecordButton: document.getElementById("newRecordButton"),
    seedDemoButton: document.getElementById("seedDemoButton"),
    searchInput: document.getElementById("searchInput"),
    startDateInput: document.getElementById("startDateInput"),
    endDateInput: document.getElementById("endDateInput"),
    departmentFilter: document.getElementById("departmentFilter"),
    statusFilter: document.getElementById("statusFilter"),
    searchSummaryText: document.getElementById("searchSummaryText"),
    searchTermList: document.getElementById("searchTermList"),
    searchResultChips: document.getElementById("searchResultChips"),
    resetFiltersButton: document.getElementById("resetFiltersButton"),
    statsGrid: document.getElementById("statsGrid"),
    trendChart: document.getElementById("trendChart"),
    trendSummary: document.getElementById("trendSummary"),
    departmentBreakdown: document.getElementById("departmentBreakdown"),
    doctorBreakdown: document.getElementById("doctorBreakdown"),
    statusBreakdown: document.getElementById("statusBreakdown"),
    recordList: document.getElementById("recordList"),
    listSummary: document.getElementById("listSummary"),
    importFile: document.getElementById("importFile"),
    exportJsonButton: document.getElementById("exportJsonButton"),
    exportCsvButton: document.getElementById("exportCsvButton"),
    caseImagesInput: document.getElementById("caseImagesInput"),
    caseImagesSummary: document.getElementById("caseImagesSummary"),
    caseImagesPreview: document.getElementById("caseImagesPreview"),
    toast: document.getElementById("toast")
};

const fieldAliases = {
    id: ["id", "recordId", "编号"],
    name: ["name", "patientName", "姓名"],
    gender: ["gender", "sex", "性别"],
    age: ["age", "年龄"],
    phone: ["phone", "mobile", "telephone", "tel", "联系电话", "电话"],
    visitDate: ["visitDate", "date", "consultationDate", "就诊日期", "日期"],
    department: ["department", "clinic", "dept", "科室"],
    doctor: ["doctor", "physician", "doctorName", "医生", "接诊医生"],
    symptoms: ["symptoms", "complaint", "chiefComplaint", "主诉", "症状", "主诉/症状"],
    diagnosis: ["diagnosis", "initialDiagnosis", "初步诊断", "诊断"],
    fee: ["fee", "amount", "收费金额", "收费"],
    status: ["status", "recordStatus", "状态"],
    followUp: ["followUp", "needFollowUp", "isFollowUp", "是否复诊", "复诊"],
    notes: ["notes", "remark", "memo", "备注"],
    images: ["images", "caseImages", "attachments", "病例图片", "图片", "附件"],
    createdAt: ["createdAt", "创建时间"],
    updatedAt: ["updatedAt", "更新时间"]
};

let toastTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    void initializeApplication();
});

async function initializeApplication() {
    await initializeState();
    render();

    if (state.pendingToast) {
        showToast(state.pendingToast, false);
        state.pendingToast = null;
    }
}

async function initializeState() {
    const { records, hasStoredRecords, storageInfo } = await loadStoredRecords();

    state.records = sortRecords(records);
    state.storageInfo = storageInfo;

    if (!state.records.length && hasDesktopStorageBridge() && !hasStoredRecords) {
        const legacyRecords = sortRecords(loadRecords());

        if (legacyRecords.length) {
            state.records = legacyRecords;

            if (await persistRecords(state.records)) {
                state.pendingToast = state.storageInfo.filePath
                    ? `桌面版数据已迁移到 ${state.storageInfo.filePath}`
                    : "桌面版数据已迁移到本地 JSON 文件。";
            }
        }
    }

    if (!state.records.length && !hasStoredRecords && shouldAutoSeedDemoRecords()) {
        state.records = createDemoRecords(DEMO_RECORD_COUNT);
        await persistRecords(state.records);
    }

    setFormDefaults();
}

function bindEvents() {
    dom.form.addEventListener("submit", handleFormSubmit);
    dom.form.addEventListener("reset", handleFormReset);
    dom.newRecordButton.addEventListener("click", () => {
        resetEditing();
        dom.form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    dom.cancelEditButton.addEventListener("click", resetEditing);
    dom.seedDemoButton.addEventListener("click", handleSeedDemoButton);

    dom.searchInput.addEventListener("input", (event) => {
        state.filters.keyword = event.target.value.trim();
        render();
    });

    dom.startDateInput.addEventListener("change", (event) => {
        state.filters.startDate = normalizeDate(event.target.value);
        render();
    });

    dom.endDateInput.addEventListener("change", (event) => {
        state.filters.endDate = normalizeDate(event.target.value);
        render();
    });

    dom.departmentFilter.addEventListener("change", (event) => {
        state.filters.department = event.target.value;
        render();
    });

    dom.statusFilter.addEventListener("change", (event) => {
        state.filters.status = event.target.value;
        render();
    });

    dom.resetFiltersButton.addEventListener("click", () => resetFilters(true));

    dom.recordList.addEventListener("click", handleRecordAction);
    dom.searchResultChips.addEventListener("click", handleSearchResultAction);
    dom.importFile.addEventListener("change", handleImportFile);
    dom.exportJsonButton.addEventListener("click", exportJson);
    dom.exportCsvButton.addEventListener("click", exportCsv);
    dom.caseImagesInput.addEventListener("change", handleCaseImagesSelected);
    dom.caseImagesPreview.addEventListener("click", handleCaseImagePreviewAction);
}

async function handleSeedDemoButton() {
    if (state.records.length > 0) {
        const confirmed = window.confirm(`将用 ${DEMO_RECORD_COUNT} 条假数据替换当前 ${state.records.length} 条记录，是否继续？`);

        if (!confirmed) {
            return;
        }
    }

    resetEditing();
    resetFilters(false);

    if (await setRecords(createDemoRecords(DEMO_RECORD_COUNT))) {
        showToast(`已填充 ${DEMO_RECORD_COUNT} 条假数据，可直接搜索演示。`, false);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();

    if (state.isProcessingImages) {
        showToast("病例图片仍在处理中，请稍候再保存。", true);
        return;
    }

    if (!dom.form.reportValidity()) {
        return;
    }

    const formData = new FormData(dom.form);
    const validationError = validateFormData(formData);

    if (validationError) {
        if (dom.form.elements[validationError.field]) {
            dom.form.elements[validationError.field].focus();
        }

        showToast(validationError.message, true);
        return;
    }

    const nextRecord = normalizeRecord({
        id: state.editingId,
        name: formData.get("name"),
        gender: formData.get("gender"),
        age: formData.get("age"),
        phone: formData.get("phone"),
        visitDate: formData.get("visitDate"),
        department: formData.get("department"),
        doctor: formData.get("doctor"),
        symptoms: formData.get("symptoms"),
        diagnosis: formData.get("diagnosis"),
        fee: formData.get("fee"),
        status: formData.get("status"),
        followUp: formData.get("followUp") === "on",
        notes: formData.get("notes"),
        images: cloneCaseImages(state.pendingImages)
    }, { fallbackId: state.editingId || createRecordId() });

    if (!nextRecord.name || !nextRecord.visitDate || !nextRecord.department || !nextRecord.doctor || !nextRecord.symptoms || !nextRecord.diagnosis) {
        showToast("请补齐姓名、就诊日期、科室、医生、主诉和诊断信息。", true);
        return;
    }

    if (state.editingId) {
        const existingRecord = state.records.find((item) => item.id === state.editingId);
        const updatedRecord = {
            ...existingRecord,
            ...nextRecord,
            createdAt: existingRecord ? existingRecord.createdAt : nextRecord.createdAt,
            updatedAt: new Date().toISOString()
        };

        if (!await setRecords(state.records.map((item) => (item.id === state.editingId ? updatedRecord : item)))) {
            return;
        }

        showToast("问诊记录已更新。", false);
    } else {
        if (!await setRecords([nextRecord, ...state.records])) {
            return;
        }

        showToast("问诊记录已保存。", false);
    }

    resetEditing();
}

function handleFormReset() {
    window.requestAnimationFrame(() => {
        resetEditing(false);
        setFormDefaults();
    });
}

async function handleRecordAction(event) {
    const button = event.target.closest("[data-action]");

    if (!button) {
        return;
    }

    const { action, recordId } = button.dataset;
    const record = state.records.find((item) => item.id === recordId);

    if (!record) {
        showToast("未找到对应记录。", true);
        return;
    }

    if (action === "edit") {
        populateForm(record);
        dom.form.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }

    if (action === "delete") {
        const confirmed = window.confirm(`确定删除 ${record.name} 的问诊记录吗？`);

        if (!confirmed) {
            return;
        }

        if (!await setRecords(state.records.filter((item) => item.id !== recordId))) {
            return;
        }

        if (state.editingId === recordId) {
            resetEditing();
        }

        showToast("问诊记录已删除。", false);
    }
}

function handleSearchResultAction(event) {
    const button = event.target.closest("[data-record-jump]");

    if (!button) {
        return;
    }

    focusRecordCard(button.dataset.recordJump);
}

function populateForm(record) {
    state.editingId = record.id;
    dom.form.elements.name.value = record.name;
    dom.form.elements.gender.value = record.gender;
    dom.form.elements.age.value = Number.isFinite(record.age) ? record.age : "";
    dom.form.elements.phone.value = record.phone;
    dom.form.elements.visitDate.value = record.visitDate;
    dom.form.elements.department.value = record.department;
    dom.form.elements.doctor.value = record.doctor;
    dom.form.elements.fee.value = formatNumberInput(record.fee);
    dom.form.elements.status.value = record.status;
    dom.form.elements.symptoms.value = record.symptoms;
    dom.form.elements.diagnosis.value = record.diagnosis;
    dom.form.elements.notes.value = record.notes;
    dom.form.elements.followUp.checked = Boolean(record.followUp);
    state.pendingImages = cloneCaseImages(record.images);
    dom.caseImagesInput.value = "";
    renderCaseImageManager();

    dom.formTitle.textContent = "编辑问诊记录";
    dom.formHint.textContent = "修改后会直接覆盖当前记录。";
    dom.submitButton.textContent = "更新记录";
    dom.cancelEditButton.classList.remove("hidden");
}

function resetEditing(shouldResetForm = true) {
    state.editingId = null;
    state.pendingImages = [];
    state.isProcessingImages = false;
    dom.formTitle.textContent = "新增问诊记录";
    dom.formHint.textContent = "填写信息后即可保存到本地浏览器。";
    dom.submitButton.textContent = "保存记录";
    dom.cancelEditButton.classList.add("hidden");
    dom.caseImagesInput.value = "";

    if (shouldResetForm) {
        dom.form.reset();
        setFormDefaults();
    }

    renderCaseImageManager();
}

function setFormDefaults() {
    dom.form.elements.visitDate.value = getTodayDate();
    dom.form.elements.status.value = STATUS_FALLBACK;
    dom.form.elements.followUp.checked = false;
    renderCaseImageManager();
}

function resetFilters(shouldRender = true) {
    state.filters = { keyword: "", startDate: "", endDate: "", department: "", status: "" };
    dom.searchInput.value = "";
    dom.startDateInput.value = "";
    dom.endDateInput.value = "";
    dom.departmentFilter.value = "";
    dom.statusFilter.value = "";

    if (shouldRender) {
        render();
    }
}

async function setRecords(records) {
    const previousRecords = state.records;
    const normalizedRecords = sortRecords(records.map((item) => normalizeRecord(item, { fallbackId: item.id || createRecordId() })));

    state.records = normalizedRecords;

    if (!await persistRecords(state.records)) {
        state.records = previousRecords;
        render();
        return false;
    }

    render();
    return true;
}

async function loadStoredRecords() {
    if (hasDesktopStorageBridge()) {
        try {
            const payload = await window.doctorDesktopStorage.loadRecords();
            const records = Array.isArray(payload && payload.records) ? payload.records : [];

            return {
                records: records.map((item) => normalizeRecord(item, { fallbackId: createRecordId() })),
                hasStoredRecords: Boolean(payload && payload.exists),
                storageInfo: {
                    mode: "desktop-json-file",
                    filePath: normalizeText(payload && payload.filePath)
                }
            };
        } catch (error) {
            console.error("Failed to load desktop records", error);
            showToast("读取桌面数据文件失败，已回退到浏览器本地存储。", true);
        }
    }

    const hasStoredRecords = Boolean(localStorage.getItem(STORAGE_KEY));

    return {
        records: sortRecords(loadRecords()),
        hasStoredRecords,
        storageInfo: {
            mode: "browser-localStorage",
            filePath: ""
        }
    };
}

async function persistRecords(records) {
    if (hasDesktopStorageBridge()) {
        try {
            const result = await window.doctorDesktopStorage.saveRecords(records);
            state.storageInfo = {
                mode: "desktop-json-file",
                filePath: normalizeText(result && result.filePath)
            };
            return true;
        } catch (error) {
            console.error("Failed to save desktop records", error);
            showToast("保存到桌面数据文件失败，请检查文档目录权限。", true);
            return false;
        }
    }

    return saveRecords(records);
}

function hasDesktopStorageBridge() {
    return Boolean(
        window.doctorDesktopStorage
        && typeof window.doctorDesktopStorage.loadRecords === "function"
        && typeof window.doctorDesktopStorage.saveRecords === "function"
    );
}

function render() {
    renderFilterOptions();
    const searchTerms = getSearchTerms();
    const filteredRecords = getFilteredRecords();
    renderSearchInsight(filteredRecords, searchTerms);
    renderStats(filteredRecords);
    renderTrendChart(filteredRecords);
    renderBreakdowns(filteredRecords);
    renderRecordList(filteredRecords, searchTerms);
}

function renderSearchInsight(filteredRecords, searchTerms) {
    if (!searchTerms.length) {
        dom.searchSummaryText.textContent = "支持多个关键词组合搜索，例如：张三 内科 李医生、1380000 或 DEMO-001。";
        dom.searchTermList.innerHTML = ["姓名", "电话", "编号", "科室", "医生", "主诉", "诊断", "备注"]
            .map((label) => `<span class="search-tag">${escapeHtml(label)}</span>`)
            .join("");
        dom.searchResultChips.innerHTML = state.records.slice(0, SEARCH_RESULT_LIMIT).map((record) => `
            <button class="search-chip" type="button" data-record-jump="${escapeHtml(record.id)}">
                <span class="search-chip__title">${escapeHtml(record.name)}</span>
                <span class="search-chip__meta">${escapeHtml(`${record.department} · ${record.doctor} · ${getRecordCode(record.id)}`)}</span>
            </button>
        `).join("");
        return;
    }

    dom.searchSummaryText.textContent = `当前输入 ${searchTerms.length} 个关键词，命中 ${filteredRecords.length} 条记录，支持跨姓名、电话、编号、科室、医生、症状和诊断联合搜索。`;
    dom.searchTermList.innerHTML = searchTerms.map((term) => `<span class="search-tag search-tag--active">${escapeHtml(term)}</span>`).join("");

    if (!filteredRecords.length) {
        dom.searchResultChips.innerHTML = '<p class="search-empty">没有匹配结果，请调整关键词或日期区间。</p>';
        return;
    }

    dom.searchResultChips.innerHTML = filteredRecords.slice(0, SEARCH_RESULT_LIMIT).map((record) => `
        <button class="search-chip search-chip--result" type="button" data-record-jump="${escapeHtml(record.id)}">
            <span class="search-chip__title">${highlightText(record.name, searchTerms)}</span>
            <span class="search-chip__meta">${highlightText(`${record.department} · ${record.doctor} · ${getRecordCode(record.id)}`, searchTerms)}</span>
        </button>
    `).join("");
}

function renderStats(filteredRecords) {
    const totalRecords = state.records.length;
    const today = getTodayDate();
    const todayCount = state.records.filter((item) => item.visitDate === today).length;
    const followUpCount = state.records.filter((item) => item.followUp).length;
    const totalFee = state.records.reduce((sum, item) => sum + item.fee, 0);
    const averageFee = totalRecords ? totalFee / totalRecords : 0;
    const filteredCount = filteredRecords.length;
    const filteredFee = filteredRecords.reduce((sum, item) => sum + item.fee, 0);
    const filteredAverageFee = filteredCount ? filteredFee / filteredCount : 0;
    const followUpRatio = totalRecords ? Math.round((followUpCount / totalRecords) * 100) : 0;

    const cards = [
        {
            label: "总记录数",
            value: String(totalRecords),
            hint: `当前筛选结果 ${filteredCount} 条`,
            accent: "var(--accent)"
        },
        {
            label: "当前筛选收费",
            value: `￥${formatCurrency(filteredFee)}`,
            hint: `${filteredCount} 条，平均每次 ￥${formatCurrency(filteredAverageFee)}`,
            accent: "var(--accent-strong)"
        },
        {
            label: "今日问诊数",
            value: String(todayCount),
            hint: `${today} 录入 ${todayCount} 条`,
            accent: "var(--info)"
        },
        {
            label: "需复诊数",
            value: String(followUpCount),
            hint: `约占全部记录 ${followUpRatio}%`,
            accent: "var(--warm)"
        },
        {
            label: "累计收费",
            value: `￥${formatCurrency(totalFee)}`,
            hint: `平均每次 ￥${formatCurrency(averageFee)}`,
            accent: "var(--danger)"
        }
    ];

    dom.statsGrid.innerHTML = cards.map((card) => `
        <article class="stat-card" style="--stat-accent:${card.accent}">
            <p class="stat-card__label">${card.label}</p>
            <p class="stat-card__value">${card.value}</p>
            <p class="stat-card__hint">${card.hint}</p>
        </article>
    `).join("");
}

function renderTrendChart(filteredRecords) {
    const points = buildChartPoints(filteredRecords, CHART_DAYS);
    const peak = Math.max(...points.map((point) => point.count), 1);
    const totalInRange = points.reduce((sum, point) => sum + point.count, 0);
    const peakPoint = points.reduce((currentPeak, point) => (point.count > currentPeak.count ? point : currentPeak), points[0]);

    dom.trendChart.innerHTML = points.map((point) => {
        const height = Math.max((point.count / peak) * 100, point.count === 0 ? 4 : 10);

        return `
            <div class="trend-bar">
                <span class="trend-bar__value">${point.count}</span>
                <div class="trend-bar__track">
                    <div class="trend-bar__fill" style="height:${height}%"></div>
                </div>
                <span class="trend-bar__label">${escapeHtml(point.label)}</span>
            </div>
        `;
    }).join("");

    dom.trendSummary.innerHTML = `
        <span class="summary-chip">近 ${CHART_DAYS} 天共 ${totalInRange} 条</span>
        <span class="summary-chip">峰值 ${peakPoint.label} ${peakPoint.count} 条</span>
        <span class="summary-chip">当前图表基于筛选结果</span>
    `;
}

function renderBreakdowns(filteredRecords) {
    const departmentStats = buildGroupedStats(filteredRecords, (record) => record.department || "未填写科室");
    const doctorStats = buildGroupedStats(filteredRecords, (record) => record.doctor || "未填写医生");
    const statusStats = buildGroupedStats(filteredRecords, (record) => record.status || STATUS_FALLBACK);
    const statusTotal = filteredRecords.length;

    renderRankingList(dom.departmentBreakdown, departmentStats.slice(0, 5), {
        emptyText: "暂无科室统计数据",
        valueFormatter: (item) => `${item.count} 条`,
        metaFormatter: (item) => `收费 ￥${formatCurrency(item.totalFee)}`
    });

    renderRankingList(dom.doctorBreakdown, doctorStats.slice(0, 5), {
        emptyText: "暂无医生统计数据",
        valueFormatter: (item) => `${item.count} 条`,
        metaFormatter: (item) => `需复诊 ${item.followUpCount} 条`
    });

    renderRankingList(dom.statusBreakdown, statusStats, {
        emptyText: "暂无状态统计数据",
        valueFormatter: (item) => `${item.count} 条`,
        metaFormatter: (item) => `占比 ${statusTotal ? Math.round((item.count / statusTotal) * 100) : 0}%`
    });
}

function renderRecordList(filteredRecords, searchTerms) {
    const totalRecords = state.records.length;
    dom.listSummary.textContent = `共 ${filteredRecords.length} 条记录${hasActiveFilters() ? `（全部 ${totalRecords} 条）` : ""}，默认按就诊日期倒序显示。`;

    if (!filteredRecords.length) {
        dom.recordList.innerHTML = `
            <div class="empty-state">
                <p class="empty-state__title">当前没有可显示的问诊记录</p>
                <p class="empty-state__text">可以先新增一条记录，或调整关键字与日期筛选条件。</p>
            </div>
        `;
        return;
    }

    dom.recordList.innerHTML = filteredRecords.map((record) => {
        const recordCode = getRecordCode(record.id);
        const metaChips = [
            record.gender ? `${record.gender}` : "性别未填",
            Number.isFinite(record.age) ? `${record.age} 岁` : "年龄未填",
            record.phone ? record.phone : "电话未填",
            record.department || "科室未填",
            record.doctor || "医生未填"
        ];

        if (record.images.length) {
            metaChips.push(`${record.images.length} 张病例图`);
        }

        return `
            <article class="record-card" data-record-card-id="${escapeHtml(record.id)}">
                <header class="record-card__header">
                    <div>
                        <h3 class="record-card__name">${highlightText(record.name, searchTerms)}</h3>
                        <p class="record-card__subline">编号 ${highlightText(recordCode, searchTerms)} · 就诊日期 ${highlightText(record.visitDate, searchTerms)} · 更新时间 ${escapeHtml(formatDateTime(record.updatedAt))}</p>
                    </div>
                    <div class="badge-row">
                        <span class="badge badge--status">${highlightText(record.status, searchTerms)}</span>
                        ${record.followUp ? '<span class="badge badge--follow-up">需复诊</span>' : ""}
                    </div>
                </header>

                <div class="record-card__meta">
                    ${metaChips.map((chip) => `<span class="meta-chip">${highlightText(chip, searchTerms)}</span>`).join("")}
                </div>

                <section class="record-card__section">
                    <p class="record-card__section-title">主诉 / 症状</p>
                    <p class="record-card__section-text">${highlightText(record.symptoms, searchTerms)}</p>
                </section>

                <section class="record-card__section">
                    <p class="record-card__section-title">初步诊断</p>
                    <p class="record-card__section-text">${highlightText(record.diagnosis, searchTerms)}</p>
                </section>

                ${record.notes ? `
                    <section class="record-card__section">
                        <p class="record-card__section-title">备注</p>
                        <p class="record-card__section-text">${highlightText(record.notes, searchTerms)}</p>
                    </section>
                ` : ""}

                ${renderRecordImagesSection(record)}

                <footer class="record-card__footer">
                    <span class="record-card__fee">收费 ￥${formatCurrency(record.fee)}</span>
                    <div class="record-card__actions">
                        <button class="button button--ghost" type="button" data-action="edit" data-record-id="${escapeHtml(record.id)}">编辑</button>
                        <button class="button button--danger" type="button" data-action="delete" data-record-id="${escapeHtml(record.id)}">删除</button>
                    </div>
                </footer>
            </article>
        `;
    }).join("");
}

function renderRecordImagesSection(record) {
    if (!record.images.length) {
        return "";
    }

    return `
        <section class="record-card__section">
            <div class="record-card__section-head">
                <p class="record-card__section-title">病例图片</p>
                <span class="record-card__section-meta">共 ${record.images.length} 张</span>
            </div>
            <div class="case-image-grid case-image-grid--record">
                ${record.images.map((image, index) => `
                    <a class="case-image-card case-image-card--record" href="${escapeHtml(image.dataUrl)}" target="_blank" rel="noreferrer">
                        <span class="case-image-card__preview">
                            <img class="case-image-card__image" src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name || `病例图片${index + 1}`)}">
                        </span>
                        <span class="case-image-card__caption">${escapeHtml(image.name || `病例图片${index + 1}`)}</span>
                    </a>
                `).join("")}
            </div>
        </section>
    `;
}

function renderCaseImageManager() {
    const count = state.pendingImages.length;

    if (state.isProcessingImages) {
        dom.caseImagesSummary.textContent = "正在处理病例图片，请稍候…";
    } else if (count >= CASE_IMAGE_LIMIT) {
        dom.caseImagesSummary.textContent = `已选择 ${count} / ${CASE_IMAGE_LIMIT} 张病例图片，已达到上限，可先移除再继续添加。`;
    } else if (count) {
        dom.caseImagesSummary.textContent = `已选择 ${count} / ${CASE_IMAGE_LIMIT} 张病例图片，保存后会随记录一起导出。`;
    } else {
        dom.caseImagesSummary.textContent = `支持一次上传多张病例图片，最多 ${CASE_IMAGE_LIMIT} 张，保存时会自动压缩并随 JSON 一起导出。`;
    }

    dom.caseImagesInput.disabled = state.isProcessingImages || count >= CASE_IMAGE_LIMIT;

    if (!count) {
        dom.caseImagesPreview.innerHTML = '<p class="case-image-empty">暂无病例图片，可一次选择多张上传。</p>';
        return;
    }

    dom.caseImagesPreview.innerHTML = state.pendingImages.map((image, index) => `
        <article class="case-image-card case-image-card--editor">
            <a class="case-image-card__preview" href="${escapeHtml(image.dataUrl)}" target="_blank" rel="noreferrer">
                <img class="case-image-card__image" src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name || `病例图片${index + 1}`)}">
            </a>
            <div class="case-image-card__meta">
                <p class="case-image-card__name">${escapeHtml(image.name || `病例图片${index + 1}`)}</p>
                <button class="case-image-card__remove" type="button" data-case-image-remove="${escapeHtml(image.id)}">移除</button>
            </div>
        </article>
    `).join("");
}

function renderFilterOptions() {
    syncFilterSelect(dom.departmentFilter, getUniqueFieldValues(state.records, "department"), state.filters.department, "全部科室");
    syncFilterSelect(dom.statusFilter, getUniqueFieldValues(state.records, "status"), state.filters.status, "全部状态");
}

function syncFilterSelect(selectElement, values, currentValue, placeholder) {
    const options = currentValue && !values.includes(currentValue) ? [currentValue, ...values] : values;
    selectElement.innerHTML = [
        `<option value="">${placeholder}</option>`,
        ...options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    ].join("");
    selectElement.value = currentValue || "";
}

function getUniqueFieldValues(records, fieldName) {
    return [...new Set(records
        .map((record) => normalizeText(record[fieldName]))
        .filter(Boolean))]
        .sort((left, right) => left.localeCompare(right, "zh-CN"));
}

function buildGroupedStats(records, selector) {
    const grouped = new Map();

    for (const record of records) {
        const key = normalizeText(selector(record)) || "未分类";
        const current = grouped.get(key) || { label: key, count: 0, totalFee: 0, followUpCount: 0 };
        current.count += 1;
        current.totalFee += record.fee;

        if (record.followUp) {
            current.followUpCount += 1;
        }

        grouped.set(key, current);
    }

    return Array.from(grouped.values()).sort((left, right) => {
        if (right.count !== left.count) {
            return right.count - left.count;
        }

        if (right.totalFee !== left.totalFee) {
            return right.totalFee - left.totalFee;
        }

        return left.label.localeCompare(right.label, "zh-CN");
    });
}

function renderRankingList(container, items, options) {
    if (!items.length) {
        container.innerHTML = `<p class="ranking-empty">${escapeHtml(options.emptyText || "暂无数据")}</p>`;
        return;
    }

    const peak = Math.max(...items.map((item) => item.count), 1);

    container.innerHTML = items.map((item) => {
        const width = Math.max((item.count / peak) * 100, 12);
        const meta = options.metaFormatter ? options.metaFormatter(item) : "";

        return `
            <article class="ranking-item">
                <div class="ranking-item__head">
                    <span class="ranking-item__label">${escapeHtml(item.label)}</span>
                    <span class="ranking-item__value">${escapeHtml(options.valueFormatter(item))}</span>
                </div>
                <div class="ranking-item__bar">
                    <span class="ranking-item__fill" style="width:${width}%"></span>
                </div>
                ${meta ? `<p class="ranking-item__meta">${escapeHtml(meta)}</p>` : ""}
            </article>
        `;
    }).join("");
}

function getFilteredRecords() {
    const searchTerms = getSearchTerms();
    const startDate = state.filters.startDate;
    const endDate = state.filters.endDate;
    const department = state.filters.department;
    const status = state.filters.status;

    return sortRecords(state.records.filter((record) => {
        const matchesKeyword = !searchTerms.length || searchTerms.every((term) => buildRecordSearchText(record).includes(term.toLowerCase()));

        const matchesStartDate = !startDate || record.visitDate >= startDate;
        const matchesEndDate = !endDate || record.visitDate <= endDate;
        const matchesDepartment = !department || record.department === department;
        const matchesStatus = !status || record.status === status;

        return matchesKeyword && matchesStartDate && matchesEndDate && matchesDepartment && matchesStatus;
    }));
}

function hasActiveFilters() {
    return Boolean(state.filters.keyword || state.filters.startDate || state.filters.endDate || state.filters.department || state.filters.status);
}

function getSearchTerms() {
    return normalizeText(state.filters.keyword)
        .split(/[\s,，、;；]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function buildRecordSearchText(record) {
    const followUpText = record.followUp ? "需复诊 复诊 回访 是" : "无需复诊 否";
    const imageText = record.images.length ? `病例图片 图片 附件 有图 ${record.images.length} 张` : "无图 无病例图片";

    return [
        record.id,
        getRecordCode(record.id),
        record.name,
        record.gender,
        Number.isFinite(record.age) ? String(record.age) : "",
        record.phone,
        record.visitDate,
        record.department,
        record.doctor,
        record.symptoms,
        record.diagnosis,
        record.status,
        followUpText,
        record.notes,
        formatCurrency(record.fee),
        imageText
    ].join(" ").toLowerCase();
}

function validateFormData(formData) {
    const requiredFields = [
        { field: "name", label: "姓名" },
        { field: "visitDate", label: "就诊日期" },
        { field: "department", label: "科室" },
        { field: "doctor", label: "医生" },
        { field: "fee", label: "收费金额" },
        { field: "status", label: "状态" },
        { field: "symptoms", label: "主诉 / 症状" },
        { field: "diagnosis", label: "初步诊断" }
    ];

    for (const item of requiredFields) {
        if (!normalizeText(formData.get(item.field))) {
            return { field: item.field, message: `请填写${item.label}。` };
        }
    }

    return null;
}

function loadRecords() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        const records = Array.isArray(parsed) ? parsed : Array.isArray(parsed.records) ? parsed.records : [];
        return records.map((item) => normalizeRecord(item, { fallbackId: createRecordId() }));
    } catch (error) {
        console.error("Failed to load records", error);
        showToast("读取本地数据失败，已按空数据启动。", true);
        return [];
    }
}

function saveRecords(records) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        return true;
    } catch (error) {
        console.error("Failed to save records", error);
        showToast("保存到浏览器本地失败，请减少图片数量或检查存储空间。", true);
        return false;
    }
}

function normalizeRecord(source, options = {}) {
    const record = source || {};
    const now = new Date().toISOString();
    const normalized = {
        id: normalizeText(pickField(record, fieldAliases.id)) || options.fallbackId || createRecordId(),
        name: normalizeText(pickField(record, fieldAliases.name)) || "未命名患者",
        gender: normalizeText(pickField(record, fieldAliases.gender)),
        age: normalizeAge(pickField(record, fieldAliases.age)),
        phone: normalizeText(pickField(record, fieldAliases.phone)),
        visitDate: normalizeDate(pickField(record, fieldAliases.visitDate)) || getTodayDate(),
        department: normalizeText(pickField(record, fieldAliases.department)),
        doctor: normalizeText(pickField(record, fieldAliases.doctor)),
        symptoms: normalizeText(pickField(record, fieldAliases.symptoms)),
        diagnosis: normalizeText(pickField(record, fieldAliases.diagnosis)),
        fee: normalizeMoney(pickField(record, fieldAliases.fee)),
        status: normalizeText(pickField(record, fieldAliases.status)) || STATUS_FALLBACK,
        followUp: normalizeBoolean(pickField(record, fieldAliases.followUp)),
        notes: normalizeText(pickField(record, fieldAliases.notes)),
        images: normalizeRecordImages(pickField(record, fieldAliases.images)),
        createdAt: normalizeDateTime(pickField(record, fieldAliases.createdAt)) || now,
        updatedAt: normalizeDateTime(pickField(record, fieldAliases.updatedAt)) || now
    };

    if (normalized.followUp && normalized.status === STATUS_FALLBACK) {
        normalized.status = "待复查";
    }

    return normalized;
}

function pickField(source, aliases) {
    for (const alias of aliases) {
        if (source && Object.prototype.hasOwnProperty.call(source, alias) && source[alias] !== null && source[alias] !== undefined) {
            return source[alias];
        }
    }

    return "";
}

function normalizeText(value) {
    return String(value ?? "").trim();
}

function normalizeAge(value) {
    const age = Number.parseInt(String(value ?? "").trim(), 10);
    return Number.isFinite(age) && age >= 0 ? age : null;
}

function normalizeMoney(value) {
    const fee = Number.parseFloat(String(value ?? "").replace(/,/g, "").trim());
    return Number.isFinite(fee) && fee >= 0 ? fee : 0;
}

function normalizeBoolean(value) {
    if (typeof value === "boolean") {
        return value;
    }

    const text = String(value ?? "").trim().toLowerCase();
    return ["true", "1", "yes", "y", "是", "需要", "需复诊", "复诊", "checked"].includes(text);
}

function normalizeDate(value) {
    const text = String(value ?? "").trim();

    if (!text) {
        return "";
    }

    const directMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);

    if (directMatch) {
        const year = directMatch[1];
        const month = directMatch[2].padStart(2, "0");
        const day = directMatch[3].padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    const parsed = new Date(text);

    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    return formatLocalDate(parsed);
}

function normalizeDateTime(value) {
    const text = String(value ?? "").trim();

    if (!text) {
        return "";
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function normalizeRecordImages(value) {
    const rawItems = Array.isArray(value)
        ? value
        : value && Array.isArray(value.images)
            ? value.images
            : value
                ? [value]
                : [];

    return rawItems
        .map((item, index) => normalizeCaseImage(item, index))
        .filter(Boolean)
        .slice(0, CASE_IMAGE_LIMIT);
}

function normalizeCaseImage(item, index) {
    const source = typeof item === "string"
        ? item
        : item && typeof item === "object"
            ? item.dataUrl || item.url || item.src || item.base64
            : "";
    const dataUrl = normalizeImageSource(source);

    if (!dataUrl) {
        return null;
    }

    const name = typeof item === "object" && item ? normalizeText(item.name || item.fileName || item.title) : "";
    const type = typeof item === "object" && item ? normalizeText(item.type || item.mimeType) : "";
    const addedAt = typeof item === "object" && item ? normalizeDateTime(item.addedAt || item.createdAt) : "";
    const imageId = typeof item === "object" && item ? normalizeText(item.id) : "";

    return {
        id: imageId || createCaseImageId(),
        name: name || `病例图片${index + 1}`,
        type: type || getDataUrlMimeType(dataUrl) || "image/jpeg",
        dataUrl,
        addedAt: addedAt || new Date().toISOString()
    };
}

function cloneCaseImages(images) {
    return normalizeRecordImages(images).map((image) => ({ ...image }));
}

function normalizeImageSource(value) {
    const text = String(value ?? "").trim();
    return /^data:image\/[a-z0-9.+-]+(?:;[^,]*)?,/i.test(text) ? text : "";
}

function getDataUrlMimeType(value) {
    const match = String(value ?? "").match(/^data:(image\/[a-z0-9.+-]+)(?:;[^,]*)?,/i);
    return match ? match[1].toLowerCase() : "";
}

function createCaseImageId() {
    return `image-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createRecordId() {
    return `record-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function shouldAutoSeedDemoRecords() {
    const params = new URLSearchParams(window.location.search);
    return params.get("demo") !== "off";
}

function createDemoRecords(count) {
    const baseDate = new Date();
    baseDate.setHours(9, 0, 0, 0);

    return Array.from({ length: count }, (_, index) => {
        const scenario = DEMO_SCENARIOS[index % DEMO_SCENARIOS.length];
        const visitAt = new Date(baseDate);
        visitAt.setDate(baseDate.getDate() - (index % 45));
        visitAt.setHours(8 + (index % 8), (index * 13) % 60, 0, 0);

        const createdAt = new Date(visitAt);
        createdAt.setMinutes(createdAt.getMinutes() - 35);

        const updatedAt = new Date(visitAt);
        updatedAt.setMinutes(updatedAt.getMinutes() + 25 + (index % 4) * 10);

        const followUp = index % 4 === 0 || index % 7 === 0;
        const status = followUp ? (index % 2 === 0 ? "待复查" : "随访中") : (index % 5 === 0 ? "已归档" : "已完成");
        const fee = Number((28 + (index % 6) * 12 + (index % 4) * 3.5).toFixed(2));

        return normalizeRecord({
            id: `demo-record-${String(index + 1).padStart(3, "0")}`,
            name: buildDemoName(index),
            gender: index % 2 === 0 ? "男" : "女",
            age: 18 + (index * 3) % 63,
            phone: `13${String(800000000 + index).padStart(9, "0")}`,
            visitDate: formatLocalDate(visitAt),
            department: scenario.department,
            doctor: scenario.doctors[index % scenario.doctors.length],
            symptoms: scenario.symptoms[index % scenario.symptoms.length],
            diagnosis: scenario.diagnoses[index % scenario.diagnoses.length],
            fee,
            status,
            followUp,
            notes: `${scenario.notes[index % scenario.notes.length]}，档案 ${getRecordCode(`demo-record-${String(index + 1).padStart(3, "0")}`)}`,
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString()
        });
    });
}

function buildDemoName(index) {
    const surname = DEMO_SURNAMES[index % DEMO_SURNAMES.length];
    const givenName = DEMO_GIVEN_NAMES[Math.floor(index / DEMO_SURNAMES.length) % DEMO_GIVEN_NAMES.length];
    const suffix = index >= DEMO_SURNAMES.length * DEMO_GIVEN_NAMES.length ? String(index + 1) : "";
    return `${surname}${givenName}${suffix}`;
}

function sortRecords(records) {
    return [...records].sort((left, right) => {
        const leftDate = `${left.visitDate}|${left.updatedAt}`;
        const rightDate = `${right.visitDate}|${right.updatedAt}`;
        return rightDate.localeCompare(leftDate);
    });
}

function buildChartPoints(records, days) {
    const points = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let index = days - 1; index >= 0; index -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - index);
        const isoDate = formatLocalDate(date);
        const count = records.filter((record) => record.visitDate === isoDate).length;
        const label = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
        points.push({ date: isoDate, label, count });
    }

    return points;
}

async function handleImportFile(event) {
    const file = event.target.files && event.target.files[0];

    if (!file) {
        return;
    }

    try {
        const content = await readFileAsText(file);
        const payload = JSON.parse(content);
        const importedItems = extractImportRecords(payload);
        const normalizedRecords = importedItems.map((item) => normalizeRecord(item, { fallbackId: createRecordId() }));

        if (!normalizedRecords.length) {
            showToast("导入文件中没有可用记录。", true);
            return;
        }

        const shouldReplace = state.records.length > 0 && window.confirm("点击“确定”覆盖现有数据，点击“取消”则追加导入。");
        const nextRecords = shouldReplace ? normalizedRecords : mergeImportedRecords(state.records, normalizedRecords);

        if (await setRecords(nextRecords)) {
            showToast(`成功导入 ${normalizedRecords.length} 条记录。`, false);
        }
    } catch (error) {
        console.error("Failed to import records", error);
        showToast("JSON 导入失败，请确认文件格式正确。", true);
    } finally {
        dom.importFile.value = "";
    }
}

function readFileAsText(file) {
    if (file && typeof file.text === "function") {
        return file.text();
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(String(reader.result ?? ""));
        };

        reader.onerror = () => {
            reject(reader.error || new Error("Failed to read import file"));
        };

        reader.readAsText(file);
    });
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(String(reader.result ?? ""));
        };

        reader.onerror = () => {
            reject(reader.error || new Error("Failed to read image file"));
        };

        reader.readAsDataURL(file);
    });
}

async function handleCaseImagesSelected(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
        return;
    }

    const availableSlots = CASE_IMAGE_LIMIT - state.pendingImages.length;

    if (availableSlots <= 0) {
        dom.caseImagesInput.value = "";
        renderCaseImageManager();
        showToast(`每条记录最多上传 ${CASE_IMAGE_LIMIT} 张病例图片。`, true);
        return;
    }

    const queuedFiles = files.slice(0, availableSlots);
    const ignoredCount = files.length - queuedFiles.length;
    const failedFiles = [];
    const nextImages = [];

    state.isProcessingImages = true;
    renderCaseImageManager();

    for (const file of queuedFiles) {
        if (!String(file.type || "").toLowerCase().startsWith("image/")) {
            failedFiles.push(file.name || "未命名文件");
            continue;
        }

        try {
            nextImages.push(await prepareCaseImage(file));
        } catch (error) {
            console.error("Failed to prepare case image", error);
            failedFiles.push(file.name || "未命名图片");
        }
    }

    state.isProcessingImages = false;
    dom.caseImagesInput.value = "";

    if (nextImages.length) {
        state.pendingImages = [...state.pendingImages, ...nextImages].slice(0, CASE_IMAGE_LIMIT);
    }

    renderCaseImageManager();

    if (!nextImages.length) {
        showToast("没有成功处理的病例图片，请更换图片后重试。", true);
        return;
    }

    const summary = [`已添加 ${nextImages.length} 张病例图片`];

    if (ignoredCount > 0) {
        summary.push(`超出上限的 ${ignoredCount} 张已忽略`);
    }

    if (failedFiles.length > 0) {
        summary.push(`${failedFiles.length} 张处理失败`);
    }

    showToast(`${summary.join("，")}。`, failedFiles.length > 0);
}

function handleCaseImagePreviewAction(event) {
    const removeButton = event.target.closest("[data-case-image-remove]");

    if (!removeButton) {
        return;
    }

    state.pendingImages = state.pendingImages.filter((image) => image.id !== removeButton.dataset.caseImageRemove);
    dom.caseImagesInput.value = "";
    renderCaseImageManager();
}

async function prepareCaseImage(file) {
    const rawDataUrl = await readFileAsDataUrl(file);
    const normalizedSource = normalizeImageSource(rawDataUrl);

    if (!normalizedSource) {
        throw new Error("Invalid image data");
    }

    const optimizedSource = await optimizeCaseImage(normalizedSource);
    return normalizeCaseImage({
        id: createCaseImageId(),
        name: normalizeText(file.name) || `病例图片${state.pendingImages.length + 1}`,
        type: getDataUrlMimeType(optimizedSource) || normalizeText(file.type) || "image/jpeg",
        dataUrl: optimizedSource,
        addedAt: new Date().toISOString()
    }, state.pendingImages.length);
}

async function optimizeCaseImage(dataUrl) {
    if (isJsdomEnvironment() || typeof Image !== "function") {
        return dataUrl;
    }

    try {
        const image = await loadImageElement(dataUrl);
        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;

        if (!sourceWidth || !sourceHeight) {
            return dataUrl;
        }

        const { width, height } = scaleImageSize(sourceWidth, sourceHeight, CASE_IMAGE_MAX_EDGE);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
            return dataUrl;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);

        const optimized = canvas.toDataURL("image/jpeg", CASE_IMAGE_JPEG_QUALITY);
        return optimized && optimized.length < dataUrl.length ? optimized : dataUrl;
    } catch (error) {
        console.error("Failed to optimize case image", error);
        return dataUrl;
    }
}

function loadImageElement(source) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load image"));
        image.src = source;
    });
}

function scaleImageSize(width, height, maxEdge) {
    const longestEdge = Math.max(width, height);

    if (longestEdge <= maxEdge) {
        return { width, height };
    }

    const ratio = maxEdge / longestEdge;
    return {
        width: Math.max(1, Math.round(width * ratio)),
        height: Math.max(1, Math.round(height * ratio))
    };
}

function isJsdomEnvironment() {
    return Boolean(window.navigator && /jsdom/i.test(window.navigator.userAgent || ""));
}

function extractImportRecords(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && Array.isArray(payload.records)) {
        return payload.records;
    }

    if (payload && Array.isArray(payload.data)) {
        return payload.data;
    }

    if (payload && payload.data && Array.isArray(payload.data.records)) {
        return payload.data.records;
    }

    throw new Error("Unsupported import format");
}

function mergeImportedRecords(existingRecords, importedRecords) {
    const usedIds = new Set(existingRecords.map((item) => item.id));
    const normalizedImported = importedRecords.map((record) => {
        if (!usedIds.has(record.id)) {
            usedIds.add(record.id);
            return record;
        }

        const uniqueRecord = { ...record, id: createRecordId(), updatedAt: new Date().toISOString() };
        usedIds.add(uniqueRecord.id);
        return uniqueRecord;
    });

    return [...normalizedImported, ...existingRecords];
}

function exportJson() {
    const payload = {
        exportedAt: new Date().toISOString(),
        version: 1,
        records: state.records
    };

    downloadFile(JSON.stringify(payload, null, 2), `doctor-records-${getTodayDate()}.json`, "application/json;charset=utf-8");
    showToast("JSON 导出完成。", false);
}

function exportCsv() {
    const headers = ["姓名", "性别", "年龄", "电话", "就诊日期", "科室", "医生", "主诉/症状", "初步诊断", "收费金额", "状态", "是否复诊", "病例图片数量", "备注", "创建时间", "更新时间"];
    const rows = state.records.map((record) => [
        record.name,
        record.gender,
        Number.isFinite(record.age) ? record.age : "",
        record.phone,
        record.visitDate,
        record.department,
        record.doctor,
        record.symptoms,
        record.diagnosis,
        record.fee,
        record.status,
        record.followUp ? "是" : "否",
        record.images.length,
        record.notes,
        record.createdAt,
        record.updatedAt
    ]);

    const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
    downloadFile(`\uFEFF${csv}`, `doctor-records-${getTodayDate()}.csv`, "text/csv;charset=utf-8");
    showToast("CSV 导出完成。", false);
}

function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function escapeCsvCell(value) {
    const text = String(value ?? "").replace(/"/g, '""');
    return `"${text}"`;
}

function formatCurrency(value) {
    return Number(value || 0).toFixed(2);
}

function formatNumberInput(value) {
    return Number.isInteger(value) ? String(value) : Number(value || 0).toFixed(2);
}

function getTodayDate() {
    return formatLocalDate(new Date());
}

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "未记录";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}`;
}

function showToast(message, isError) {
    dom.toast.textContent = message;
    dom.toast.style.background = isError ? "rgba(182, 66, 59, 0.94)" : "rgba(21, 33, 43, 0.92)";
    dom.toast.classList.add("is-visible");

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        dom.toast.classList.remove("is-visible");
    }, 2400);
}

function focusRecordCard(recordId) {
    const targetCard = findRecordCardElement(recordId);

    if (!targetCard) {
        return;
    }

    [...dom.recordList.querySelectorAll(".record-card--focus")].forEach((card) => {
        card.classList.remove("record-card--focus");
    });

    targetCard.classList.add("record-card--focus");
    targetCard.scrollIntoView({ behavior: "smooth", block: "center" });

    window.setTimeout(() => {
        targetCard.classList.remove("record-card--focus");
    }, 1800);
}

function findRecordCardElement(recordId) {
    return [...dom.recordList.querySelectorAll(".record-card")].find((card) => card.dataset.recordCardId === recordId) || null;
}

function getRecordCode(recordId) {
    const normalizedId = normalizeText(recordId);

    if (!normalizedId) {
        return "未编号";
    }

    if (normalizedId.startsWith("demo-record-")) {
        return `DEMO-${normalizedId.slice("demo-record-".length)}`;
    }

    return normalizedId.length > 12 ? normalizedId.slice(-12).toUpperCase() : normalizedId.toUpperCase();
}

function highlightText(value, searchTerms) {
    const text = String(value ?? "");

    if (!text) {
        return "";
    }

    const terms = [...new Set((searchTerms || []).map((item) => normalizeText(item)).filter(Boolean))]
        .sort((left, right) => right.length - left.length);

    if (!terms.length) {
        return escapeHtml(text);
    }

    const pattern = new RegExp(terms.map((item) => escapeRegExp(item)).join("|"), "gi");
    const matches = [...text.matchAll(pattern)];

    if (!matches.length) {
        return escapeHtml(text);
    }

    let cursor = 0;
    let output = "";

    for (const match of matches) {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        output += escapeHtml(text.slice(cursor, start));
        output += `<mark class="text-highlight">${escapeHtml(text.slice(start, end))}</mark>`;
        cursor = end;
    }

    output += escapeHtml(text.slice(cursor));
    return output;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}