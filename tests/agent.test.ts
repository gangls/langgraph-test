import { describe, it, expect } from "@jest/globals";
import { route } from "../src/agent/graph.js";
describe("Routers", () => {
  it("Test route", async () => {
    const res = route({
      messages: [], model: "gpt-4o",
      resources: [],
      logs: []
    });
    expect(res).toEqual("callModel");
  }, 100_000);
});
