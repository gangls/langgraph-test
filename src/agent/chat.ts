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
- 任务: ${state.task}
- 当前迭代: ${state.iteration}/${state.total}
- 错误计数: ${state.errorCount}/2
- 思考链: ${state.thoughts.slice(-3).join(" → ") || "无"}
- 思考内容: ${state.observations.slice(-1)[0] || "无"}

请生成下一步响应：

### 工作流规则
1. **循环执行**：Reason → Act → Observe → Repeat。
2. **状态保持**：始终携带完整的「思考链」和「历史工具结果」
3. **工具使用**：只能使用下方提供的工具，禁止虚构工具

### 可用工具
${tools.map((tool) => `- ${tool.name}: ${tool.description}`)}
- FINAL_ANSWER: 输出最终答案


### 工具选择指南
1. 概念/文档检索：VectorStoreSearch
2. 实时信息：WebSearch

### 响应格式要求（JSON）
{
  "thoughts": {
    "reasoning": "当前步骤的逻辑分析",
    "criticism": "自我质疑或风险提示",
    "plan": "后续动作规划"
  },
  "action": {
    "name": "工具名或FINAL_ANSWER",
    "parameters": {
      "query": "思考内容生成新的问题"，
    }
  },
  "answer": "如果是FINAL_ANSWER则填写最终答案"
}

### 关键指令
1. **强制停止条件**：
   - 获得明确问题答案时返回 FINAL_ANSWER
   - 工具返回错误超过2次

2. **错误处理**：
   工具失败时诊断原因并选择替代方案

3. **安全边界**：
   禁止执行非安全工具，如删除文件、修改系统配置等

4. **知识边界**：
   超出工具能力的问题返回 FINAL_ANSWER: '此问题需要人类协助'
  
5. **数据边界**：
   禁止访问敏感数据，如密码、密钥、隐私数据等

6. **时间边界**：
   禁止执行耗时超过10秒的工具，如数据库查询、API调用等

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
