import { Milvus } from "@langchain/community/vectorstores/milvus";
import { OpenAIEmbeddings } from "@langchain/openai";
import { DynamicTool, StructuredTool } from "langchain/tools";
import { z } from "zod";
import { HttpsProxyAgent } from "https-proxy-agent";
import { kg_category } from "../vector.js";

const proxyAgent = new HttpsProxyAgent("http://127.0.0.1:54706");

// Zod schema for input validation
const RetrieveCryptoWhitepaperKnowledgeSchema = z.object({
  query: z
    .string()
    .describe("Natural language query, e.g., 'Difference between PoW and PoS'"),
  topK: z
    .number()
    .optional()
    .describe("Number of top results to return (default: 5)"),
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: "",
  modelName: "Qwen/Qwen3-Embedding-8B",
  configuration: {
    httpAgent: proxyAgent,
    baseURL: "http://10.1.4.136:8100/v1", // OpenAI API 基础 URL
  },
});

const vectorStore = await Milvus.fromExistingCollection(embeddings, {
  url: "http://10.1.4.136:19530", // Milvus 地址
  // url: "http://34.86.24.210:19530",
  // url: "http://10.150.0.2:19530",
  collectionName: "AlfaVectorStore3", // 指定 collection name 为 yttlj
  textField: "content",
  vectorField: "embedding",
  indexCreateOptions: {
    metric_type: "COSINE",
    index_type: "IVF_FLAT",
    params: {
      nlist: 128, // 可根据需要调整
    },
  },
});

// Tool class implementation
export class RetrieveCryptoWhitepaperKnowledgeTool extends StructuredTool<
  typeof RetrieveCryptoWhitepaperKnowledgeSchema
> {
  name = "retrieve_crypto_whitepaper_knowledge";
  description =
    "Searches vector store for cryptocurrency whitepaper content, returning relevant technical details, tokenomics, etc.";
  schema = RetrieveCryptoWhitepaperKnowledgeSchema;
  constructor() {
    super();
  }

  async _call(input: z.infer<typeof RetrieveCryptoWhitepaperKnowledgeSchema>) {
    const filter = `kg_category == "${kg_category.ProjectWhitepapers}"`;
    const { query, topK = 5 } = input;

    const results = await vectorStore.similaritySearchWithScore(
      query,
      topK,
      filter,
    );

    return results.map(([doc]) => doc?.pageContent).join("\n");
  }
}

export const retrieveCryptoWhitepaperKnowledgeTool = new DynamicTool({
  name: "retrieve_crypto_whitepaper_knowledge",
  description:
    "Searches vector store for cryptocurrency whitepaper content, returning relevant technical details, tokenomics, etc.",
  func: async (query: string) => {
    const filter = `kg_category == "${kg_category.ProjectWhitepapers}"`;

    const results = await vectorStore.similaritySearchWithScore(
      query,
      5,
      filter,
    );

    return results.map(([doc]) => doc?.pageContent).join("\n");
  },
});
