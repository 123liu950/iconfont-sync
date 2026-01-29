/**
 * Iconfont 同步脚本
 * 功能：比较远端 iconfont 与本地文件，如有更新则自动替换
 *
 * 使用方法：
 * node scripts/iconfont-sync.cjs --account=你的账号 --password=你的密码 --pid=项目ID --localPath=本地路径 --files=file1.css,file2.js
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const AdmZip = require("adm-zip");
const JSEncrypt = require("jsencrypt");
const axios = require("axios");
const os = require("os");

// ============ 配置区域 ============
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgGa4CR/fcRUFv2r+YdiRXBDGqi4E
0HO1Eu0FqvVJtlvXrrxXGHzul+iFR8zO1xKapNhW60pkEpB/jbXUhog7q0R54cSL
bS+4SRv80M2YAdTkaO+frP2j1LyGtNquw/W7oj0+SskEL+U6Yn1a27uHhGbl4BBf
TM9FXzxEEomKPoMRAgMBAAE=
-----END PUBLIC KEY-----`;

// 默认需要同步的文件列表
const DEFAULT_FILES = [
  "iconfont.css",
  "iconfont.js",
  "iconfont.json",
  "iconfont.ttf",
  "iconfont.woff",
  "iconfont.woff2",
  "iconfont.eot",
  "iconfont.svg",
];

// ============ 全局变量 ============
const globalCookie = {};

// ============ 解析命令行参数 ============
// function parseArgs() {
//   // 优先取配置环境变量
//   const envArgs = process.env || {};
//   if (
//     Object.values(envArgs).length > 0 &&
//     envArgs.account &&
//     envArgs.password &&
//     envArgs.pid &&
//     envArgs.localPath
//   ) {
//     return envArgs;
//   }

//   // 读取命令行参数
//   const args = process.argv.slice(2);
//   const config = {
//     account: "",
//     password: "",
//     pid: "",
//     localPath: "",
//     files: [],
//   };

//   for (const arg of args) {
//     if (arg.startsWith("--")) {
//       const [key, value] = arg.slice(2).split("=");
//       if (key === "files") {
//         config.files = value ? value.split(",").map((f) => f.trim()) : [];
//       } else {
//         config[key] = value || "";
//       }
//     }
//   }

//   return config;
// }
// ============ 解析命令行参数 ============
function parseArgs() {
  const env = process.env || {};
  
  // 检查是否有相关环境变量配置
  if (env.account || env.password || env.pid || env.localPath) {
    const config = {
      account: env.account || '',
      password: env.password || '',
      pid: env.pid || '',
      localPath: env.localPath || '',
      files: []
    };
    
    // 关键修改：将逗号分隔的字符串转为数组
    if (env.files && typeof env.files === 'string') {
      config.files = env.files.split(',').map(f => f.trim()).filter(f => f);
    } else if (Array.isArray(env.files)) {
      config.files = env.files;
    }
    
    return config;
  }
  
  // 读取命令行参数
  const args = process.argv.slice(2);
  const config = {
    account: '',
    password: '',
    pid: '',
    localPath: '',
    files: []
  };

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (key === 'files') {
        config.files = value ? value.split(',').map(f => f.trim()) : [];
      } else {
        config[key] = value || '';
      }
    }
  }

  return config;
}

// ============ 验证配置 ============
function validateConfig(config) {
  const errors = [];

  if (!config.account) {
    errors.push("缺少 --account 参数（iconfont 账号）");
  }
  if (!config.password) {
    errors.push("缺少 --password 参数（iconfont 密码）");
  }
  if (!config.pid) {
    errors.push("缺少 --pid 参数（iconfont 项目 ID）");
  }
  if (!config.localPath) {
    errors.push("缺少 --localPath 参数（本地 iconfont 文件夹路径）");
  }

  if (errors.length > 0) {
    console.error("❌ 配置错误：");
    errors.forEach((err) => console.error(`   - ${err}`));
    console.log("\n📖 使用方法：");
    console.log("   node scripts/iconfont-sync.cjs \\");
    console.log("     --account=your_account \\");
    console.log("     --password=your_password \\");
    console.log("     --pid=your_project_id \\");
    console.log("     --localPath=./src/icons \\");
    console.log("     --files=iconfont.css,iconfont.js");
    process.exit(1);
  }

  // 如果没有指定 files，使用默认列表
  if (config.files.length === 0) {
    config.files = DEFAULT_FILES;
  }

  return config;
}

// ============ Cookie 处理 ============
function getCookieString() {
  return Object.entries(globalCookie)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

function updateGlobalCookie(headers) {
  const cookies = headers["set-cookie"];
  if (!cookies) return;

  for (const cookie of cookies) {
    const [mainPart] = cookie.split("; ");
    if (!mainPart) continue;
    const [key, value] = mainPart.split("=");
    if (key) globalCookie[key] = value || "";
  }
}

// ============ 登录 ============
async function login(config) {
  console.log("🔑 正在登录 iconfont...");

  try {
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(PUBLIC_KEY);
    const encryptedPwd = encrypt.encrypt(config.password);

    if (!encryptedPwd) {
      throw new Error("密码加密失败");
    }

    const resp = await axios.post(
      "https://www.iconfont.cn/api/account/login.json",
      {
        target: config.account,
        password: encryptedPwd,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Node.js) axios/1.6.0",
        },
      },
    );

    if (resp.data.code !== 200) {
      throw new Error(`登录失败: ${resp.data.message || "未知错误"}`);
    }

    updateGlobalCookie(resp.headers);
    console.log("✅ 登录成功");
    return true;
  } catch (error) {
    console.error("❌ 登录失败:", error.message);
    return false;
  }
}

// ============ 下载图标包 ============
async function downloadIcons(config, tempDir) {
  console.log("📥 正在下载图标包...");

  try {
    const resp = await axios.get(
      "https://www.iconfont.cn/api/project/download.zip",
      {
        params: { pid: config.pid },
        headers: {
          Cookie: getCookieString(),
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (Node.js) axios/1.6.0",
        },
        responseType: "arraybuffer",
      },
    );

    updateGlobalCookie(resp.headers);

    const zipPath = path.join(tempDir, "iconfont.zip");
    fs.writeFileSync(zipPath, resp.data);

    console.log("✅ 下载完成");
    return zipPath;
  } catch (error) {
    console.error("❌ 下载失败:", error.message);
    throw error;
  }
}

// ============ 解压图标包 ============
function unzipIcons(zipPath, tempDir) {
  console.log("📦 正在解压图标包...");

  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);

    // 将 font_xxx 文件夹中的文件移动到临时目录根目录
    const items = fs.readdirSync(tempDir);
    for (const item of items) {
      const itemPath = path.join(tempDir, item);
      if (item.startsWith("font_") && fs.statSync(itemPath).isDirectory()) {
        const files = fs.readdirSync(itemPath);
        for (const file of files) {
          const oldPath = path.join(itemPath, file);
          const newPath = path.join(tempDir, file);
          // 跳过目录，只处理文件
          if (fs.statSync(oldPath).isDirectory()) {
            continue;
          }
          if (fs.existsSync(newPath)) {
            fs.unlinkSync(newPath);
          }
          fs.renameSync(oldPath, newPath);
        }
        fs.rmSync(itemPath, { recursive: true, force: true });
      }
    }

    // 删除 zip 文件
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    console.log("✅ 解压完成");
    return true;
  } catch (error) {
    console.error("❌ 解压失败:", error.message);
    throw error;
  }
}

// ============ 规范化文件内容 ============
/**
 * 对文件内容进行规范化处理，去除动态内容（如时间戳）
 * 这样可以避免因时间戳不同而导致的误判
 */
function normalizeContent(content, fileName) {
  // 只对文本文件进行规范化
  const textExtensions = [".css", ".js", ".json", ".html", ".svg"];
  const ext = path.extname(fileName).toLowerCase();

  if (!textExtensions.includes(ext)) {
    // 二进制文件（如 woff, woff2, ttf, eot）不进行规范化
    return content;
  }

  let text = content.toString("utf-8");

  // 1. 去除 CSS 中的时间戳参数，如 ?t=1702345678
  text = text.replace(/\?t=\d+/g, "");

  // 2. 去除 JS 中的时间戳，如 "t": "1702345678" 或 't': '1702345678'
  text = text.replace(/"t"\s*:\s*"\d+"/g, '"t": ""');
  text = text.replace(/'t'\s*:\s*'\d+'/g, "'t': ''");

  // 3. 去除可能的版本号时间戳，如 v=1702345678
  text = text.replace(/[?&]v=\d+/g, "");

  // 4. 去除 iconfont 生成的日期注释，如 /* Created on 2024-01-01 */
  text = text.replace(/\/\*\s*Created on \d{4}-\d{2}-\d{2}.*?\*\//g, "");

  // 5. 去除 font_xxxx 格式的动态文件夹名引用
  text = text.replace(/font_\d+_\w+/g, "font_normalized");

  return Buffer.from(text, "utf-8");
}

// ============ 检查是否为文件 ============
function isFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    const stat = fs.statSync(filePath);
    return stat.isFile();
  } catch (error) {
    return false;
  }
}

// ============ 计算文件 MD5（规范化后）============
function getFileMD5(filePath, fileName, normalize = true) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  // 检查是否是目录
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      return null;
    }
  } catch (error) {
    return null;
  }

  let content = fs.readFileSync(filePath);

  if (normalize && fileName) {
    content = normalizeContent(content, fileName);
  }

  return crypto.createHash("md5").update(content).digest("hex");
}

// ============ 判断是否为二进制文件 ============
function isBinaryFile(fileName) {
  const binaryExtensions = [".woff", ".woff2", ".ttf", ".eot", ".otf"];
  const ext = path.extname(fileName).toLowerCase();
  return binaryExtensions.includes(ext);
}

// ============ 获取关联的 CSS 文件变化状态 ============
function shouldUpdateBinaryBasedOnCSS(fileName, config, tempDir) {
  // 如果是字体文件，检查对应的 CSS 文件是否有变化
  // 如果 CSS 有变化，说明图标有实际更新，字体文件也需要更新
  if (!isBinaryFile(fileName)) {
    return null; // 非二进制文件，返回 null 表示需要正常比较
  }

  const cssFileName = "iconfont.css";
  const remoteCssPath = path.join(tempDir, cssFileName);
  const localCssPath = path.join(config.localPath, cssFileName);

  if (!isFile(remoteCssPath)) {
    return null; // CSS 不存在或不是文件，正常比较
  }

  const remoteCssMD5 = getFileMD5(remoteCssPath, cssFileName, true);
  const localCssMD5 = getFileMD5(localCssPath, cssFileName, true);

  // 如果 CSS 内容（去除时间戳后）相同，则字体文件也视为相同
  if (remoteCssMD5 === localCssMD5) {
    return false; // 不需要更新
  }

  return true; // CSS 有变化，需要更新字体
}

// ============ 比较并更新文件 ============
function compareAndUpdate(config, tempDir) {
  console.log("\n🔍 开始比较文件差异...");
  console.log(`   本地路径: ${config.localPath}`);
  console.log(`   对比文件: ${config.files}`);
  console.log(
    "   📝 注意: 文本文件会忽略时间戳差异，字体文件根据 CSS 变化判断",
  );
  console.log("");

  const results = {
    updated: [],
    added: [],
    unchanged: [],
    notFound: [],
  };

  // 确保本地目录存在
  if (!fs.existsSync(config.localPath)) {
    fs.mkdirSync(config.localPath, { recursive: true });
    console.log(`📁 创建本地目录: ${config.localPath}`);
  }

  // 遍历需要检查的文件
  for (const fileName of config.files) {
    const remotePath = path.join(tempDir, fileName);
    const localPath = path.join(config.localPath, fileName);

    // 检查远端文件是否存在且是文件（不是目录）
    if (!isFile(remotePath)) {
      results.notFound.push(fileName);
      console.log(`   ⚠️  ${fileName} - 远端不存在或不是文件`);
      continue;
    }

    // 本地文件不存在，需要新增
    if (!fs.existsSync(localPath)) {
      fs.copyFileSync(remotePath, localPath);
      results.added.push(fileName);
      console.log(`   ➕ ${fileName} - 新增文件`);
      continue;
    }

    // 本地路径存在但是目录，跳过
    if (!isFile(localPath)) {
      results.notFound.push(fileName);
      console.log(`   ⚠️  ${fileName} - 本地路径是目录而非文件`);
      continue;
    }

    // 对于二进制字体文件，根据 CSS 文件的变化来判断是否需要更新
    if (isBinaryFile(fileName)) {
      const shouldUpdate = shouldUpdateBinaryBasedOnCSS(
        fileName,
        config,
        tempDir,
      );

      if (shouldUpdate === false) {
        // CSS 无变化，字体文件也视为无变化
        results.unchanged.push(fileName);
        console.log(`   ✓  ${fileName} - 无变化 (基于 CSS 判断)`);
        continue;
      } else if (shouldUpdate === true) {
        // CSS 有变化，更新字体文件
        fs.copyFileSync(remotePath, localPath);
        results.updated.push(fileName);
        console.log(`   🔄 ${fileName} - 已更新 (CSS 已变化)`);
        continue;
      }
      // shouldUpdate === null，走正常比较流程
    }

    // 使用规范化后的内容进行 MD5 比较（去除时间戳等动态内容）
    const remoteMD5 = getFileMD5(remotePath, fileName, true);
    const localMD5 = getFileMD5(localPath, fileName, true);

    if (remoteMD5 !== localMD5) {
      // 文件内容不同，需要更新
      fs.copyFileSync(remotePath, localPath);
      results.updated.push(fileName);
      console.log(`   🔄 ${fileName} - 已更新`);
    } else {
      // 文件相同，无需更新
      results.unchanged.push(fileName);
      console.log(`   ✓  ${fileName} - 无变化`);
    }
  }

  return results;
}

// ============ 清理临时目录 ============
function cleanupTempDir(tempDir) {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.warn("⚠️  清理临时目录失败:", error.message);
  }
}

// ============ 打印统计结果 ============
function printSummary(results) {
  console.log("\n" + "═".repeat(50));
  console.log("📊 同步统计");
  console.log("═".repeat(50));

  let syncedInfo = {};

  if (results.added.length > 0) {
    syncedInfo.addedText = `新增: ${results.added.length} 个文件`;
    console.log(`   ➕ 新增: ${results.added.length} 个文件`);
    results.added.forEach((f) => {
      console.log(`      - ${f}`);
      syncedInfo.addedText += `\n      - ${f}`;
    });
  }

  if (results.updated.length > 0) {
    syncedInfo.updatedText = `更新: ${results.updated.length} 个文件`;
    console.log(`   🔄 更新: ${results.updated.length} 个文件`);
    results.updated.forEach((f) => {
      console.log(`      - ${f}`);
      syncedInfo.updatedText += `\n      - ${f}`;
    });
  }

  if (results.unchanged.length > 0) {
    syncedInfo.unchangedText = `无变化: ${results.unchanged.length} 个文件`;
    console.log(`   ✓  无变化: ${results.unchanged.length} 个文件`);
  }

  if (results.notFound.length > 0) {
    syncedInfo.notFoundText = `远端不存在: ${results.notFound.length} 个文件`;
    console.log(`   ⚠️  远端不存在: ${results.notFound.length} 个文件`);
    results.notFound.forEach((f) => {
      console.log(`      - ${f}`);
      syncedInfo.notFoundText += `\n      - ${f}`;
    });
  }

  console.log("═".repeat(50));

  const hasChanges = results.added.length > 0 || results.updated.length > 0;
  if (hasChanges) {
    console.log("🎉 同步完成！有文件被更新。");
  } else {
    console.log("ℹ️  同步完成！所有文件已是最新。");
  }

  return syncedInfo;
}

// ============ 主函数 ============
async function startSync() {
  console.log("");
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║         Iconfont 同步工具 v1.0.0               ║");
  console.log("╚════════════════════════════════════════════════╝");
  console.log("");

  let syncedInfo = {};

  // 解析并验证配置
  const config = validateConfig(parseArgs());

  // 转换为绝对路径
  config.localPath = path.resolve(process.cwd(), config.localPath);

  // 创建临时目录
  const tempDir = path.join(os.tmpdir(), `iconfont-sync-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // 1. 登录
    const loginSuccess = await login(config);
    if (!loginSuccess) {
      throw new Error("登录失败，请检查账号密码");
    }

    // 2. 下载图标包
    const zipPath = await downloadIcons(config, tempDir);

    // 3. 解压
    unzipIcons(zipPath, tempDir);

    // 4. 比较并更新文件
    const results = compareAndUpdate(config, tempDir);

    // 5. 打印统计结果
    syncedInfo = printSummary(results);

    // 6. 返回退出码
    const hasErrors = results.notFound.length === config.files.length;
    // process.exit(hasErrors ? 1 : 0);
  } catch (error) {
    console.error("\n❌ 同步失败:", error.message);
    syncedInfo = {
      isError: true,
      error: error.message,
    };
  } finally {
    // 清理临时目录
    cleanupTempDir(tempDir);

    return syncedInfo;
  }
}

// 启动
// startSync();

module.exports = startSync;
