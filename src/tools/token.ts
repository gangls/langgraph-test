import { Milvus } from "@langchain/community/vectorstores/milvus";
import { OpenAIEmbeddings } from "@langchain/openai";
import { z } from "zod";

import { HttpsProxyAgent } from "https-proxy-agent";
import { DynamicTool, StructuredTool } from "@langchain/core/tools";
import { tokenizeWithProtectedPhrases } from "../jieba/index.js";

const proxyAgent = new HttpsProxyAgent("http://127.0.0.1:54706");

enum kg_category {
  'ProjectWhitepapers' = 'Project Whitepapers',
  'SecurityAuditReports' = 'Security Audit Reports',
  'TokenomicsDocuments/Explainers' = 'Tokenomics Documents/Explainers',
  'ReputableNewsFeeds' = 'Reputable News Feeds',
  'AcademicCryptoResearch' = 'Academic Crypto Research',
  'On-ChainAnalyticsReports' = 'On-Chain Analytics Reports',
  'SmartContractCodeRepositories' = 'Smart Contract Code Repositories',
  'DeveloperDocumentation' = 'Developer Documentation',
  'EducationalContent' = 'Educational Content',
  'BasicKnowledge' = 'Basic Knowledge',
  'TokenInfo' = 'token',
  'ProjectInfo' = 'project',
  'kol' = 'kol',
}

export type Category = keyof typeof categoryMap;

const subjectOne = [
  kg_category.ProjectWhitepapers,
  kg_category.DeveloperDocumentation,
  kg_category.EducationalContent,
  kg_category.AcademicCryptoResearch,
  kg_category.BasicKnowledge
];

const subjectTwo = [
  kg_category.TokenInfo,
  kg_category.ProjectInfo,
  kg_category.kol,
  kg_category['On-ChainAnalyticsReports'],
];


const subjectThree = [
  kg_category.ReputableNewsFeeds,
  kg_category.ProjectInfo,
  kg_category.kol
]

const categoryMap = {
  "Concept & How-To": subjectOne,
  "Data Query": subjectTwo,
  "News & Events": subjectThree,
}
export const getVectorStoreFilter = (category?: Category) => {
  if (!category) {
    return "";
  }
  const subjects = categoryMap[category];
  if (!subjects) {
    throw new Error(`Unsupported category: ${category}`);
  }
  return  subjects.map((subject) => {
    return `kg_category == "${subject}"`;
  }).join(' OR ');  
}

export const tokenTool = new DynamicTool({
  name: "token_search",
  description: "对用户输入的查询（query）进行分词, 通过分词检索token",
  
  func: async (query: string) => {
    // 实际实现中应调用真实向量库
    // 初始化 Embedding 模型
    const keywords = tokenizeWithProtectedPhrases(query);
    const filter = `kg_category == "token" && (${keywords.map((keyword) => `title == "${keyword}"`).join(' OR ')})`;
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

    const results = await vectorStore.similaritySearchWithScore(query, 4, filter);
    console.log(JSON.stringify(results, null, 2));

    return results.map(([doc]) => doc?.pageContent).join("\n");
  },
});

export class VectorStoreTool extends StructuredTool {
  name = "vector_store_similarity_search";
  description = "对用户输入的查询（query）执行矢量检索，用于查找文档";
  schema = z.object({
    query: z.string(),
    classification: z.enum(["Factual", "Analytical", "Contextual", "Opinion"]).describe("问题类型")
  });

  async _call({query}: { query: string, classification: string }) {
    // 实际实现中应调用真实向量库
    // 初始化 Embedding 模型
    const filter = getVectorStoreFilter("Concept & How-To");
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

    const results = await vectorStore.similaritySearchWithScore(query, 2);
    console.log(JSON.stringify(results, null, 2));

    return results.map(([doc]) => doc?.pageContent).join("\n");
  }
}
