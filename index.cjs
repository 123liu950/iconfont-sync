const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
    StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const startSync = require("./src/server.cjs");


// ============ 创建 MCP Server ============
function createServer(apiKeyGetter) {
    const server = new McpServer({
        name: "iconfont-sync-mcp-server",
        version: "1.0.0",
    });

    // 工具: 自动同步阿里 iconfont 项目文件
    server.tool(
        "iconfont-sync",
        "CLI tool for automatically synchronizing Ali iconfont project files to the local area, which supports comparing file differences (ignoring timestamps) and automatically updating new/changed files. / 自动同步阿里 iconfont 项目文件到本地的 CLI 工具，支持对比文件差异（忽略时间戳）、自动更新新增/变更文件",
        {},
        async () => {
            try {
                console.error("[iconfont-sync] Starting...");
                const syncedInfo = await startSync();
                console.error("[iconfont-sync] Synced:", syncedInfo);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(syncedInfo, null, 2),
                        },
                    ],
                };
            } catch (error) {
                console.error(`[Error] iconfont-sync:`, error.message);
                return {
                    isError: true,
                    content: [{ type: "text", text: `Query failed: ${error.message}` }],
                };
            }
        }
    );

    return server;
}

// ============ 主启动逻辑 ============
async function main() {
    // STDIO 模式
    console.error("[STDIO] Starting...");
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[STDIO] Connected");
}

main().catch((error) => {
    console.error("[Fatal]", error);
    process.exit(1);
});