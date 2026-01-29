# iconfont-sync-mcp

[English](#english) | [中文](#中文)

---

## English

A CLI tool and MCP (Model Context Protocol) server for automatically synchronizing Alibaba Iconfont project files to local directories.

### Features

- 🔐 Automatic login to iconfont.cn
- 📥 Download and extract icon packages
- 🔍 Smart file comparison (ignoring timestamps)
- 🔄 Automatic update of new/changed files
- 🤖 MCP server support for AI integration

### Installation

```bash
npm install -g iconfont-sync-mcp
```

Or use locally:
```bash
npm install iconfont-sync-mcp
```

Usage
CLI Mode
```bash
iconfont-sync \
  --account=your_account \
  --password=your_password \
  --pid=your_project_id \
  --localPath=./src/icons \
  --files=iconfont.css,iconfont.js,iconfont.json
```

Environment Variables
You can also use environment variables:
```bash
export account=your_account
export password=your_password
export pid=your_project_id
export localPath=./src/icons
export files=iconfont.css,iconfont.js

iconfont-sync
```

MCP Server Mode
Add to your MCP client configuration (e.g., Claude Desktop):
```json
{
  "mcpServers": {
    "iconfont-sync": {
      "command": "node",
      "args": ["/path/to/node_modules/iconfont-sync-mcp/index.cjs"],
      "env": {
        "account": "your_account",
        "password": "your_password",
        "pid": "your_project_id",
        "localPath": "/path/to/your/icons",
        "files": "iconfont.css,iconfont.js,iconfont.json,iconfont.ttf,iconfont.woff,iconfont.woff2"
      }
    }
  }
}
```

Or if installed globally:
```json
{
  "mcpServers": {
    "iconfont-sync": {
      "command": "iconfont-sync-mcp",
      "env": {
        "account": "your_account",
        "password": "your_password",
        "pid": "your_project_id",
        "localPath": "/path/to/your/icons",
        "files": "iconfont.css,iconfont.js"
      }
    }
  }
}
```

Parameters

|Parameter	|   Required	|    Description|
| ----- | :---: | ----: |
|account	|     Yes	|        Your iconfont.cn account (email/phone)|
|password	 |  Yes	     |   Your iconfont.cn password|
|pid	    |     Yes	 |       Project ID (found in project URL)|
|localPath	 |  Yes	    |    Local directory to save icon files|
|files	    |   No	    |      Comma-separated list of files to sync (default: all)|


Default Files
If files is not specified, the following files will be synced:
- iconfont.css
- iconfont.js
- iconfont.json
- iconfont.ttf
- iconfont.woff
- iconfont.woff2
- iconfont.eot
- iconfont.svg

How to Find Project ID (pid)
1. Log in to iconfont.cn
2. Go to your project
3. The URL will be like: https://www.iconfont.cn/manage/index?manage_type=myprojects&projectId=12345678
4. The projectId parameter is your pid

## 中文
自动同步阿里 Iconfont 项目文件到本地的 CLI 工具和 MCP 服务器。

功能特点
🔐 自动登录 iconfont.cn
📥 下载并解压图标包
🔍 智能文件对比（忽略时间戳差异）
🔄 自动更新新增/变更文件
🤖 支持 MCP 服务器，可与 AI 集成
安装
全局安装：
```bash
npm install -g iconfont-sync-mcp
```
本地安装：
```bash
npm install iconfont-sync-mcp
```
使用方式
命令行模式
```bash
iconfont-sync \
  --account=你的账号 \
  --password=你的密码 \
  --pid=项目ID \
  --localPath=./src/icons \
  --files=iconfont.css,iconfont.js,iconfont.json
```

环境变量模式
```bash
export account=你的账号
export password=你的密码
export pid=项目ID
export localPath=./src/icons
export files=iconfont.css,iconfont.js

iconfont-sync
```

MCP 服务器模式
在 MCP 客户端配置中添加（如 Claude Desktop）：
```json
{
  "mcpServers": {
    "iconfont-sync": {
      "command": "node",
      "args": ["/path/to/node_modules/iconfont-sync-mcp/index.cjs"],
      "env": {
        "account": "你的账号",
        "password": "你的密码",
        "pid": "项目ID",
        "localPath": "/path/to/your/icons",
        "files": "iconfont.css,iconfont.js,iconfont.json,iconfont.ttf,iconfont.woff,iconfont.woff2"
      }
    }
  }
}
```

参数说明

|Parameter	  | Required	 |   Description|
| ----- | :---: | ----: |
|account|	     Yes|	        你的 iconfont.cn 账号（邮箱/手机号）|
|password	  | Yes	 |       你的 iconfont.cn 密码|
|pid	     |    Yes	|        项目 ID（在项目 URL 中找到）|
|localPath	 |  Yes	     |   本地图标文件保存目录|
|files	    |  No	      |    逗号分隔的文件列表（默认：所有同步的文件列表）|


如何获取项目 ID (pid)
1. 登录 iconfont.cn
2. 进入你的项目
3. 查看 URL：https://www.iconfont.cn/manage/index?manage_type=myprojects&projectId=12345678
4. projectId 参数值即为 pid

输出示例
```text
╔════════════════════════════════════════════════╗
║         Iconfont 同步工具 v1.0.0               ║
╚════════════════════════════════════════════════╝

🔑 正在登录 iconfont...
✅ 登录成功
📥 正在下载图标包...
✅ 下载完成
📦 正在解压图标包...
✅ 解压完成

🔍 开始比较文件差异...
   本地路径: /path/to/icons
   对比文件: iconfont.css,iconfont.js
   📝 注意: 文本文件会忽略时间戳差异，字体文件根据 CSS 变化判断

   🔄 iconfont.css - 已更新
   ✓  iconfont.js - 无变化

══════════════════════════════════════════════════
📊 同步统计
══════════════════════════════════════════════════
   🔄 更新: 1 个文件
      - iconfont.css
   ✓  无变化: 1 个文件
══════════════════════════════════════════════════
🎉 同步完成！有文件被更新。
```

License
MIT

---

## 4. LICENSE
MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 最终目录结构
```text
iconfont-sync-mcp/
├── bin/
│ └── cli.cjs # 命令行入口
├── src/
│ └── server.cjs # 核心同步逻辑
├── index.cjs # MCP 服务器入口
├── package.json
├── README.md
└── LICENSE
```