import { tokenizeWithProtectedPhrases, withDict } from ".";
import { readFileSync } from 'fs'
import path from 'path';

const main = async () => {
    const dictContent = readFileSync(path.join(__dirname, "dict.txt"), "utf-8")
    const lines = dictContent.split('\n');
    withDict(lines)
// 使用示例
const text = `加密货币趋势：
1. meme coin 持续走强
2. nft art 市场复苏
3. defi protocol 创新高
4. web3 gaming 用户激增
5. ai agent 集成新功能`;

console.log("原始文本:");
console.log(text);

console.log("\n分词结果:");
console.log(tokenizeWithProtectedPhrases(text));

}

main()