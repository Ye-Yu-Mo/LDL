import * as vscode from 'vscode';
import { LDLParser, LDLSymbol } from './parser';

export interface ErrorPattern {
    id: string;
    name: string;
    description: string;
    pattern: RegExp;
    severity: vscode.DiagnosticSeverity;
    category: 'syntax' | 'semantic' | 'style' | 'best_practice';
}

export interface FixSuggestion {
    title: string;
    description: string;
    edit: vscode.WorkspaceEdit;
    confidence: number; // 0-100
}

export class LDLErrorDetector {
    private parser = new LDLParser();
    private errorPatterns: ErrorPattern[] = [];
    private diagnostics = vscode.languages.createDiagnosticCollection('ldl');

    constructor() {
        this.initializeErrorPatterns();
    }

    public analyzeDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

        // 解析文档
        this.parser.parseDocument(document);

        // 检查各种类型的错误
        diagnostics.push(...this.checkSyntaxErrors(document));
        diagnostics.push(...this.checkSemanticErrors(document));
        diagnostics.push(...this.checkStyleIssues(document));
        diagnostics.push(...this.checkBestPractices(document));

        // 更新诊断信息
        this.diagnostics.set(document.uri, diagnostics);

        return diagnostics;
    }

    private initializeErrorPatterns(): void {
        this.errorPatterns = [
            // 语法错误
            {
                id: 'missing_semicolon',
                name: '缺少分号',
                description: '语句末尾缺少分号',
                pattern: /^\s*(let|const|return)\s+[^;]+$/m,
                severity: vscode.DiagnosticSeverity.Error,
                category: 'syntax'
            },
            {
                id: 'unmatched_braces',
                name: '括号不匹配',
                description: '花括号、圆括号或方括号不匹配',
                pattern: /[{[(](?:[^{}\[\]()]|[{[(][^{}\[\]()]*[}\])])*[^}\])]/,
                severity: vscode.DiagnosticSeverity.Error,
                category: 'syntax'
            },
            {
                id: 'invalid_function_name',
                name: '无效的函数名',
                description: '函数名必须是有效的标识符',
                pattern: /fn\s+([^a-zA-Z_][^\s(]*|[0-9][^\s(]*)\s*\(/,
                severity: vscode.DiagnosticSeverity.Error,
                category: 'syntax'
            },

            // 语义错误
            {
                id: 'undefined_function',
                name: '未定义的函数',
                description: '调用了未定义的函数',
                pattern: /(\w+)\s*\(/,
                severity: vscode.DiagnosticSeverity.Error,
                category: 'semantic'
            },
            {
                id: 'duplicate_function',
                name: '重复的函数定义',
                description: '函数名重复定义（相同版本）',
                pattern: /fn\s+(\w+)(?!\s*\([^)]*version:)/,
                severity: vscode.DiagnosticSeverity.Warning,
                category: 'semantic'
            },
            {
                id: 'unreachable_code',
                name: '不可达代码',
                description: 'return 语句之后的代码不会被执行',
                pattern: /return\s+[^;]+;?\s*\n\s*[^\s}]/,
                severity: vscode.DiagnosticSeverity.Warning,
                category: 'semantic'
            },

            // 样式问题
            {
                id: 'inconsistent_indentation',
                name: '缩进不一致',
                description: '建议使用一致的缩进风格',
                pattern: /^([ ]{1,3}[^ ]|[ ]{5,7}[^ ]|[ ]{9,11}[^ ])/m,
                severity: vscode.DiagnosticSeverity.Information,
                category: 'style'
            },
            {
                id: 'missing_documentation',
                name: '缺少文档注释',
                description: '公共函数应该有文档注释',
                pattern: /^fn\s+\w+/m,
                severity: vscode.DiagnosticSeverity.Information,
                category: 'style'
            },
            {
                id: 'long_line',
                name: '行过长',
                description: '建议单行不超过100字符',
                pattern: /.{101,}/,
                severity: vscode.DiagnosticSeverity.Information,
                category: 'style'
            },

            // 最佳实践
            {
                id: 'missing_labels',
                name: '缺少标签',
                description: '建议为学习方法添加标签以便分类',
                pattern: /^fn\s+\w+.*\{/m,
                severity: vscode.DiagnosticSeverity.Hint,
                category: 'best_practice'
            },
            {
                id: 'unused_parameter',
                name: '未使用的参数',
                description: '参数定义了但未在函数体中使用',
                pattern: /fn\s+\w+\s*\(([^)]+)\)/,
                severity: vscode.DiagnosticSeverity.Hint,
                category: 'best_practice'
            },
            {
                id: 'magic_number',
                name: '魔法数字',
                description: '建议为数字字面量使用常量',
                pattern: /\b(?!0|1|2)\d{2,}\b/,
                severity: vscode.DiagnosticSeverity.Hint,
                category: 'best_practice'
            }
        ];
    }

    private checkSyntaxErrors(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        for (const pattern of this.errorPatterns.filter(p => p.category === 'syntax')) {
            const matches = [...text.matchAll(new RegExp(pattern.pattern, 'gm'))];
            for (const match of matches) {
                if (match.index !== undefined) {
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);

                    const diagnostic = new vscode.Diagnostic(range, pattern.description, pattern.severity);
                    diagnostic.code = pattern.id;
                    diagnostic.source = 'LDL';
                    diagnostics.push(diagnostic);
                }
            }
        }

        // 特殊检查：括号匹配
        diagnostics.push(...this.checkBracketMatching(document));

        return diagnostics;
    }

    private checkSemanticErrors(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const allSymbols = this.parser.getAllSymbols();
        const functionCalls = this.findFunctionCalls(document);

        // 检查未定义的函数调用
        for (const call of functionCalls) {
            const isDefined = allSymbols.some(s => s.name === call.name);
            if (!isDefined && !this.isBuiltinFunction(call.name)) {
                const diagnostic = new vscode.Diagnostic(
                    call.range,
                    `未定义的函数: ${call.name}`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostic.code = 'undefined_function';
                diagnostic.source = 'LDL';
                diagnostics.push(diagnostic);
            }
        }

        // 检查重复定义
        const functionNames = new Map<string, LDLSymbol[]>();
        for (const symbol of allSymbols.filter(s => s.type === 'function')) {
            if (!functionNames.has(symbol.name)) {
                functionNames.set(symbol.name, []);
            }
            functionNames.get(symbol.name)!.push(symbol);
        }

        for (const [name, symbols] of functionNames.entries()) {
            const sameVersionSymbols = symbols.filter(s => !s.version || s.version === symbols[0].version);
            if (sameVersionSymbols.length > 1) {
                for (let i = 1; i < sameVersionSymbols.length; i++) {
                    const symbol = sameVersionSymbols[i];
                    if (symbol.position) {
                        const range = new vscode.Range(symbol.position, symbol.position);
                        const diagnostic = new vscode.Diagnostic(
                            range,
                            `重复的函数定义: ${name}`,
                            vscode.DiagnosticSeverity.Warning
                        );
                        diagnostic.code = 'duplicate_function';
                        diagnostic.source = 'LDL';
                        diagnostics.push(diagnostic);
                    }
                }
            }
        }

        return diagnostics;
    }

    private checkStyleIssues(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // 检查每一行
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineRange = new vscode.Range(i, 0, i, line.length);

            // 检查行长度
            if (line.length > 100) {
                const diagnostic = new vscode.Diagnostic(
                    lineRange,
                    '行过长，建议不超过100字符',
                    vscode.DiagnosticSeverity.Information
                );
                diagnostic.code = 'long_line';
                diagnostic.source = 'LDL';
                diagnostics.push(diagnostic);
            }

            // 检查缩进一致性
            const indentMatch = line.match(/^(\s*)/);
            if (indentMatch && indentMatch[1].length > 0) {
                const indent = indentMatch[1];
                if (indent.includes('\t') && indent.includes(' ')) {
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(i, 0, i, indent.length),
                        '不要混用制表符和空格进行缩进',
                        vscode.DiagnosticSeverity.Information
                    );
                    diagnostic.code = 'mixed_indentation';
                    diagnostic.source = 'LDL';
                    diagnostics.push(diagnostic);
                }
            }
        }

        // 检查缺少文档注释的函数
        const functionPattern = /^fn\s+(\w+)/gm;
        let match;
        while ((match = functionPattern.exec(text)) !== null) {
            const lineNum = text.substring(0, match.index).split('\n').length - 1;
            const prevLine = lineNum > 0 ? lines[lineNum - 1].trim() : '';

            if (!prevLine.startsWith('///')) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                const range = new vscode.Range(startPos, endPos);

                const diagnostic = new vscode.Diagnostic(
                    range,
                    `函数 ${match[1]} 缺少文档注释`,
                    vscode.DiagnosticSeverity.Information
                );
                diagnostic.code = 'missing_documentation';
                diagnostic.source = 'LDL';
                diagnostics.push(diagnostic);
            }
        }

        return diagnostics;
    }

    private checkBestPractices(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const allSymbols = this.parser.getAllSymbols();

        // 检查缺少标签的函数
        for (const symbol of allSymbols.filter(s => s.type === 'function')) {
            if (!symbol.labels || symbol.labels.length === 0) {
                if (symbol.position) {
                    const range = new vscode.Range(symbol.position, symbol.position);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `建议为函数 ${symbol.name} 添加标签以便分类`,
                        vscode.DiagnosticSeverity.Hint
                    );
                    diagnostic.code = 'missing_labels';
                    diagnostic.source = 'LDL';
                    diagnostics.push(diagnostic);
                }
            }
        }

        // 检查魔法数字
        const magicNumberPattern = /\b(?!0|1|2|10|100)\d{2,}\b/g;
        let match;
        while ((match = magicNumberPattern.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            const diagnostic = new vscode.Diagnostic(
                range,
                `考虑为数字 ${match[0]} 使用有意义的常量名`,
                vscode.DiagnosticSeverity.Hint
            );
            diagnostic.code = 'magic_number';
            diagnostic.source = 'LDL';
            diagnostics.push(diagnostic);
        }

        return diagnostics;
    }

    private checkBracketMatching(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const stack: { char: string; pos: vscode.Position; index: number }[] = [];
        const pairs = new Map([
            ['(', ')'],
            ['{', '}'],
            ['[', ']']
        ]);

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const pos = document.positionAt(i);

            if (pairs.has(char)) {
                stack.push({ char, pos, index: i });
            } else if ([...pairs.values()].includes(char)) {
                if (stack.length === 0) {
                    // 没有匹配的开括号
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(pos, pos),
                        `没有匹配的开括号: ${char}`,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.code = 'unmatched_closing_bracket';
                    diagnostic.source = 'LDL';
                    diagnostics.push(diagnostic);
                } else {
                    const last = stack.pop()!;
                    const expected = pairs.get(last.char);
                    if (char !== expected) {
                        // 括号类型不匹配
                        const diagnostic = new vscode.Diagnostic(
                            new vscode.Range(pos, pos),
                            `括号类型不匹配，期望 ${expected}，得到 ${char}`,
                            vscode.DiagnosticSeverity.Error
                        );
                        diagnostic.code = 'mismatched_bracket';
                        diagnostic.source = 'LDL';
                        diagnostics.push(diagnostic);
                    }
                }
            }
        }

        // 检查未闭合的括号
        for (const item of stack) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(item.pos, item.pos),
                `未闭合的括号: ${item.char}`,
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.code = 'unclosed_bracket';
            diagnostic.source = 'LDL';
            diagnostics.push(diagnostic);
        }

        return diagnostics;
    }

    private findFunctionCalls(document: vscode.TextDocument): { name: string; range: vscode.Range }[] {
        const calls: { name: string; range: vscode.Range }[] = [];
        const text = document.getText();
        const callPattern = /(\w+)\s*\(/g;

        let match;
        while ((match = callPattern.exec(text)) !== null) {
            // 确保不是函数定义
            const beforeMatch = text.substring(Math.max(0, match.index - 10), match.index);
            if (!beforeMatch.includes('fn ')) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[1].length);
                calls.push({
                    name: match[1],
                    range: new vscode.Range(startPos, endPos)
                });
            }
        }

        return calls;
    }

    private isBuiltinFunction(name: string): boolean {
        const builtins = ['print', 'println', 'len', 'range', 'map', 'filter', 'reduce'];
        return builtins.includes(name);
    }

    // 提供修复建议
    public getFixSuggestions(diagnostic: vscode.Diagnostic, document: vscode.TextDocument): FixSuggestion[] {
        const suggestions: FixSuggestion[] = [];

        switch (diagnostic.code) {
            case 'missing_documentation':
                suggestions.push(this.createDocumentationFix(diagnostic, document));
                break;
            case 'missing_labels':
                suggestions.push(...this.createLabelFixes(diagnostic, document));
                break;
            case 'long_line':
                suggestions.push(this.createLineBreakFix(diagnostic, document));
                break;
            case 'magic_number':
                suggestions.push(this.createConstantFix(diagnostic, document));
                break;
            case 'mixed_indentation':
                suggestions.push(this.createIndentationFix(diagnostic, document));
                break;
        }

        return suggestions;
    }

    private createDocumentationFix(diagnostic: vscode.Diagnostic, document: vscode.TextDocument): FixSuggestion {
        const edit = new vscode.WorkspaceEdit();
        const line = diagnostic.range.start.line;
        const insertPos = new vscode.Position(line, 0);

        edit.insert(document.uri, insertPos, '/// 函数描述\n');

        return {
            title: '添加文档注释',
            description: '为函数添加文档注释',
            edit,
            confidence: 90
        };
    }

    private createLabelFixes(diagnostic: vscode.Diagnostic, document: vscode.TextDocument): FixSuggestion[] {
        const suggestions: FixSuggestion[] = [];
        const line = diagnostic.range.start.line;
        const insertPos = new vscode.Position(line, 0);

        // 学习相关标签
        const learningEdit = new vscode.WorkspaceEdit();
        learningEdit.insert(document.uri, insertPos, '@label("learning")\n');
        suggestions.push({
            title: '添加学习标签',
            description: '标记为学习相关方法',
            edit: learningEdit,
            confidence: 80
        });

        // 实用标签
        const practicalEdit = new vscode.WorkspaceEdit();
        practicalEdit.insert(document.uri, insertPos, '@label("practical")\n');
        suggestions.push({
            title: '添加实用标签',
            description: '标记为实用方法',
            edit: practicalEdit,
            confidence: 75
        });

        return suggestions;
    }

    private createLineBreakFix(diagnostic: vscode.Diagnostic, document: vscode.TextDocument): FixSuggestion {
        const edit = new vscode.WorkspaceEdit();
        const line = document.lineAt(diagnostic.range.start.line);
        const text = line.text;

        // 简单的行分割策略：在逗号或操作符处分割
        const breakPoints = [', ', ' && ', ' || ', ' + '];
        let bestBreakPoint = -1;
        let bestBreakLength = 0;

        for (const bp of breakPoints) {
            const index = text.lastIndexOf(bp, 80);
            if (index > bestBreakLength) {
                bestBreakPoint = index + bp.length;
                bestBreakLength = index;
            }
        }

        if (bestBreakPoint > 0) {
            const breakPos = new vscode.Position(diagnostic.range.start.line, bestBreakPoint);
            edit.insert(document.uri, breakPos, '\n    ');
        }

        return {
            title: '分割长行',
            description: '将长行分割为多行',
            edit,
            confidence: 70
        };
    }

    private createConstantFix(diagnostic: vscode.Diagnostic, document: vscode.TextDocument): FixSuggestion {
        const edit = new vscode.WorkspaceEdit();
        const number = document.getText(diagnostic.range);
        const constantName = `CONSTANT_${number}`;

        // 在文档开头添加常量定义
        const insertPos = new vscode.Position(0, 0);
        edit.insert(document.uri, insertPos, `const ${constantName} = ${number}\n\n`);

        // 替换原数字
        edit.replace(document.uri, diagnostic.range, constantName);

        return {
            title: '提取为常量',
            description: `将数字 ${number} 提取为常量 ${constantName}`,
            edit,
            confidence: 85
        };
    }

    private createIndentationFix(diagnostic: vscode.Diagnostic, document: vscode.TextDocument): FixSuggestion {
        const edit = new vscode.WorkspaceEdit();
        const line = document.lineAt(diagnostic.range.start.line);
        const text = line.text;

        // 将所有缩进转换为4个空格
        const fixedText = text.replace(/^[\t ]+/, match => {
            const spaceCount = match.replace(/\t/g, '    ').length;
            const indentLevel = Math.round(spaceCount / 4);
            return '    '.repeat(indentLevel);
        });

        edit.replace(document.uri, line.range, fixedText);

        return {
            title: '修复缩进',
            description: '统一使用空格缩进',
            edit,
            confidence: 95
        };
    }

    public dispose(): void {
        this.diagnostics.dispose();
    }
}