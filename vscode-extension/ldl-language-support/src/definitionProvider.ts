import * as vscode from 'vscode';
import { LDLParser, LDLSymbol } from './parser';

export class LDLDefinitionProvider implements vscode.DefinitionProvider {
    private parsedDocuments = new Map<string, { parser: LDLParser; lastModified: number }>();

    async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Definition | undefined> {

        // 获取当前光标下的词
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return undefined;

        const word = document.getText(wordRange);
        const line = document.lineAt(position.line);
        const lineText = line.text;
        const wordEndIndex = wordRange.end.character;

        // 跳过定义行本身
        const wordStartIndex = wordRange.start.character;
        const beforeWord = lineText.substring(0, wordStartIndex);
        if (beforeWord.trim().match(/^(using|macro|const|fn|pipeline|class)$/) ||
            beforeWord.trim().endsWith('using') ||
            beforeWord.trim().endsWith('macro') ||
            beforeWord.trim().endsWith('const') ||
            beforeWord.trim().endsWith('fn') ||
            beforeWord.trim().endsWith('pipeline') ||
            beforeWord.trim().endsWith('class') ||
            beforeWord.trim().endsWith('extends')) {
            return undefined;
        }

        // 查找所有.ldl文件
        const ldlFiles = await vscode.workspace.findFiles('**/*.ldl', '**/node_modules/**');
        const allDefinitions: vscode.Location[] = [];

        // 检查是否是函数/方法调用
        const isFunctionCall = wordEndIndex < lineText.length && lineText.charAt(wordEndIndex) === '(';

        // 提取版本信息（如果有）
        const versionMatch = lineText.match(new RegExp(`${word}\\s*\\([^)]*version\\s*:\\s*"([^"]+)"`));
        const version = versionMatch ? versionMatch[1] : undefined;

        // 检查是否是方法调用
        const dotMatch = beforeWord.match(/(\w+)\.$/);
        const className = dotMatch ? dotMatch[1] : undefined;

        for (const file of ldlFiles) {
            if (token.isCancellationRequested) break;

            try {
                const doc = await vscode.workspace.openTextDocument(file);
                const parser = await this.getParserForDocument(doc);

                let symbols: LDLSymbol[] = [];

                if (isFunctionCall) {
                    // 查找函数、pipeline和方法
                    symbols = parser.findAllSymbols(word, version, className)
                        .filter(s => s.type === 'function' || s.type === 'pipeline' || s.type === 'method');
                } else {
                    // 查找类、类型别名、宏和常量
                    symbols = parser.findAllSymbols(word)
                        .filter(s => s.type === 'class' || s.type === 'type_alias' ||
                                    s.type === 'macro' || s.type === 'constant');
                }

                // 添加找到的定义
                for (const symbol of symbols) {
                    allDefinitions.push(new vscode.Location(file, symbol.position));
                }
            } catch (error) {
                console.error(`Error parsing ${file.toString()}:`, error);
            }
        }

        // 返回结果
        if (allDefinitions.length === 0) {
            return undefined;
        } else if (allDefinitions.length === 1) {
            return allDefinitions[0];
        } else {
            return allDefinitions;
        }
    }

    private async getParserForDocument(document: vscode.TextDocument): Promise<LDLParser> {
        const uri = document.uri.toString();
        const lastModified = (await vscode.workspace.fs.stat(document.uri)).mtime;

        // 检查缓存
        const cached = this.parsedDocuments.get(uri);
        if (cached && cached.lastModified >= lastModified) {
            return cached.parser;
        }

        // 解析文档
        const parser = new LDLParser();
        parser.parseDocument(document);

        // 更新缓存
        this.parsedDocuments.set(uri, { parser, lastModified });

        return parser;
    }

    // 清理缓存
    clearCache(): void {
        this.parsedDocuments.clear();
    }
}