import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const mcpServerHost = process.env.MCP_SERVER_HOST_API_URL;

const client = new MultiServerMCPClient({
  kol: {
    url: `${mcpServerHost}/mcp/kol/sse`,
    transport: "sse",
  },
  holder_wave: {
    url: `${mcpServerHost}/mcp/holder-wave/sse`,
    transport: "sse",
  },
  tokens: {
    url: `${mcpServerHost}/mcp/tokens/sse`,
    transport: "sse",
  },
  //
  smartflow: {
    url: `${mcpServerHost}/mcp/smartflow/sse`,
    transport: "sse",
  },
  swallet: {
    url: `${mcpServerHost}/mcp/swallet/sse`,
    transport: "sse",
  },
  pumpnow: {
    url: `${mcpServerHost}/mcp/pumpnow/sse`,
    transport: "sse",
  },
  memepulse: {
    url: `${mcpServerHost}/mcp/memepulse/sse`,
    transport: "sse",
  },
  drainalert: {
    url: `${mcpServerHost}/mcp/drainalert/sse`,
    transport: "sse",
  },
  defillama: {
    url: `${mcpServerHost}/mcp/defillama/sse`,
    transport: "sse",
  },
  coinmarket: {
    url: `${mcpServerHost}/mcp/coinmarket/sse`,
    transport: "sse",
  },
  coingecko: {
    url: `${mcpServerHost}/mcp/coingecko/sse`,
    transport: "sse",
  },
  coinglass: {
    url: `${mcpServerHost}/mcp/coinglass/sse`,
    transport: "sse",
  },
});

export const getMcpTools = () => {
    return client.getTools()
}
