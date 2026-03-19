# 病人问诊记录登记统计

一个无需后端的本地静态页面，用于登记、检索和统计病人问诊记录。网页版数据保存在浏览器 localStorage 中，桌面版数据可保存为本机文档目录下的 JSON 文件，双击打开 `index.html` 即可先使用网页版。

## 本地打开方式

1. 进入当前目录。
2. 直接双击 `index.html`，或在浏览器中打开该文件。
3. 首次打开时若浏览器中还没有本地数据，会自动填充 100 条演示记录，便于直接搜索和演示。
4. 后续数据会自动保存在当前浏览器本地，如需重新生成演示数据，可点击页面中的“填充 100 条假数据”。

## 桌面应用模式

如果你希望它变成 Windows 下双击运行的桌面应用，而不是每次手动打开网页文件，可以使用 Electron 打包。

### 开发运行

1. 当前目录执行 `npm install`
2. 执行 `npm run desktop:start`
3. 会以桌面窗口方式打开问诊登记系统

### 打包成可分发 exe

1. 当前目录执行 `npm install`
2. 执行 `npm run desktop:pack`
3. 打包完成后，在 `release` 目录下会生成一个 `DoctorRegister-<版本号>-portable.exe`
4. 把这个 exe 复制到另一台 Windows 电脑，双击即可运行

如果网络较慢，建议直接使用国内镜像命令：

1. 当前目录执行 `npm install`
2. 执行 `npm run desktop:pack:cn`
3. 成品同样会输出到 `release/DoctorRegister-<版本号>-portable.exe`

如果你不要求单文件 exe，也可以直接使用 `release/win-unpacked/DoctorRegister.exe`。把整个 `win-unpacked` 文件夹复制到另一台电脑后，双击其中的 `DoctorRegister.exe` 就能运行。

### 桌面版数据说明

- 桌面版启动时默认关闭“自动填充 100 条演示数据”
- 桌面版数据会保存到 `文档/DoctorRegister/doctor-records.json`
- 从 `1.0.2` 开始，如果检测到旧版桌面数据仍在 Chromium 本地存储里，首次启动会自动迁移到上述 JSON 文件
- 如果需要迁移正式数据，仍建议先从旧电脑导出 JSON，再在新电脑导入 JSON

### 桌面版兼容性

- 当前打包的是 Windows x64 版本，目标电脑需要是 64 位 Windows
- 当前 Electron 版本更适合 Windows 10 / Windows 11 环境
- `DoctorRegister-<版本号>-portable.exe` 是单文件便携版，首次运行时部分电脑可能会被系统安全策略、杀毒软件或临时目录权限拦截
- 如果某台电脑双击 portable exe 没反应，优先改用 `release/win-unpacked/DoctorRegister.exe`，并确保整个 `win-unpacked` 文件夹一起复制过去

## CI 验证

### 本地验证

1. 当前目录执行 `npm ci`
2. 执行 `npm run ci:local`
3. 该脚本会依次运行网页测试并重新打包 Windows portable 版，最后按 `package.json` 当前版本自动校验 `release/DoctorRegister-<版本号>-portable.exe` 是否真实生成

### GitHub Actions

- 工作流文件位于 `.github/workflows/ci.yml`
- `ubuntu-latest` 负责执行网页测试
- `windows-latest` 负责执行桌面版打包校验，并上传带版本号的 portable 构建产物
- CI 已升级到 `actions/checkout@v6`、`actions/setup-node@v6`、`actions/upload-artifact@v6`，用于消除旧版 Node 20 runtime warning

## 自动发布 Release

- 工作流文件位于 `.github/workflows/release.yml`
- 当你推送形如 `v1.0.0` 的 tag 时，会自动执行网页测试、打包 Windows portable 版，并发布到 GitHub Release
- 手动触发 `Release` 工作流时，会读取 `package.json` 里的版本号并发布当前提交对应的 `v<版本号>` Release
- Release 工作流会校验 tag 与 `package.json` 版本是否一致，避免发布名和程序版本号错位

### 推 tag 自动打包

1. 先把 `package.json` 的 `version` 改成要发布的版本，例如 `1.0.1`
2. 提交并推送代码到远端主分支
3. 在本地执行 `git tag v1.0.1`
4. 执行 `git push origin v1.0.1`
5. GitHub 会自动触发 `Release` 工作流，完成测试、Windows 打包并把 exe 挂到 Release 资产里

## 功能校验

1. 当前目录执行 `npm install`。
2. 执行 `npm test`。
3. 该冒烟测试会验证新增、筛选、编辑、删除、导入、导出等主流程功能。

## 功能概览

- 新增、编辑、删除问诊记录
- 按关键字搜索姓名、电话、编号、科室、医生、主诉、诊断、备注，支持多个关键词组合搜索与高亮
- 按就诊日期区间、科室、状态组合筛选
- 基础统计面板：总记录数、当前筛选收费、今日问诊数、需复诊数、累计收费
- 近 7 天问诊趋势图
- 分类统计：科室分布、医生工作量、状态分布
- 首次打开自动填充 100 条演示数据，也可手动一键重置为 100 条假数据
- JSON 导入，支持常见字段别名兼容和基础容错
- 支持为单条问诊记录上传多张病例图片，编辑时可继续补图或移除，图片会随 JSON 一起导入导出
- JSON / CSV 导出
- 空状态提示与移动端适配布局

## 记录字段

- 姓名
- 性别
- 年龄
- 电话
- 就诊日期
- 科室
- 医生
- 主诉 / 症状
- 初步诊断
- 收费金额
- 状态
- 是否复诊
- 备注

## 数据存储方式

- 网页版数据保存在浏览器的 localStorage 中。
- 网页版使用的存储键为 `doctor.consultation.records.v1`。
- 桌面版默认保存到 `文档/DoctorRegister/doctor-records.json`，不再依赖 Chromium 的本地存储目录。
- 两种模式都不依赖服务器，不会自动同步到其他浏览器或其他电脑。
- 如需备份或迁移数据，可使用页面中的 JSON 导出与导入功能。

## 导入说明

- 支持直接导入记录数组。
- 也支持导入带有 `records` 字段的对象。
- 导入时会兼容部分中英文别名字段，例如姓名、性别、电话、就诊日期、初步诊断等。
- 如果 JSON 中包含 `images` / `caseImages` / `附件` 等图片数组字段，也会一并导入到记录里。
- 当已有本地数据时，导入会提示选择覆盖现有数据或追加导入。
