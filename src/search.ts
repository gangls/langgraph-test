/**
 * Search Node
 */

/**
 * The search node is responsible for searching the internet for information.
 */

import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { AgentState } from "./agent/state.js";
import { RunnableConfig } from "@langchain/core/runnables";
import {
  AIMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { getModel } from "./model.js";
import { searchSearxng } from "./searxng.js";

const ResourceInput = z.object({
  url: z.string().describe("The URL of the resource"),
  title: z.string().describe("The title of the resource"),
  description: z.string().describe("A short description of the resource"),
});

const ExtractResources = tool(() => {}, {
  name: "ExtractResources",
  description: "Extract the 3-5 most relevant resources from a search result.",
  schema: z.object({ resources: z.array(ResourceInput) }),
});

export async function search_node(
  state: AgentState,
  _config: RunnableConfig,
) {
  const aiMessage = state["messages"][
    state["messages"].length - 1
  ] as AIMessage;

  const resources = state["resources"] || [];
  let logs = state["logs"] || [];

  const queries = aiMessage.tool_calls![0]["args"]["queries"];

  for (const query of queries) {
    logs.push({
      message: `Search for ${query}`,
      done: false,
    });
  }
  // const { messages, ...restOfState } = state;


  const search_results = [];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    // const response = await tavilyClient.search(query, {});
    const response = await searchSearxng(query, {
      language: "en",
      engines: ["google"],
    });
    if (response){
      search_results.push(response);
    }
    logs[i]["done"] = true;
  }

  const searchResultsToolMessageFull = new ToolMessage({
    tool_call_id: aiMessage.tool_calls![0]["id"]!,
    content: `Performed search: ${JSON.stringify(search_results)}`,
    name: "Search",
  });

  const searchResultsToolMessage = new ToolMessage({
    tool_call_id: aiMessage.tool_calls![0]["id"]!,
    content: `Performed search.`,
    name: "Search",
  });

  const model = getModel(state);
  const invokeArgs: Record<string, any> = {};
  if (model.constructor.name === "ChatOpenAI") {
    invokeArgs["parallel_tool_calls"] = false;
  }

  logs = [];

  const response = await model.bindTools!([ExtractResources], {
    ...invokeArgs,
    tool_choice: "ExtractResources",
  }).invoke(
    [
      new SystemMessage({
        content: `You need to extract the 3-5 most relevant resources from the following search results.`,
      }),
      ...state["messages"],
      searchResultsToolMessageFull,
    ],
  );

  const aiMessageResponse = response as AIMessage;
  const newResources = aiMessageResponse.tool_calls![0]["args"]["resources"];

  resources.push(...newResources);

  return {
    messages: [
      searchResultsToolMessage,
      aiMessageResponse,
      new ToolMessage({
        tool_call_id: aiMessageResponse.tool_calls![0]["id"]!,
        content: `Resources added.`,
        name: "ExtractResources",
      }),
    ],
    resources,
    logs,
  };
}
