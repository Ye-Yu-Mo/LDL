import * as vscode from 'vscode';
import { LDLParser, LDLSymbol } from './parser';

export interface VariableInfo {
    name: string;
    type?: string;
    scope: 'local' | 'parameter' | 'global';
    position: vscode.Position;
    usageCount: number;
    lastUsed: number;
}

export interface ScopeInfo {
    functionName?: string;
    className?: string;
    variables: Map<string, VariableInfo>;
    parameters: Map<string, VariableInfo>;
}

export class VariableCompletionProvider {
    private parser = new LDLParser();
    private variableCache = new Map<string, ScopeInfo[]>();
    private globalVariables = new Map<string, VariableInfo>();

    public provideVariableCompletions(
        document: vscode.TextDocument,
        position: vscode.Position,
        textBeforeCursor: string
    ): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 解析当前文档的变量
        const scopeInfo = this.analyzeVariableScope(document, position);

        // 1. 当前作用域的变量
        completions.push(...this.getLocalVariables(scopeInfo, textBeforeCursor));

        // 2. 函数参数
        completions.push(...this.getFunctionParameters(scopeInfo, textBeforeCursor));

        // 3. 全局变量和常量
        completions.push(...this.getGlobalVariables(document, textBeforeCursor));

        // 4. 智能变量名建议
        completions.push(...this.getIntelligentVariableNames(textBeforeCursor, position, document));

        // 5. 上下文相关的变量建议
        completions.push(...this.getContextualVariables(scopeInfo, textBeforeCursor));

        return completions;
    }

    private analyzeVariableScope(document: vscode.TextDocument, position: vscode.Position): ScopeInfo {
        const text = document.getText();
        const offset = document.offsetAt(position);

        // 找到当前所在的函数
        const currentFunction = this.findEnclosingFunction(text, offset);
        const currentClass = this.findEnclosingClass(text, offset);

        const scopeInfo: ScopeInfo = {
            functionName: currentFunction?.name,
            className: currentClass?.name,
            variables: new Map(),
            parameters: new Map()
        };

        if (currentFunction) {
            // 分析函数参数
            this.parseParameters(currentFunction.signature, scopeInfo, document);

            // 分析局部变量
            this.parseLocalVariables(currentFunction.body, scopeInfo, document, currentFunction.startPos);
        }

        return scopeInfo;
    }

    private findEnclosingFunction(text: string, offset: number): {
        name: string;
        signature: string;
        body: string;
        startPos: number;
    } | null {
        // 向前查找函数定义
        const beforeText = text.substring(0, offset);
        const functionPattern = /fn\s+(\w+)\s*\(([^)]*)\)[^{]*\{/g;
        let lastMatch = null;
        let match;

        while ((match = functionPattern.exec(beforeText)) !== null) {
            lastMatch = match;
        }

        if (!lastMatch) return null;

        // 找到函数体结束位置
        const functionStart = lastMatch.index + lastMatch[0].length;
        const functionBody = this.extractFunctionBody(text, functionStart - 1);

        return {
            name: lastMatch[1],
            signature: lastMatch[2],
            body: functionBody,
            startPos: lastMatch.index
        };
    }

    private findEnclosingClass(text: string, offset: number): {
        name: string;
        startPos: number;
    } | null {
        const beforeText = text.substring(0, offset);
        const classPattern = /class\s+(\w+)[^{]*\{/g;
        let lastMatch = null;
        let match;

        while ((match = classPattern.exec(beforeText)) !== null) {
            // 检查是否还在这个类的范围内
            const classStart = match.index + match[0].length;
            const classEnd = this.findMatchingBrace(text, classStart - 1);
            if (offset <= classEnd) {
                lastMatch = match;
            }
        }

        return lastMatch ? {
            name: lastMatch[1],
            startPos: lastMatch.index
        } : null;
    }

    private parseParameters(signature: string, scopeInfo: ScopeInfo, document: vscode.TextDocument): void {
        if (!signature.trim()) return;

        // 解析参数：name: type, name: type = default
        const paramPattern = /(\w+)\s*:\s*([^,=]+)(?:\s*=\s*[^,]*)?/g;
        let match;

        while ((match = paramPattern.exec(signature)) !== null) {
            const paramName = match[1];
            const paramType = match[2].trim();

            scopeInfo.parameters.set(paramName, {
                name: paramName,
                type: paramType,
                scope: 'parameter',
                position: new vscode.Position(0, 0), // 实际位置需要更精确计算
                usageCount: 0,
                lastUsed: Date.now()
            });
        }
    }

    private parseLocalVariables(
        functionBody: string,
        scopeInfo: ScopeInfo,
        document: vscode.TextDocument,
        functionStartPos: number
    ): void {
        // 匹配 let 和 const 声明
        const varPattern = /(let|const)\s+(\w+)(?:\s*:\s*([^=]+))?\s*=/g;
        let match;

        while ((match = varPattern.exec(functionBody)) !== null) {
            const varType = match[1]; // let 或 const
            const varName = match[2];
            const varTypeAnnotation = match[3]?.trim();

            scopeInfo.variables.set(varName, {
                name: varName,
                type: varTypeAnnotation,
                scope: 'local',
                position: document.positionAt(functionStartPos + match.index),
                usageCount: 0,
                lastUsed: Date.now()
            });
        }
    }

    private getLocalVariables(scopeInfo: ScopeInfo, textBeforeCursor: string): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        const typed = this.getLastWord(textBeforeCursor);

        for (const [name, info] of scopeInfo.variables) {
            if (this.matchesInput(name, typed)) {
                const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
                item.detail = `局部变量${info.type ? ` (${info.type})` : ''}`;
                item.documentation = new vscode.MarkdownString(`**局部变量**: \`${name}\`${info.type ? `\n\n**类型**: ${info.type}` : ''}`);
                item.sortText = `a_${name}`;
                item.insertText = name;
                completions.push(item);
            }
        }

        return completions;
    }

    private getFunctionParameters(scopeInfo: ScopeInfo, textBeforeCursor: string): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        const typed = this.getLastWord(textBeforeCursor);

        for (const [name, info] of scopeInfo.parameters) {
            if (this.matchesInput(name, typed)) {
                const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
                item.detail = `参数${info.type ? ` (${info.type})` : ''}`;
                item.documentation = new vscode.MarkdownString(`**函数参数**: \`${name}\`${info.type ? `\n\n**类型**: ${info.type}` : ''}`);
                item.sortText = `aa_${name}`;
                item.insertText = name;
                completions.push(item);
            }
        }

        return completions;
    }

    private getGlobalVariables(document: vscode.TextDocument, textBeforeCursor: string): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        const typed = this.getLastWord(textBeforeCursor);
        const text = document.getText();

        // 解析全局常量和宏
        const globalPattern = /(const|macro)\s+(\w+)/g;
        let match;

        while ((match = globalPattern.exec(text)) !== null) {
            const type = match[1];
            const name = match[2];

            if (this.matchesInput(name, typed)) {
                const item = new vscode.CompletionItem(name,
                    type === 'const' ? vscode.CompletionItemKind.Constant : vscode.CompletionItemKind.Value);
                item.detail = type === 'const' ? '全局常量' : '宏定义';
                item.documentation = new vscode.MarkdownString(`**${item.detail}**: \`${name}\``);
                item.sortText = `b_${name}`;
                item.insertText = name;
                completions.push(item);
            }
        }

        return completions;
    }

    private getIntelligentVariableNames(
        textBeforeCursor: string,
        position: vscode.Position,
        document: vscode.TextDocument
    ): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        const typed = this.getLastWord(textBeforeCursor);

        // 如果正在声明变量，提供智能变量名建议
        if (this.isVariableDeclaration(textBeforeCursor)) {
            const suggestions = this.generateVariableNameSuggestions(textBeforeCursor, document, position);

            for (const suggestion of suggestions) {
                if (this.matchesInput(suggestion.name, typed)) {
                    const item = new vscode.CompletionItem(suggestion.name, vscode.CompletionItemKind.Variable);
                    item.detail = `建议变量名 - ${suggestion.reason}`;
                    item.documentation = new vscode.MarkdownString(`**智能建议**: \`${suggestion.name}\`\n\n${suggestion.description}`);
                    item.sortText = `c_${suggestion.name}`;
                    item.insertText = suggestion.name;
                    completions.push(item);
                }
            }
        }

        return completions;
    }

    private getContextualVariables(scopeInfo: ScopeInfo, textBeforeCursor: string): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        const typed = this.getLastWord(textBeforeCursor);

        // 基于上下文提供常见变量名
        const contextualNames = this.getContextualVariableNames(scopeInfo, textBeforeCursor);

        for (const name of contextualNames) {
            if (this.matchesInput(name.name, typed) && !this.isVariableInScope(name.name, scopeInfo)) {
                const item = new vscode.CompletionItem(name.name, vscode.CompletionItemKind.Variable);
                item.detail = `上下文建议 - ${name.context}`;
                item.documentation = new vscode.MarkdownString(`**上下文变量**: \`${name.name}\`\n\n${name.description}`);
                item.sortText = `d_${name.name}`;
                item.insertText = name.name;
                completions.push(item);
            }
        }

        return completions;
    }

    private isVariableDeclaration(textBeforeCursor: string): boolean {
        return /\b(let|const)\s+\w*$/.test(textBeforeCursor);
    }

    private generateVariableNameSuggestions(
        textBeforeCursor: string,
        document: vscode.TextDocument,
        position: vscode.Position
    ): Array<{name: string; reason: string; description: string}> {
        const suggestions = [];

        // 基于右侧赋值内容的建议
        const line = document.lineAt(position.line).text;
        const afterCursor = line.substring(position.character);
        const assignmentMatch = afterCursor.match(/\s*=\s*(.+)/);

        if (assignmentMatch) {
            const assignment = assignmentMatch[1].trim();

            // 如果是数组，建议复数形式
            if (assignment.startsWith('[')) {
                suggestions.push({
                    name: 'items',
                    reason: '数组赋值',
                    description: '检测到数组赋值，建议使用复数形式的变量名'
                });
                suggestions.push({
                    name: 'list',
                    reason: '数组赋值',
                    description: '通用的列表变量名'
                });
                suggestions.push({
                    name: 'steps',
                    reason: '学习步骤',
                    description: '学习方法中常用的步骤列表'
                });
            }

            // 如果是字符串，建议相关名称
            if (assignment.startsWith('"') || assignment.startsWith("'")) {
                suggestions.push({
                    name: 'name',
                    reason: '字符串赋值',
                    description: '字符串类型的通用变量名'
                });
                suggestions.push({
                    name: 'title',
                    reason: '字符串赋值',
                    description: '标题或名称类字符串'
                });
                suggestions.push({
                    name: 'description',
                    reason: '字符串赋值',
                    description: '描述类字符串'
                });
            }

            // 如果是数字，建议相关名称
            if (/^\d+/.test(assignment)) {
                suggestions.push({
                    name: 'count',
                    reason: '数字赋值',
                    description: '计数类数字变量'
                });
                suggestions.push({
                    name: 'index',
                    reason: '数字赋值',
                    description: '索引类数字变量'
                });
                suggestions.push({
                    name: 'level',
                    reason: '数字赋值',
                    description: '级别或层次类数字变量'
                });
            }
        }

        // 基于函数上下文的建议
        const functionContext = this.getFunctionContext(textBeforeCursor);
        if (functionContext) {
            if (functionContext.includes('learn') || functionContext.includes('study')) {
                suggestions.push({
                    name: 'method',
                    reason: '学习上下文',
                    description: '学习方法相关的变量'
                });
                suggestions.push({
                    name: 'technique',
                    reason: '学习上下文',
                    description: '学习技巧相关的变量'
                });
            }

            if (functionContext.includes('analysis') || functionContext.includes('analyze')) {
                suggestions.push({
                    name: 'result',
                    reason: '分析上下文',
                    description: '分析结果相关的变量'
                });
                suggestions.push({
                    name: 'data',
                    reason: '分析上下文',
                    description: '分析数据相关的变量'
                });
            }
        }

        return suggestions;
    }

    private getContextualVariableNames(
        scopeInfo: ScopeInfo,
        textBeforeCursor: string
    ): Array<{name: string; context: string; description: string}> {
        const names = [];

        // 学习方法中常见的变量名
        if (scopeInfo.functionName?.includes('learn') || scopeInfo.functionName?.includes('study')) {
            names.push(
                {name: 'steps', context: '学习方法', description: '学习步骤列表'},
                {name: 'method', context: '学习方法', description: '学习方法名称'},
                {name: 'target', context: '学习方法', description: '学习目标'},
                {name: 'result', context: '学习方法', description: '学习结果'},
                {name: 'progress', context: '学习方法', description: '学习进度'}
            );
        }

        // 分析方法中常见的变量名
        if (scopeInfo.functionName?.includes('analysis') || scopeInfo.functionName?.includes('analyze')) {
            names.push(
                {name: 'data', context: '分析方法', description: '分析数据'},
                {name: 'criteria', context: '分析方法', description: '分析标准'},
                {name: 'findings', context: '分析方法', description: '分析发现'},
                {name: 'conclusion', context: '分析方法', description: '分析结论'}
            );
        }

        // 流程中常见的变量名
        if (scopeInfo.functionName?.includes('process') || scopeInfo.functionName?.includes('workflow')) {
            names.push(
                {name: 'stage', context: '流程处理', description: '处理阶段'},
                {name: 'phase', context: '流程处理', description: '处理阶段'},
                {name: 'queue', context: '流程处理', description: '处理队列'},
                {name: 'status', context: '流程处理', description: '处理状态'}
            );
        }

        // 通用变量名
        names.push(
            {name: 'temp', context: '临时变量', description: '临时变量'},
            {name: 'item', context: '通用', description: '通用项目变量'},
            {name: 'value', context: '通用', description: '通用值变量'},
            {name: 'config', context: '配置', description: '配置信息'},
            {name: 'option', context: '选项', description: '选项设置'}
        );

        return names;
    }

    private isVariableInScope(name: string, scopeInfo: ScopeInfo): boolean {
        return scopeInfo.variables.has(name) || scopeInfo.parameters.has(name);
    }

    private getFunctionContext(textBeforeCursor: string): string | null {
        const functionMatch = textBeforeCursor.match(/fn\s+(\w+)/);
        return functionMatch ? functionMatch[1] : null;
    }

    private getLastWord(text: string): string {
        const words = text.split(/\s+/);
        return words[words.length - 1] || '';
    }

    private matchesInput(candidate: string, input: string): boolean {
        if (!input) return true;
        return candidate.toLowerCase().startsWith(input.toLowerCase()) ||
               candidate.toLowerCase().includes(input.toLowerCase());
    }

    private extractFunctionBody(text: string, startBracePos: number): string {
        let braceCount = 1;
        let i = startBracePos + 1;

        while (i < text.length && braceCount > 0) {
            if (text[i] === '{') braceCount++;
            else if (text[i] === '}') braceCount--;
            i++;
        }

        return text.substring(startBracePos + 1, i - 1);
    }

    private findMatchingBrace(text: string, startBracePos: number): number {
        let braceCount = 1;
        let i = startBracePos + 1;

        while (i < text.length && braceCount > 0) {
            if (text[i] === '{') braceCount++;
            else if (text[i] === '}') braceCount--;
            i++;
        }

        return i - 1;
    }
}