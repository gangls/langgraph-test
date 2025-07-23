/**
 * Search Node
 */

/**
 * The search node is responsible for searching the internet for information.
 */

import { AgentState, StateAnnotation } from "./agent/state.js";
// import { getModel } from "./model.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { getTools } from "./tools/index.js";
import { tokenizeWithProtectedPhrases } from "./jieba/index.js";
import { getTokens } from "./tools/vector.js";
import { AIMessage } from "@langchain/core/messages";

const classificationPrompt = `
You are a question classification assistant, well-versed in crypto-related knowledge and familiar with the terminology and phrasing habits of people in web3.

Your task is to deeply analyze the intent of a user’s question and then determine the most applicable category based on the following classification labels and descriptions.
**Category Descriptions**
Factual: Queries seeking specific, verifiable information
Analytical: Queries requiring comprehensive analysis or explanation
Opinion: Queries about subjective matters or seeking diverse viewpoints
Contextual: Queries that depend on user-specific context

Output only the classification label without any explanation.

**Here are some examples:**
Input: What is the current market cap of Bitcoin?
Output: Factual

Input: How does blockchain technology impact the security and transparency of cryptocurrency transactions?
Output: Analytical

Input: Which token do you think is most likely to become a mainstream payment method in the next five years?
Output: Opinion

Input: If I have $10,000 to invest in cryptocurrency, how would you suggest allocating funds to balance risk and reward?
Output: Contextual

Input: What are the advantages and disadvantages of DeFi compared to traditional financial systems?
Output: Analytical

Input: Some believe government regulation of cryptocurrency stifles innovation, while others think it protects investors—what’s your take?
Output: Opinion

Input: What are the key features of the Ethereum 2.0 upgrade?
Output: Factual`

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", classificationPrompt],
  ["user", "{query}"]
]);


export async function classifier_node(
  state: AgentState,
// config: RunnableConfig,
) {
  let query = '';
  const { messages } = state;
  const message = messages[messages.length - 1];
  if (message.getType() === 'human'){
    query = message.text;
  }

  const tools = await getTools();

  const tokens = await getTokens(query, 100);

  console.log(tokens)

  // const model = getModel(state);

  // const response = await promptTemplate.pipe(model).invoke({
  //   query,
  // });

  return {
    task: query,
    thoughts: [],
    messages: [
      ...state.messages,
      new AIMessage(
        `${tokens.map((doc) => doc.pageContent).join("\n")}`,
      ),
    ],
    actions: [],
    observations: [],
    total: 4,
    iteration: 0,
    errorCount: 0,
    tools,
    tokens,
    // classification: response.content,
  };
}
