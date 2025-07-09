import { Milvus } from "@langchain/community/vectorstores/milvus";
import { OpenAIEmbeddings } from "@langchain/openai";

import { HttpsProxyAgent } from "https-proxy-agent";

import dotenv from "dotenv";

const proxyAgent = new HttpsProxyAgent("http://127.0.0.1:54706");

// 加载环境变量
dotenv.config();
export const func = async () => {

  // 初始化 Embedding 模型
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: '',
    modelName: "Qwen/Qwen3-Embedding-8B",
    configuration: {
      httpAgent: proxyAgent,
      baseURL: "http://10.1.4.136:8100/v1", // OpenAI API 基础 URL
    },
  });

  // 配置 Milvus 参数
  // const vectorStore = await Milvus.fromDocuments(
  //   documents,
  //   embeddings, 
  //   {
  //   url: "http://10.1.1.241:19530", // Milvus 地址
  //   collectionName: "yttlj", // 指定 collection name 为 yttlj
  //   textField: "content",
  //   vectorField: "embedding",
  //   indexCreateOptions: {
  //     metric_type: "COSINE",
  //     index_type: "IVF_FLAT",
  //       params: {
  //           nlist: 128, // 可根据需要调整
  //       },
  //   },
  // });
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

  const query = "Which traditional financial institutions (like JPMorgan, Goldman Sachs) or payment giants (like Visa, PayPal) have made new moves or partnerships in the Web3 space recently?";

  const results = await vectorStore.similaritySearchWithScore(query, 2);
  console.log(JSON.stringify(results, null, 2));

  // const vectorStore = await Milvus.fromExistingCollection(
  //     new OpenAIEmbeddings({

  //         modelName: 'text-embedding-3-small',
  //         configuration: {
  //             httpAgent: proxyAgent,
  //         },
  //     }),
  //     {
  //         // collectionName: "ai_concepts",
  //         // url: 'http://10.150.0.2:19530',
  //         url: 'http://10.1.1.241:19530',
  //         collectionName: 'AlfaVectorStore',
  //         // url: 'http://34.86.24.210:19530',
  //         textField: 'content',
  //         vectorField: 'embedding',
  //         indexCreateOptions: {
  //             metric_type: 'COSINE', // 使用 L2 距离
  //             index_type: 'IVF_FLAT',
  //         },
  //     },
  // );
  // const query = 'Further information: History of bitcoin and Cryptocurrency bubble';

  // console.log('query: ', query);

  // const response = await vectorStore.similaritySearchWithScore(query);
  // const response = await vectorStore.similaritySearch("What is 人工");

  // console.log(response);
}