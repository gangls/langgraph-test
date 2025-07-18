import { AgentState } from "./agent/state.js"
import { getModel } from "./model.js";
import { answerInstructions } from "./prompts.js";

export const answer_node = async (state: AgentState) => {
    const {messages} = state;
    const model = getModel(state);
    const prompts = answerInstructions({researchTopic: state.task, summaries: messages.map(m => m.content).join("\n") });

    const result = await model.invoke(prompts)

    state.finalAnswer = result.content.toString();

    return state;
}