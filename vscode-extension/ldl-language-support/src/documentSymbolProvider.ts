import * as vscode from 'vscode';
import { LDLParser, LDLSymbol } from './parser';

export class LDLDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    private parser = new LDLParser();

    provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentSymbol[]> {

        // 解析文档
        this.parser.parseDocument(document);

        // 获取按label分组的符号
        const symbolsByLabels = this.parser.getSymbolsByLabels();
        const allSymbols = this.parser.getAllSymbols();

        const result: vscode.DocumentSymbol[] = [];

        // 创建按label分组的符号
        for (const [label, symbols] of symbolsByLabels) {
            const labelSymbol = new vscode.DocumentSymbol(
                `📁 ${label}`,
                `${symbols.length} items`,
                vscode.SymbolKind.Namespace,
                this.getSymbolsRange(symbols, document),
                this.getSymbolsRange(symbols, document)
            );

            // 添加该label下的所有符号
            for (const symbol of symbols) {
                const childSymbol = this.createDocumentSymbol(symbol, document);
                if (childSymbol) {
                    labelSymbol.children.push(childSymbol);
                }
            }

            result.push(labelSymbol);
        }

        // 添加没有label的符号
        const unlabeledSymbols = allSymbols.filter(s => !s.labels || s.labels.length === 0);
        if (unlabeledSymbols.length > 0) {
            const unlabeledGroup = new vscode.DocumentSymbol(
                '📄 Unlabeled',
                `${unlabeledSymbols.length} items`,
                vscode.SymbolKind.Namespace,
                this.getSymbolsRange(unlabeledSymbols, document),
                this.getSymbolsRange(unlabeledSymbols, document)
            );

            for (const symbol of unlabeledSymbols) {
                const childSymbol = this.createDocumentSymbol(symbol, document);
                if (childSymbol) {
                    unlabeledGroup.children.push(childSymbol);
                }
            }

            result.push(unlabeledGroup);
        }

        return result;
    }

    private createDocumentSymbol(symbol: LDLSymbol, document: vscode.TextDocument): vscode.DocumentSymbol | undefined {
        const range = this.getSymbolRange(symbol, document);
        const selectionRange = new vscode.Range(symbol.position, symbol.position);

        let kind: vscode.SymbolKind;
        let detail = '';

        switch (symbol.type) {
            case 'function':
                kind = vscode.SymbolKind.Function;
                detail = symbol.version ? `(version: ${symbol.version})` : '';
                break;
            case 'pipeline':
                kind = vscode.SymbolKind.Method;
                break;
            case 'class':
                kind = vscode.SymbolKind.Class;
                detail = symbol.parentClass ? `extends ${symbol.parentClass}` : '';
                break;
            case 'method':
                kind = vscode.SymbolKind.Method;
                detail = symbol.className ? `in ${symbol.className}` : '';
                if (symbol.isStatic) detail = `static ${detail}`;
                if (symbol.version) detail += ` (version: ${symbol.version})`;
                break;
            case 'type_alias':
                kind = vscode.SymbolKind.TypeParameter;
                detail = symbol.aliasType ? `= ${symbol.aliasType}` : '';
                break;
            case 'macro':
                kind = vscode.SymbolKind.Constant;
                detail = symbol.value ? `= ${symbol.value}` : '';
                break;
            case 'constant':
                kind = vscode.SymbolKind.Constant;
                detail = symbol.value ? `= ${symbol.value}` : '';
                break;
            default:
                return undefined;
        }

        // 添加文档注释到detail
        if (symbol.documentation) {
            detail = detail ? `${detail} - ${symbol.documentation}` : symbol.documentation;
        }

        return new vscode.DocumentSymbol(
            symbol.name,
            detail,
            kind,
            range,
            selectionRange
        );
    }

    private getSymbolRange(symbol: LDLSymbol, document: vscode.TextDocument): vscode.Range {
        const line = document.lineAt(symbol.position.line);
        return new vscode.Range(
            symbol.position,
            new vscode.Position(symbol.position.line, line.text.length)
        );
    }

    private getSymbolsRange(symbols: LDLSymbol[], document: vscode.TextDocument): vscode.Range {
        if (symbols.length === 0) {
            return new vscode.Range(0, 0, 0, 0);
        }

        let minLine = symbols[0].position.line;
        let maxLine = symbols[0].position.line;

        for (const symbol of symbols) {
            minLine = Math.min(minLine, symbol.position.line);
            maxLine = Math.max(maxLine, symbol.position.line);
        }

        return new vscode.Range(
            new vscode.Position(minLine, 0),
            new vscode.Position(maxLine, document.lineAt(maxLine).text.length)
        );
    }
}