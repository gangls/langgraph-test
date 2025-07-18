import { AgentState } from "../agent/state.js"

// import { DynamicTool } from "@langchain/core/tools";


// import { ToolNode } from "@langchain/langgraph/prebuilt";
import { RetrieveCryptoWhitepaperKnowledgeTool } from "./milvus/RetrieveCryptoWhitepaperKnowledgeTool.js";
import { StructuredTool } from "@langchain/core/tools";


// const WebSearch = new DynamicTool({
//   name: "WebSearch",
//   description:
//     "Performs a web search to retrieve relevant information based on the input query. This tool helps gather external resources to support research and decision-making.",
//   func: async () => {},
// });

// const vectorStoreTool = new VectorStoreTool();
const retrieveCryptoWhitepaperKnowledgeTool = new RetrieveCryptoWhitepaperKnowledgeTool();
export const tools = [retrieveCryptoWhitepaperKnowledgeTool];

// const toolNode = new ToolNode([cryptoWhitepaperTool, tavily]);


const toolMap: Map<string, StructuredTool> = new Map(tools.map((tool) => [tool.name, tool]));

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
      state.observations.push(`工具 ${tool.name} 错误: ${errorMessage}`);
      state.errorCount += 1;
    }
    
    return state;
    
}