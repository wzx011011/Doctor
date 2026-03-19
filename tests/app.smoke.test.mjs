import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const currentFilePath = fileURLToPath(import.meta.url);
const workspaceDir = path.resolve(path.dirname(currentFilePath), "..");

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

async function createAppDom(url = "http://localhost/?demo=off") {
    const htmlPath = path.join(workspaceDir, "index.html");
    const scriptPath = path.join(workspaceDir, "app.js");
    const [html, appJs] = await Promise.all([
        fs.readFile(htmlPath, "utf8"),
        fs.readFile(scriptPath, "utf8")
    ]);

    const inlineHtml = html.replace('<script src="app.js"></script>', () => `<script>${appJs}</script>`);
    const downloads = [];
    const confirmQueue = [];

    const dom = new JSDOM(inlineHtml, {
        runScripts: "dangerously",
        url,
        pretendToBeVisual: true,
        beforeParse(window) {
            window.HTMLElement.prototype.scrollIntoView = () => {};
            window.URL.createObjectURL = () => "blob:test-download";
            window.URL.revokeObjectURL = () => {};
            window.HTMLAnchorElement.prototype.click = function click() {
                downloads.push({ download: this.download, href: this.href });
            };
            window.HTMLFormElement.prototype.reportValidity = function reportValidity() {
                return this.checkValidity();
            };
            window.confirm = () => (confirmQueue.length ? confirmQueue.shift() : true);
        }
    });

    await flush(dom.window);

    return { dom, window: dom.window, document: dom.window.document, downloads, confirmQueue };
}

async function flush(window) {
    await new Promise((resolve) => window.setTimeout(resolve, 0));
}

async function waitFor(window, predicate, attempts = 20) {
    for (let index = 0; index < attempts; index += 1) {
        if (predicate()) {
            return;
        }

        await flush(window);
    }

    throw new Error("等待页面状态更新超时");
}

async function submitRecord(window, values) {
    const form = window.document.getElementById("recordForm");
    form.elements.name.value = values.name;
    form.elements.gender.value = values.gender ?? "";
    form.elements.age.value = values.age ?? "";
    form.elements.phone.value = values.phone ?? "";
    form.elements.visitDate.value = values.visitDate;
    form.elements.department.value = values.department;
    form.elements.doctor.value = values.doctor;
    form.elements.fee.value = values.fee;
    form.elements.status.value = values.status;
    form.elements.symptoms.value = values.symptoms;
    form.elements.diagnosis.value = values.diagnosis;
    form.elements.notes.value = values.notes ?? "";
    form.elements.followUp.checked = Boolean(values.followUp);

    form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    await flush(window);
}

async function uploadCaseImages(window, files) {
    const imageInput = window.document.getElementById("caseImagesInput");

    Object.defineProperty(imageInput, "files", {
        configurable: true,
        value: files
    });

    imageInput.dispatchEvent(new window.Event("change", { bubbles: true }));
    await waitFor(window, () => !window.document.getElementById("caseImagesSummary").textContent.includes("正在处理"));
}

function createFakeImageFile(window, name) {
    return new window.File([`fake-image-${name}`], name, { type: "image/png" });
}

function getStoredRecords(window) {
    const raw = window.localStorage.getItem("doctor.consultation.records.v1");
    return raw ? JSON.parse(raw) : [];
}

function getRecordCardByName(document, name) {
    return [...document.querySelectorAll(".record-card")].find((card) => {
        const title = card.querySelector(".record-card__name");
        return title && title.textContent === name;
    });
}

test("页面主流程功能可用", async () => {
    const { dom, window, document, downloads, confirmQueue } = await createAppDom();
    const today = formatLocalDate(new Date());
    const form = document.getElementById("recordForm");

    assert.equal(form.elements.visitDate.value, today);
    assert.equal(form.elements.status.value, "已完成");
    assert.equal(document.querySelectorAll(".record-card").length, 0);

    await uploadCaseImages(window, [
        createFakeImageFile(window, "case-1.png"),
        createFakeImageFile(window, "case-2.png")
    ]);

    assert.match(document.getElementById("caseImagesSummary").textContent, /已选择 2 \/ 6 张病例图片/);
    assert.equal(document.querySelectorAll(".case-image-card--editor").length, 2);

    await submitRecord(window, {
        name: "张三",
        gender: "男",
        age: "34",
        phone: "13800000001",
        visitDate: today,
        department: "内科",
        doctor: "李医生",
        fee: "25.50",
        status: "已完成",
        symptoms: "发热两天",
        diagnosis: "上呼吸道感染",
        notes: "多喝水",
        followUp: true
    });

    await submitRecord(window, {
        name: "王五",
        gender: "女",
        age: "41",
        phone: "13800000002",
        visitDate: today,
        department: "外科",
        doctor: "周医生",
        fee: "80",
        status: "随访中",
        symptoms: "伤口复查",
        diagnosis: "术后恢复中",
        notes: "一周后复诊",
        followUp: false
    });

    let records = getStoredRecords(window);
    assert.equal(records.length, 2);
    assert.equal(records.find((record) => record.name === "张三").images.length, 2);
    assert.equal(document.querySelectorAll(".record-card").length, 2);
    assert.match(document.getElementById("statsGrid").textContent, /总记录数/);
    assert.match(document.getElementById("departmentBreakdown").textContent, /内科/);
    assert.match(document.getElementById("doctorBreakdown").textContent, /李医生/);

    const departmentFilter = document.getElementById("departmentFilter");
    departmentFilter.value = "内科";
    departmentFilter.dispatchEvent(new window.Event("change", { bubbles: true }));
    await flush(window);
    assert.equal(document.querySelectorAll(".record-card").length, 1);
    assert.match(document.getElementById("listSummary").textContent, /共 1 条记录/);

    const statusFilter = document.getElementById("statusFilter");
    statusFilter.value = "已完成";
    statusFilter.dispatchEvent(new window.Event("change", { bubbles: true }));
    await flush(window);
    assert.equal(document.querySelectorAll(".record-card").length, 1);

    document.getElementById("resetFiltersButton").click();
    await flush(window);
    assert.equal(document.querySelectorAll(".record-card").length, 2);

    const zhangSanCard = getRecordCardByName(document, "张三");
    assert.ok(zhangSanCard);
    assert.match(zhangSanCard.textContent, /病例图片/);
    zhangSanCard.querySelector('[data-action="edit"]').click();
    await flush(window);
    assert.equal(form.elements.name.value, "张三");
    assert.equal(document.querySelectorAll(".case-image-card--editor").length, 2);
    document.querySelector("[data-case-image-remove]").click();
    await flush(window);
    assert.equal(document.querySelectorAll(".case-image-card--editor").length, 1);
    form.elements.fee.value = "30";
    form.elements.notes.value = "已调整处方";
    form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    await flush(window);

    records = getStoredRecords(window);
    const editedRecord = records.find((record) => record.name === "张三");
    assert.equal(editedRecord.fee, 30);
    assert.equal(editedRecord.notes, "已调整处方");
    assert.equal(editedRecord.images.length, 1);

    confirmQueue.push(true);
    document.querySelector('[data-action="delete"][data-record-id="' + editedRecord.id + '"]').click();
    await flush(window);
    records = getStoredRecords(window);
    assert.equal(records.length, 1);

    document.getElementById("exportJsonButton").click();
    document.getElementById("exportCsvButton").click();
    await flush(window);
    assert.equal(downloads.length, 2);
    assert.match(downloads[0].download, /doctor-records-/);
    assert.match(downloads[1].download, /doctor-records-/);

    confirmQueue.push(false);
    const importPayload = {
        records: [
            {
                姓名: "赵六",
                性别: "男",
                年龄: 29,
                电话: "13800000003",
                就诊日期: today,
                科室: "儿科",
                接诊医生: "陈医生",
                主诉: "咳嗽",
                初步诊断: "支气管炎",
                收费金额: 45,
                状态: "已完成",
                是否复诊: "是",
                备注: "三天后复查",
                病例图片: ["data:image/png;base64,ZmFrZV9pbXBvcnRfaW1hZ2U="]
            }
        ]
    };
    const importFile = new window.File([JSON.stringify(importPayload)], "records.json", { type: "application/json" });
    const importInput = document.getElementById("importFile");
    Object.defineProperty(importInput, "files", {
        configurable: true,
        value: [importFile]
    });
    importInput.dispatchEvent(new window.Event("change", { bubbles: true }));
    await flush(window);
    await flush(window);

    records = getStoredRecords(window);
    assert.equal(records.length, 2);
    assert.ok(records.some((record) => record.name === "赵六"));
    assert.equal(records.find((record) => record.name === "赵六").images.length, 1);
    assert.match(document.getElementById("recordList").textContent, /赵六/);
    assert.match(getRecordCardByName(document, "赵六").textContent, /病例图片/);

    dom.window.close();
});

test("首次打开会填充100条假数据并支持搜索定位", async () => {
    const { dom, window, document } = await createAppDom("http://localhost/");

    const records = getStoredRecords(window);
    assert.equal(records.length, 100);
    assert.equal(document.querySelectorAll(".record-card").length, 100);
    assert.match(document.getElementById("searchResultChips").textContent, /DEMO-/);

    const searchInput = document.getElementById("searchInput");
    searchInput.value = "DEMO-001 内科";
    searchInput.dispatchEvent(new window.Event("input", { bubbles: true }));
    await flush(window);

    assert.equal(document.querySelectorAll(".record-card").length, 1);
    assert.match(document.getElementById("searchTermList").textContent, /DEMO-001/);
    assert.match(document.getElementById("recordList").innerHTML, /text-highlight/);

    const jumpButton = document.querySelector("[data-record-jump]");
    assert.ok(jumpButton);
    jumpButton.click();
    await flush(window);
    assert.equal(document.querySelectorAll(".record-card--focus").length, 1);

    dom.window.close();
});