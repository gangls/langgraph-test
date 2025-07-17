// import * as nodejieba from 'nodejieba';
import { Jieba, TfIdf } from "@node-rs/jieba";
import { Buffer } from "buffer";

type PhrasesProps = {
  placeholder: string;
  coin: string;
};

// 初始化分词器
const nodejieba = new Jieba();
const tfIdf = new TfIdf();
// nodejieba.load();

// 定义要保护的短语列表（原始短语 -> 临时形式）
const PROTECTED_PHRASES: Record<string, PhrasesProps> = {
  //   "meme coin": {
  //     placeholder: "meme_coin",
  //     coin: "memecoin",
  //   },
};

// 创建反向映射（临时形式 -> 原始短语）
const REVERSE_MAPPING: Record<string, string> = Object.entries(
  PROTECTED_PHRASES
).reduce((acc, [original, temp]) => {
  acc[temp.placeholder] = original;
  return acc;
}, {} as Record<string, string>);

// 转义正则特殊字符
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const withDict = (arr: string[]) => {
  arr.forEach((item) => {
    PROTECTED_PHRASES[item] = {
      placeholder: item.split(" ").join("_"),
      coin: item.split(" ").join(""),
    };
  });
  // 添加所有自定义词到分词器
  Object.keys(PROTECTED_PHRASES).forEach((key) => {
    const tempForm = PROTECTED_PHRASES[key];
    const dictBuffer = Buffer.from(
      `${tempForm.placeholder} 10000000000`,
      "utf-8"
    );
    nodejieba.loadDict(dictBuffer);
    REVERSE_MAPPING[tempForm.placeholder] = key;
  });

};

// 高级分词函数
export function tokenizeWithProtectedPhrases(text: string): string[] {
  // 构建正则表达式用于一次性替换所有短语
  const protectedRegex = new RegExp(
    Object.keys(PROTECTED_PHRASES)
      .map(escapeRegExp)
      .sort((a, b) => b.length - a.length) // 长短语优先
      .join("|"),
    "gi"
  );
  // 预处理：一次性替换所有保护短语
  const processedText = text.replace(
    protectedRegex,
    (match) => PROTECTED_PHRASES[match.toLowerCase()]?.placeholder || match
  );

  // 分词
  const tokens = tfIdf.extractKeywords(nodejieba, processedText, 100);

  // 后处理：恢复原始短语
  return tokens.map((token) => REVERSE_MAPPING[token.keyword] || token.keyword);
}