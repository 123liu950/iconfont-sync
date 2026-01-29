# iconfont-sync-cli

[![npm version](https://img.shields.io/npm/v/iconfont-sync-cli.svg)](https://www.npmjs.com/package/iconfont-sync-cli)
[![license](https://img.shields.io/npm/l/iconfont-sync-cli.svg)](LICENSE)

自动同步阿里 iconfont 项目文件到本地的 CLI 工具，解决手动下载替换 iconfont 文件的繁琐流程。工具会智能对比远端与本地文件差异（忽略时间戳等无意义内容），仅更新有实际变化的文件。

## 功能特性
- 🔐 自动登录阿里 iconfont 账号
- 📥 一键下载项目最新图标包
- 🔍 智能对比文件差异：
  - 文本文件（CSS/JS/JSON/SVG）忽略时间戳、版本号等动态内容
  - 字体文件（WOFF/TTF/EOT）根据 CSS 内容变化判断是否更新
- 📝 清晰的同步日志，展示新增/更新/无变化/缺失文件
- 🧹 自动清理临时文件，不残留垃圾

## 安装

node scripts/iconfont-sync.cjs \
  --account=your_account \
  --password=your_password \
  --pid=your_project_id \
  --localPath=your_local_path \
  --files=iconfont.css,iconfont.svg,iconfont.js,iconfont.json,iconfont.woff,iconfont.woff2,iconfont.json

### 全局安装（推荐）
```bash
npm install -g grande-iconfont-sync-cli