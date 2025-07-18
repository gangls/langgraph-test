/**
 * Chat Node
 */
import { RunnableConfig } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

import { AgentState } from "./state.js";
import { getModel } from "../model.js";
import { tools } from "../tools/index.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

// const WriteReport = tool(() => {}, {
//   name: "WriteReport",
//   description: "Write the research report.",
//   schema: z.object({ report: z.string() }),
// });

// const WriteResearchQuestion = tool(() => {}, {
//   name: "WriteResearchQuestion",
//   description: "Write the research question.",
//   schema: z.object({ research_question: z.string() }),
// });

// const DeleteResources = tool(() => {}, {
//   name: "DeleteResources",
//   description: "Delete the URLs from the resources.",
//   schema: z.object({ urls: z.array(z.string()) }),
// });

const ResponseSchema = z.object({
  thoughts: z.object({
    reasoning: z.string(),
    criticism: z.string().optional(),
    plan: z.string().optional(),
    error_analysis: z.string().optional(),
  }),
  action: z.object({
    name: z.string(),
    parameters: z.record(z.any()),
  }),
});

const Agent_Prompt = (state: AgentState) => {
  return `
**角色**：你是一个 ReAct 代理，通过 **推理(Reason)** 和 **行动(Act)** 的迭代过程解决问题。请严格遵循以下流程：

### 当前状态
- 任务: ${state.iteration === 0 ? state.task : state.actions[state.actions.length - 1].parameters.query}
- 当前迭代: ${state.iteration}/${state.total}
- 错误计数: ${state.errorCount}/2
- 思考链: ${state.thoughts.slice(-1).join(" → ") || "无"}
- 思考内容: ${JSON.stringify(state.observations.slice(-1)[0]) || "无"}

### actions: 
${state.actions.map((action) => `- ${action.name}: ${JSON.stringify(action.parameters)}`).join("\n") || "无"}

请生成下一步响应：

### 工作流规则
1. **循环执行**：Reason → Act → Observe → Repeat。
2. **状态保持**：始终携带完整的「思考链」和「历史工具结果」
3. **工具使用**：只能使用下方提供的工具，禁止虚构工具

### 可用工具
${tools.map((tool) => `- ${tool.name}: ${tool.description}`)}

### 工具选择指南
1. **优先使用**：如果有直接相关的工具，优先使用。
2. **多工具协作**：如果单个工具无法解决，组合多个工具。
3. **迭代思考**：每次工具调用后，基于结果进行迭代思考。
4. **错误处理**：如果工具失败，分析原因并选择替代方案。
5. 如果遇到需要查询价格走势的时候，请使用工具：tavily_search。

### 响应格式要求（JSON）
{{
  "thoughts": {
    "reasoning": "当前步骤的逻辑分析",
    "criticism": "自我质疑或风险提示",
    "plan": "后续动作规划"
  },
  "action": {{
    "name": "工具名或FINAL_ANSWER",
    "parameters": {{
      "query": "思考内容生成新的问题"，
    }}
  }},
  "answer": "如果是FINAL_ANSWER则填写最终答案"
}}
`;
};

const SYSTEM_PROMPT = (state: AgentState) => {
  if (state.total === state.iteration) {
    return ``;
  }
  return Agent_Prompt(state);
};

export async function agent_node(state: AgentState, config: RunnableConfig) {
  const model = getModel(state);
  const parser = new JsonOutputParser<z.infer<typeof ResponseSchema>>();
  const systemPrompt = SYSTEM_PROMPT(state);

  const response = await model.invoke(
    [
      new SystemMessage(systemPrompt),
      new HumanMessage("请根据当前状态生成下一步操作"),
    ],
    config,
    // customConfig as RunnableConfig,
  );

  // 解析响应
  const parsed = await parser.parse(response.content.toString());

  // 验证响应格式
  const validated = ResponseSchema.parse(parsed);

  // 更新状态
  state.thoughts.push(
    `${validated.thoughts.reasoning} | ${validated.thoughts.criticism || ""}`,
  );

  state.actions.push({
    name: validated.action.name,
    parameters: validated.action.parameters,
  });

  state.iteration += 1;

  // 检查最终答案
  if (validated.action.name === "FINAL_ANSWER") {
    state.finalAnswer = validated.action.parameters.answer;
  }

  return state;

  // return {
  //   messages: [response]
  // }
}
