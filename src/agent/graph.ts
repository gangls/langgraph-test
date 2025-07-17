/**
 * Starter LangGraph.js Template
 * Make this code your own!
 */
import { START, END, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

// import { RunnableConfig } from "@langchain/core/runnables";
import { AgentState, StateAnnotation } from "./state.js";
// import {search_node} from '../search.js'
// import { download_node } from "../download.js";
import { agent_node } from "./chat.js";
// import { getModel } from "../model.js";

import { classifier_node } from "../classifier.js";
import { tools, tools_node } from "../tools/index.js";



// const toolNode = new ToolNode([tools])

/**
 * Define a node, these do the work of the graph and should have most of the logic.
 * Must return a subset of the properties set in StateAnnotation.
 * @param state The current state of the graph.
 * @param config Extra parameters passed into the state graph.
 * @returns Some subset of parameters of the graph state, used to update the state
 * for the edges and nodes executed next.
 */
// const callModel = async (
//   state: typeof StateAnnotation.State,
//   _config: RunnableConfig,
// ): Promise<typeof StateAnnotation.Update> => {
  /**
   * Do some work... (e.g. call an LLM)
   * For example, with LangChain you could do something like:
   *
   * ```bash
   * $ npm i @langchain/anthropic
   * ```
   *
   * ```ts
   * import { ChatAnthropic } from "@langchain/anthropic";
   * const model = new ChatAnthropic({
   *   model: "claude-3-5-sonnet-20240620",
   *   apiKey: process.env.ANTHROPIC_API_KEY,
   * });
   * const res = await model.invoke(state.messages);
   * ```
   *
   * Or, with an SDK directly:
   *
   * ```bash
   * $ npm i openai
   * ```
   *
   * ```ts
   * import OpenAI from "openai";
   * const openai = new OpenAI({
   *   apiKey: process.env.OPENAI_API_KEY,
   * });
   *
   * const chatCompletion = await openai.chat.completions.create({
   *   messages: [{
   *     role: state.messages[0]._getType(),
   *     content: state.messages[0].content,
   *   }],
   *   model: "gpt-4o-mini",
   * });
   * ```
   */
  // const model = getModel(state);
  
//   console.log("Current state:", state);
//   return {
//     messages: [
//       {
//         role: "assistant",
//         content: `Hi there! How are you?`,
//       },
//     ],
//   };
// };

/**
 * Routing function: Determines whether to continue research or end the builder.
 * This function decides if the gathered information is satisfactory or if more research is needed.
 *
 * @param state - The current state of the research builder
 * @returns Either "callModel" to continue research or END to finish the builder
 */
export function route(state: AgentState) {
  // 检查终止条件
      if (state.finalAnswer) return END;
      if (state.iteration >= 4) return END;
      if (state.errorCount >= 2) return END;
      
      return "tools_node";
}

// Finally, create the graph itself.
const builder = new StateGraph(StateAnnotation)
  // Add the nodes to do the work.
  // Chaining the nodes together in this way
  // updates the types of the StateGraph instance
  // so you have static type checking when it comes time
  // to add the edges.
  .addNode("agent_node", agent_node)
  .addNode("classifier_node", classifier_node)
  // .addNode('search_node', search_node)
  .addNode('tools_node', tools_node)
  // .addNode('download_node', download_node)
  // Regular edges mean "always transition to node B after node A is done"
  // The "__start__" and "__end__" nodes are "virtual" nodes that are always present
  // and represent the beginning and end of the builder.
  .addEdge('classifier_node', "agent_node")
  .addEdge(START, "classifier_node")
  // .addEdge('classifier_node', "agent_node")
  // .addEdge("search_node", "callModel")
  // Conditional edges optionally route to different nodes (or end)
  .addConditionalEdges("agent_node", route, [ 'tools_node', END])
  .addEdge("tools_node", "agent_node")
  // .addEdge("search_node", "download_node")
  // .addEdge("download_node", "agent_node");

export const graph = builder.compile();

graph.name = "AlfaGpt Research Builder";
