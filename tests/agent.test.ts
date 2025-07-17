import { describe, it, expect } from "@jest/globals";
import { route } from "../src/agent/graph.js";
describe("Routers", () => {
  it("Test route", async () => {
    const res = route({
      messages: [], model: "gpt-4o",
      resources: [],
      logs: [],
      research_question: "",
      report: "",
      classification: "",
      query: "",
      task: "",
      thoughts: [],
      actions: [],
      observations: [],
      total: 4,
      iteration: 0,
      errorCount: 0,
      finalAnswer: "",
      tools: []
    });
    expect(res).toEqual("callModel");
  }, 100_000);
});
