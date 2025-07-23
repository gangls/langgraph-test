import { AgentState } from "../agent/state.js";
import { TavilySearch } from "@langchain/tavily";

import { RetrieveCryptoWhitepaperKnowledgeTool } from "./milvus/RetrieveCryptoWhitepaperKnowledgeTool.js";
import { RetrieveDeveloperDocumentationKnowledgeTool } from "./milvus/RetrieveDeveloperDocumentationKnowledgeTool.js";
import { ToolMessage } from "@langchain/core/messages";
import { getMcpTools } from "./mcp.js";

const tavily = new TavilySearch({ maxResults: 3, tavilyApiKey: process.env.TAVILY_API_KEY });

// const vectorStoreTool = new VectorStoreTool();
const retrieveCryptoWhitepaperKnowledgeTool =
  new RetrieveCryptoWhitepaperKnowledgeTool();
const retrieveDeveloperDocumentationKnowledgeTool =
  new RetrieveDeveloperDocumentationKnowledgeTool();
export const tools = [
  retrieveCryptoWhitepaperKnowledgeTool,
  retrieveDeveloperDocumentationKnowledgeTool,
  tavily,
];

export const getTools = async () => {
  const mcpTools = await getMcpTools();
  const tools = [
    retrieveCryptoWhitepaperKnowledgeTool,
    retrieveDeveloperDocumentationKnowledgeTool,
    tavily,
    ...mcpTools,
  ];
  return tools;
};




export const tools_node = async (state: AgentState) => {
  const toolMap = new Map(state.tools.map((tool) => [tool.name, tool]));
  const lastAction = state.actions[state.actions.length - 1];
  tools[0].description;
  if (lastAction.name === "FINAL_ANSWER") {
    return state;
  }

  const tool = toolMap.get(lastAction.name);
  if (!tool) {
    state.observations.push(`错误: 未知工具 ${lastAction.name}`);
    state.errorCount += 1;
    return state;
  }

  try {
    // 执行工具
    const params = lastAction.parameters;
    const result = await tool.invoke(params);

    state.messages.push(new ToolMessage({content: result, name: tool.name}, tool.name));

    state.observations.push(result);
  } catch (error) {
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : String(error);
    state.observations.push(`工具 ${tool.name} 错误: ${errorMessage}`);
    state.errorCount += 1;
  }

  return state;
};
