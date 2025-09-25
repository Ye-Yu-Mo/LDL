import * as vscode from 'vscode';
import { LDLParser, LDLSymbol } from './parser';

export class LDLWorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
    private parsedDocuments = new Map<string, { parser: LDLParser; lastModified: number }>();

    async provideWorkspaceSymbols(
        query: string,
        token: vscode.CancellationToken
    ): Promise<vscode.SymbolInformation[]> {

        const results: vscode.SymbolInformation[] = [];

        // 查找所有.ldl文件
        const ldlFiles = await vscode.workspace.findFiles('**/*.ldl', '**/node_modules/**');

        for (const file of ldlFiles) {
            if (token.isCancellationRequested) {
                break;
            }

            try {
                const document = await vscode.workspace.openTextDocument(file);
                const parser = await this.getParserForDocument(document);

                // 如果有查询条件，进行过滤
                if (query.trim()) {
                    const symbols = this.filterSymbols(parser, query);
                    for (const symbol of symbols) {
                        results.push(this.createSymbolInformation(symbol, file));
                    }
                } else {
                    // 没有查询条件时返回所有符号
                    const allSymbols = parser.getAllSymbols();
                    for (const symbol of allSymbols) {
                        results.push(this.createSymbolInformation(symbol, file));
                    }
                }
            } catch (error) {
                console.error(`Error parsing ${file.toString()}:`, error);
            }
        }

        return results;
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

    private filterSymbols(parser: LDLParser, query: string): LDLSymbol[] {
        const queryLower = query.toLowerCase();
        const results: LDLSymbol[] = [];

        // 检查是否是按label搜索 (格式: @label:labelname 或 label:labelname)
        const labelMatch = query.match(/^@?label:\s*(.+)$/i);
        if (labelMatch) {
            const labelName = labelMatch[1].trim();
            return parser.findSymbolsByLabel(labelName);
        }

        // 检查是否是按类型搜索 (格式: type:function 或 t:fn)
        const typeMatch = query.match(/^t(?:ype)?:\s*(.+)$/i);
        if (typeMatch) {
            const typeName = typeMatch[1].toLowerCase();
            const allSymbols = parser.getAllSymbols();
            return allSymbols.filter(symbol => {
                return symbol.type.toLowerCase().includes(typeName) ||
                       (typeName === 'fn' && symbol.type === 'function');
            });
        }

        // 常规名称搜索
        const allSymbols = parser.getAllSymbols();
        for (const symbol of allSymbols) {
            // 按名称匹配
            if (symbol.name.toLowerCase().includes(queryLower)) {
                results.push(symbol);
                continue;
            }

            // 按标签匹配
            if (symbol.labels) {
                for (const label of symbol.labels) {
                    if (label.toLowerCase().includes(queryLower)) {
                        results.push(symbol);
                        break;
                    }
                }
            }

            // 按文档注释匹配
            if (symbol.documentation && symbol.documentation.toLowerCase().includes(queryLower)) {
                results.push(symbol);
            }
        }

        return results;
    }

    private createSymbolInformation(symbol: LDLSymbol, uri: vscode.Uri): vscode.SymbolInformation {
        let kind: vscode.SymbolKind;
        let containerName = '';

        switch (symbol.type) {
            case 'function':
                kind = vscode.SymbolKind.Function;
                break;
            case 'pipeline':
                kind = vscode.SymbolKind.Method;
                break;
            case 'class':
                kind = vscode.SymbolKind.Class;
                break;
            case 'method':
                kind = vscode.SymbolKind.Method;
                containerName = symbol.className || '';
                break;
            case 'type_alias':
                kind = vscode.SymbolKind.TypeParameter;
                break;
            case 'macro':
                kind = vscode.SymbolKind.Constant;
                break;
            case 'constant':
                kind = vscode.SymbolKind.Constant;
                break;
            default:
                kind = vscode.SymbolKind.Variable;
        }

        // 构建详细信息
        let detail = '';
        if (symbol.labels && symbol.labels.length > 0) {
            detail = `@${symbol.labels.join(' @')}`;
        }
        if (symbol.version) {
            detail += detail ? ` (v${symbol.version})` : `(v${symbol.version})`;
        }
        if (symbol.documentation) {
            detail += detail ? ` - ${symbol.documentation}` : symbol.documentation;
        }

        const range = new vscode.Range(symbol.position, symbol.position);
        const location = new vscode.Location(uri, range);

        const symbolInfo = new vscode.SymbolInformation(
            symbol.name,
            kind,
            containerName,
            location
        );

        // 添加详细信息到名称中（VS Code限制）
        if (detail) {
            (symbolInfo as any).detail = detail;
        }

        return symbolInfo;
    }

    // 清理缓存
    clearCache(): void {
        this.parsedDocuments.clear();
    }
}