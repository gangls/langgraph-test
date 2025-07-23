import { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import { Tool } from "@langchain/core/tools";
import { Document } from 'langchain/document';
import { Annotation, messagesStateReducer } from "@langchain/langgraph";


const ResourceAnnotation = Annotation.Root({
  url: Annotation<string>,
  title: Annotation<string>,
  description: Annotation<string>,
  content: Annotation<string>,
});

const LogAnnotation = Annotation.Root({
  message: Annotation<string>,
  done: Annotation<boolean>,
});

// const AgentAnnotation = Annotation.Root({
//   task: Annotation<string>,
//   thoughts: Annotation<string[]>,
//   actions: Annotation<Array<{
//     name: string;
//     parameters: Record<string, unknown>;
//   }>>,
//   observations: Annotation<unknown[]>,
//   iteration: Annotation<number>,
//   errorCount: Annotation<number>,
//   finalAnswer: Annotation<string>,
// });
/**
 * A graph's StateAnnotation defines three main things:
 * 1. The structure of the data to be passed between nodes (which "channels" to read from/write to and their types)
 * 2. Default values for each field
 * 3. Reducers for the state's. Reducers are functions that determine how to apply updates to the state.
 * See [Reducers](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#reducers) for more information.
 */

// This is the primary state of your agent, where you can store any information
export const StateAnnotation = Annotation.Root({
  /**
   * Messages track the primary execution state of the agent.
   *
   * Typically accumulates a pattern of:
   *
   * 1. HumanMessage - user input
   * 2. AIMessage with .tool_calls - agent picking tool(s) to use to collect
   *     information
   * 3. ToolMessage(s) - the responses (or errors) from the executed tools
   *
   *     (... repeat steps 2 and 3 as needed ...)
   * 4. AIMessage without .tool_calls - agent responding in unstructured
   *     format to the user.
   *
   * 5. HumanMessage - user responds with the next conversational turn.
   *
   *     (... repeat steps 2-5 as needed ... )
   *
   * Merges two lists of messages or message-like objects with role and content,
   * updating existing messages by ID.
   *
   * Message-like objects are automatically coerced by `messagesStateReducer` into
   * LangChain message classes. If a message does not have a given id,
   * LangGraph will automatically assign one.
   *
   * By default, this ensures the state is "append-only", unless the
   * new message has the same ID as an existing message.
   *
   * Returns:
   *     A new list of messages with the messages from \`right\` merged into \`left\`.
   *     If a message in \`right\` has the same ID as a message in \`left\`, the
   *     message from \`right\` will replace the message from \`left\`.`
   */
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  model: Annotation<string>,
  resources: Annotation<(typeof ResourceAnnotation.State)[]>,
  logs: Annotation<(typeof LogAnnotation.State)[]>,
  research_question: Annotation<string>,
  report: Annotation<string>,
  classification: Annotation<string>,
  query: Annotation<string>,
  // ReAct state  
  task: Annotation<string>,
  thoughts: Annotation<string[]>,
  actions: Annotation<Array<{
    name: string;
    parameters: Record<string, unknown>;
  }>>,
  observations: Annotation<unknown[]>,
  total: Annotation<number>,
  iteration: Annotation<number>,
  errorCount: Annotation<number>,
  finalAnswer: Annotation<string>,
  tools: Annotation<Tool[]>,
  tokens: Annotation<Document[]>,
  // agent: Annotation<typeof AgentAnnotation.State>,
  /**
   * Feel free to add additional attributes to your state as needed.
   * Common examples include retrieved documents, extracted entities, API connections, etc.
   *
   * For simple fields whose value should be overwritten by the return value of a node,
   * you don't need to define a reducer or default.
   */
  // additionalField: Annotation<string>,
});

export type AgentState = typeof StateAnnotation.State;
export type Resource = typeof ResourceAnnotation.State;
