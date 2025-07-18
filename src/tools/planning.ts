import { DynamicTool } from "@langchain/core/tools"

export const planningTool = new DynamicTool({
    name: "Planning",
    description: "对用户的问题进行拆解",
    func: async (_query: string) => {
      
    }
})