#!/usr/bin/env node

/**
 * Iconfont Sync CLI
 * 命令行直接同步入口
 */

const startSync = require('../src/server.cjs');

startSync()
  .then((result) => {
    if (result.isError) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  });