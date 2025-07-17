import { AgentState } from "../agent/state.js"

// import { DynamicTool } from "@langchain/core/tools";

import { VectorStoreTool, vectorTool } from "../tools/vector.js";

import { TavilySearch } from "@langchain/tavily";
// import { ToolNode } from "@langchain/langgraph/prebuilt";
import { getModel } from "../model.js";
import { RetrieveCryptoWhitepaperKnowledgeTool } from "./milvus/RetrieveCryptoWhitepaperKnowledgeTool.js";
import { InputValues } from "@langchain/core/utils/types";

const tavily = new TavilySearch({ maxResults: 3, tavilyApiKey: process.env.TAVILY_API_KEY });

// const WebSearch = new DynamicTool({
//   name: "WebSearch",
//   description:
//     "Performs a web search to retrieve relevant information based on the input query. This tool helps gather external resources to support research and decision-making.",
//   func: async () => {},
// });

// const vectorStoreTool = new VectorStoreTool();
const retrieveCryptoWhitepaperKnowledgeTool = new RetrieveCryptoWhitepaperKnowledgeTool();
export const tools = [retrieveCryptoWhitepaperKnowledgeTool, tavily];

// const toolNode = new ToolNode([cryptoWhitepaperTool, tavily]);


const toolMap = new Map(tools.map((tool) => [tool.name, tool]));

export const tools_node = async (state: AgentState) => {
    const lastAction = state.actions[state.actions.length - 1];
    tools[0].description
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
      
      state.observations.push(result);
    } catch (error) {
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
        ? String(error.message) 
        : String(error);
      state.observations.push(`工具错误: ${errorMessage}`);
      state.errorCount += 1;
    }
    
    return state;
    
}