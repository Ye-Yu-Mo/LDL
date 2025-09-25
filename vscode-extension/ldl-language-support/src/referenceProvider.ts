import * as vscode from 'vscode';
import { LDLParser, LDLSymbol } from './parser';

export class LDLReferenceProvider implements vscode.ReferenceProvider {
    private parsedDocuments = new Map<string, { parser: LDLParser; lastModified: number }>();

    async provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): Promise<vscode.Location[]> {

        // 获取当前光标下的词
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return [];

        const word = document.getText(wordRange);
        if (!word) return [];

        // 解析当前文档找到符号定义信息
        const currentParser = await this.getParserForDocument(document);
        const currentSymbols = currentParser.findAllSymbols(word);

        // 如果没找到定义，可能是引用，继续查找
        const allReferences: vscode.Location[] = [];

        // 查找所有.ldl文件
        const ldlFiles = await vscode.workspace.findFiles('**/*.ldl', '**/node_modules/**');

        for (const file of ldlFiles) {
            if (token.isCancellationRequested) break;

            try {
                const doc = await vscode.workspace.openTextDocument(file);
                const parser = await this.getParserForDocument(doc);

                // 在当前文档中查找所有对该符号的引用
                const references = this.findReferencesInDocument(doc, word, parser);

                // 如果包含定义且context.includeDeclaration为true，也包括定义位置
                if (context.includeDeclaration) {
                    const definitions = parser.findAllSymbols(word);
                    for (const definition of definitions) {
                        allReferences.push(new vscode.Location(file, definition.position));
                    }
                }

                // 添加所有引用
                allReferences.push(...references.map(ref => new vscode.Location(file, ref)));

            } catch (error) {
                console.error(`Error parsing ${file.toString()}:`, error);
            }
        }

        return allReferences;
    }

    private findReferencesInDocument(
        document: vscode.TextDocument,
        symbolName: string,
        parser: LDLParser
    ): vscode.Position[] {
        const references: vscode.Position[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];

            // 使用正则表达式查找符号引用
            // 匹配函数调用、变量使用、类型引用等
            const patterns = [
                // 函数调用: symbolName(...)
                new RegExp(`\\b${this.escapeRegex(symbolName)}\\s*\\(`, 'g'),
                // 变量引用: symbolName (不在定义语句中)
                new RegExp(`\\b${this.escapeRegex(symbolName)}\\b(?!\\s*[:(=])`, 'g'),
                // 类型引用: : symbolName 或 extends symbolName
                new RegExp(`(?::|extends)\\s+${this.escapeRegex(symbolName)}\\b`, 'g'),
                // 点语法引用: obj.symbolName 或 Class.symbolName
                new RegExp(`\\.\\s*${this.escapeRegex(symbolName)}\\b`, 'g')
            ];

            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    // 跳过注释中的匹配
                    if (this.isInComment(line, match.index)) {
                        continue;
                    }

                    // 跳过字符串字面量中的匹配
                    if (this.isInString(line, match.index)) {
                        continue;
                    }

                    // 计算符号在匹配中的实际位置
                    const symbolMatch = match[0].match(new RegExp(`\\b${this.escapeRegex(symbolName)}\\b`));
                    if (symbolMatch && symbolMatch.index !== undefined) {
                        const symbolStart = match.index + symbolMatch.index;
                        const position = new vscode.Position(lineIndex, symbolStart);

                        // 避免重复添加相同位置的引用
                        if (!references.some(ref => ref.line === position.line && ref.character === position.character)) {
                            references.push(position);
                        }
                    }
                }
            }
        }

        return references;
    }

    private isInComment(line: string, position: number): boolean {
        // 检查是否在行注释中
        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1 && position >= commentIndex) {
            return true;
        }

        // 检查是否在文档注释中
        const docCommentIndex = line.indexOf('///');
        if (docCommentIndex !== -1 && position >= docCommentIndex) {
            return true;
        }

        // TODO: 添加块注释检查 /* ... */

        return false;
    }

    private isInString(line: string, position: number): boolean {
        // 简单检查是否在字符串字面量中
        // 计算position之前的引号数量
        let inString = false;
        let inSingleQuote = false;
        let inDoubleQuote = false;

        for (let i = 0; i < position && i < line.length; i++) {
            const char = line[i];
            if (char === '"' && !inSingleQuote) {
                inDoubleQuote = !inDoubleQuote;
                inString = inDoubleQuote || inSingleQuote;
            } else if (char === "'" && !inDoubleQuote) {
                inSingleQuote = !inSingleQuote;
                inString = inDoubleQuote || inSingleQuote;
            }
        }

        return inString;
    }

    private escapeRegex(text: string): string {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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