import * as vscode from 'vscode';
import { LDLParser, LDLSymbol } from './parser';
import { VariableCompletionProvider } from './variableCompletionProvider';

interface CompletionContext {
    currentFunction?: string;
    currentClass?: string;
    nearbySymbols: LDLSymbol[];
    recentlyUsed: string[];
    documentScope: LDLSymbol[];
}

interface UsageStats {
    symbol: string;
    frequency: number;
    lastUsed: number;
    contexts: string[];
}

export class LDLCompletionProvider implements vscode.CompletionItemProvider {
    private parser = new LDLParser();
    private usageHistory = new Map<string, UsageStats>();
    private contextHistory: string[] = [];
    private maxHistorySize = 50;
    private completionCache = new Map<string, { completions: vscode.CompletionItem[], timestamp: number }>();
    private cacheTimeout = 30000; // 30秒缓存过期
    private semanticPatterns = new Map<string, string[]>();
    private variableProvider = new VariableCompletionProvider();

    constructor() {
        this.initializeSemanticPatterns();
    }

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {

        const line = document.lineAt(position.line);
        const lineText = line.text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // 检查缓存
        const cacheKey = this.generateCacheKey(document.uri.toString(), position, textBeforeCursor);
        const cached = this.getCachedCompletions(cacheKey);
        if (cached) {
            return cached;
        }

        // 解析当前文档
        this.parser.parseDocument(document);

        // 构建智能上下文
        const completionContext = this.buildCompletionContext(document, position);

        const completions: vscode.CompletionItem[] = [];

        // 1. 标签补全 - @label("
        if (this.isLabelContext(textBeforeCursor)) {
            completions.push(...this.provideLabelCompletions(completionContext));
        }
        // 2. 函数调用补全
        else if (this.isFunctionCallContext(textBeforeCursor)) {
            completions.push(...this.provideFunctionCompletions(document, completionContext));
        }
        // 3. 关键字补全
        else if (this.isKeywordContext(textBeforeCursor)) {
            completions.push(...this.provideKeywordCompletions(completionContext));
        }
        // 4. 类型补全
        else if (this.isTypeContext(textBeforeCursor)) {
            completions.push(...this.provideTypeCompletions(completionContext));
        }
        // 5. 参数名补全
        else if (this.isParameterContext(textBeforeCursor, lineText, position)) {
            completions.push(...this.provideParameterCompletions(textBeforeCursor, completionContext));
        }
        // 6. 版本补全
        else if (this.isVersionContext(textBeforeCursor)) {
            completions.push(...this.provideVersionCompletions(textBeforeCursor, completionContext));
        }
        // 7. 变量名补全
        else if (this.isVariableContext(textBeforeCursor)) {
            completions.push(...this.variableProvider.provideVariableCompletions(document, position, textBeforeCursor));
        }
        // 8. 智能建议补全
        else {
            completions.push(...this.provideIntelligentSuggestions(textBeforeCursor, completionContext));
        }

        // 通用变量补全（在所有情况下都提供）
        if (this.shouldProvideVariables(textBeforeCursor)) {
            completions.push(...this.variableProvider.provideVariableCompletions(document, position, textBeforeCursor));
        }

        // 应用智能排序和过滤
        const finalCompletions = this.applyIntelligentRanking(completions, textBeforeCursor, completionContext);

        // 缓存结果
        this.cacheCompletions(cacheKey, finalCompletions);

        return finalCompletions;
    }

    // ========== 智能上下文构建 ==========

    private buildCompletionContext(document: vscode.TextDocument, position: vscode.Position): CompletionContext {
        const allSymbols = this.parser.getAllSymbols();
        const documentScope = allSymbols.filter(s => s.position);

        // 查找当前函数/类上下文
        const currentFunction = this.findCurrentFunction(document, position);
        const currentClass = this.findCurrentClass(document, position);

        // 查找附近的符号
        const nearbySymbols = this.findNearbySymbols(document, position, 10);

        // 获取最近使用的符号
        const recentlyUsed = this.getRecentlyUsedSymbols();

        return {
            currentFunction,
            currentClass,
            nearbySymbols,
            recentlyUsed,
            documentScope
        };
    }

    private findCurrentFunction(document: vscode.TextDocument, position: vscode.Position): string | undefined {
        const text = document.getText();
        const offset = document.offsetAt(position);

        // 向前查找最近的函数定义
        const beforeText = text.substring(0, offset);
        const functionMatch = beforeText.match(/fn\s+(\w+)[^}]*$/);

        return functionMatch ? functionMatch[1] : undefined;
    }

    private findCurrentClass(document: vscode.TextDocument, position: vscode.Position): string | undefined {
        const text = document.getText();
        const offset = document.offsetAt(position);

        // 向前查找最近的类定义
        const beforeText = text.substring(0, offset);
        const classMatch = beforeText.match(/class\s+(\w+)[^}]*$/);

        return classMatch ? classMatch[1] : undefined;
    }

    private findNearbySymbols(document: vscode.TextDocument, position: vscode.Position, range: number): LDLSymbol[] {
        const allSymbols = this.parser.getAllSymbols();
        const currentLine = position.line;

        return allSymbols.filter(symbol => {
            if (!symbol.position) return false;
            const distance = Math.abs(symbol.position.line - currentLine);
            return distance <= range;
        }).sort((a, b) => {
            const distA = Math.abs(a.position!.line - currentLine);
            const distB = Math.abs(b.position!.line - currentLine);
            return distA - distB;
        });
    }

    private getRecentlyUsedSymbols(limit: number = 10): string[] {
        return this.contextHistory.slice(-limit);
    }

    private updateUsageStats(symbol: string, context?: string): void {
        const existing = this.usageHistory.get(symbol);
        if (existing) {
            existing.frequency++;
            existing.lastUsed = Date.now();
            if (context && !existing.contexts.includes(context)) {
                existing.contexts.push(context);
            }
        } else {
            this.usageHistory.set(symbol, {
                symbol,
                frequency: 1,
                lastUsed: Date.now(),
                contexts: context ? [context] : []
            });
        }

        // 更新上下文历史
        this.contextHistory.push(symbol);
        if (this.contextHistory.length > this.maxHistorySize) {
            this.contextHistory.shift();
        }
    }

    // ========== 智能建议和排序 ==========

    private provideIntelligentSuggestions(textBeforeCursor: string, context: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 基于上下文的智能建议
        if (context.currentFunction) {
            completions.push(...this.getFunctionContextSuggestions(context.currentFunction, context));
        }

        // 基于最近使用的建议
        if (context.recentlyUsed.length > 0) {
            completions.push(...this.getFrequentlyUsedSuggestions(context));
        }

        // 基于附近符号的建议
        if (context.nearbySymbols.length > 0) {
            completions.push(...this.getNearbySymbolSuggestions(context));
        }

        // 基于文档模式的建议
        completions.push(...this.getPatternBasedSuggestions(textBeforeCursor, context));

        // 语义分析建议
        completions.push(...this.getSemanticSuggestions(textBeforeCursor, context));

        // 预测性建议
        completions.push(...this.getPredictiveCompletions(textBeforeCursor, context));

        return completions;
    }

    private getFunctionContextSuggestions(functionName: string, context: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 查找相似的函数，建议相关的调用
        const relatedFunctions = context.documentScope.filter(symbol =>
            symbol.type === 'function' &&
            symbol.name !== functionName &&
            this.areSymbolsRelated(symbol, functionName)
        );

        for (const func of relatedFunctions.slice(0, 5)) {
            const item = new vscode.CompletionItem(func.name, vscode.CompletionItemKind.Function);
            item.detail = `推荐：与 ${functionName} 相关`;
            item.insertText = new vscode.SnippetString(`${func.name}($1)$0`);
            item.sortText = `aa_${func.name}`;
            completions.push(item);
        }

        return completions;
    }

    private getFrequentlyUsedSuggestions(context: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        const topUsed = Array.from(this.usageHistory.values())
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);

        for (const usage of topUsed) {
            const symbol = context.documentScope.find(s => s.name === usage.symbol);
            if (symbol) {
                const item = new vscode.CompletionItem(symbol.name, vscode.CompletionItemKind.Function);
                item.detail = `常用 (${usage.frequency}次)`;
                item.insertText = symbol.type === 'function' ?
                    new vscode.SnippetString(`${symbol.name}($1)$0`) : symbol.name;
                item.sortText = `ab_${symbol.name}`;
                completions.push(item);
            }
        }

        return completions;
    }

    private getNearbySymbolSuggestions(context: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        for (const symbol of context.nearbySymbols.slice(0, 3)) {
            if (symbol.type === 'function' || symbol.type === 'method') {
                const item = new vscode.CompletionItem(symbol.name, vscode.CompletionItemKind.Function);
                item.detail = `附近定义 (第${symbol.position?.line}行)`;
                item.insertText = new vscode.SnippetString(`${symbol.name}($1)$0`);
                item.sortText = `ac_${symbol.name}`;
                completions.push(item);
            }
        }

        return completions;
    }

    private getPatternBasedSuggestions(textBeforeCursor: string, context: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 检测常见模式并提供建议
        if (textBeforeCursor.includes('learn') || textBeforeCursor.includes('study')) {
            const learningMethods = context.documentScope.filter(s =>
                s.labels && s.labels.includes('learning')
            );

            for (const method of learningMethods.slice(0, 3)) {
                const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Function);
                item.detail = '学习相关方法';
                item.insertText = method.type === 'function' ?
                    new vscode.SnippetString(`${method.name}($1)$0`) : method.name;
                item.sortText = `ad_${method.name}`;
                completions.push(item);
            }
        }

        return completions;
    }

    private applyIntelligentRanking(
        completions: vscode.CompletionItem[],
        textBeforeCursor: string,
        context: CompletionContext
    ): vscode.CompletionItem[] {
        // 应用模糊匹配得分
        const typed = textBeforeCursor.split(/\s+/).pop() || '';

        return completions.map(item => {
            let score = 0;

            // 前缀匹配得分
            if (item.label.toString().toLowerCase().startsWith(typed.toLowerCase())) {
                score += 100;
            }

            // 包含匹配得分
            else if (item.label.toString().toLowerCase().includes(typed.toLowerCase())) {
                score += 50;
            }

            // 使用频率得分
            const usage = this.usageHistory.get(item.label.toString());
            if (usage) {
                score += Math.min(usage.frequency * 10, 50);

                // 最近使用得分
                const timeDiff = Date.now() - usage.lastUsed;
                if (timeDiff < 60000) score += 30; // 1分钟内
                else if (timeDiff < 300000) score += 20; // 5分钟内
                else if (timeDiff < 3600000) score += 10; // 1小时内
            }

            // 上下文相关性得分
            if (context.currentFunction && item.detail?.includes(context.currentFunction)) {
                score += 25;
            }

            // 调整排序文本
            item.sortText = `${String(1000 - score).padStart(4, '0')}_${item.label}`;

            return item;
        }).sort((a, b) => (a.sortText || '').localeCompare(b.sortText || ''));
    }

    private areSymbolsRelated(symbol: LDLSymbol, functionName: string): boolean {
        // 检查是否有共同的标签
        if (symbol.labels) {
            const currentFunc = this.parser.findSymbol(functionName);
            if (currentFunc?.labels) {
                return symbol.labels.some(label => currentFunc.labels!.includes(label));
            }
        }

        // 检查名称相似性
        return this.calculateStringSimilarity(symbol.name, functionName) > 0.3;
    }

    private calculateStringSimilarity(str1: string, str2: string): number {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    private levenshteinDistance(str1: string, str2: string): number {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    // ========== 缓存和语义模式 ==========

    private initializeSemanticPatterns(): void {
        // 初始化语义模式映射
        this.semanticPatterns.set('学习', ['SQ3R', 'cornell_notes', 'mind_mapping', 'spaced_repetition']);
        this.semanticPatterns.set('阅读', ['SQ3R', 'skimming', 'intensive_reading', 'critical_reading']);
        this.semanticPatterns.set('记忆', ['spaced_repetition', 'memory_palace', 'mnemonics', 'active_recall']);
        this.semanticPatterns.set('分析', ['SWOT_analysis', 'root_cause_analysis', 'fishbone_diagram']);
        this.semanticPatterns.set('思考', ['critical_thinking', 'lateral_thinking', 'systems_thinking']);
        this.semanticPatterns.set('研究', ['literature_review', 'hypothesis_testing', 'data_collection']);
        this.semanticPatterns.set('写作', ['brainstorming', 'outlining', 'revision', 'peer_review']);
        this.semanticPatterns.set('解决问题', ['problem_identification', 'root_cause_analysis', 'solution_generation']);
    }

    private generateCacheKey(uri: string, position: vscode.Position, textBeforeCursor: string): string {
        return `${uri}:${position.line}:${position.character}:${textBeforeCursor.slice(-20)}`;
    }

    private getCachedCompletions(cacheKey: string): vscode.CompletionItem[] | null {
        const cached = this.completionCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.completions;
        }
        if (cached) {
            this.completionCache.delete(cacheKey);
        }
        return null;
    }

    private cacheCompletions(cacheKey: string, completions: vscode.CompletionItem[]): void {
        this.completionCache.set(cacheKey, {
            completions: [...completions],
            timestamp: Date.now()
        });

        // 清理过期缓存
        if (this.completionCache.size > 100) {
            this.cleanExpiredCache();
        }
    }

    private cleanExpiredCache(): void {
        const now = Date.now();
        for (const [key, value] of this.completionCache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.completionCache.delete(key);
            }
        }
    }

    // ========== 高级智能预测 ==========

    private getSemanticSuggestions(textBeforeCursor: string, context: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 检测文本中的关键词
        for (const [keyword, methods] of this.semanticPatterns.entries()) {
            if (textBeforeCursor.toLowerCase().includes(keyword)) {
                for (const method of methods) {
                    // 查找实际的方法定义
                    const actualMethod = context.documentScope.find(s =>
                        s.name.toLowerCase().includes(method.toLowerCase()) ||
                        method.toLowerCase().includes(s.name.toLowerCase())
                    );

                    if (actualMethod) {
                        const item = new vscode.CompletionItem(actualMethod.name, vscode.CompletionItemKind.Function);
                        item.detail = `语义建议：与"${keyword}"相关`;
                        item.insertText = actualMethod.type === 'function' ?
                            new vscode.SnippetString(`${actualMethod.name}($1)$0`) : actualMethod.name;
                        item.sortText = `ae_${actualMethod.name}`;
                        completions.push(item);
                    } else {
                        // 如果找不到实际方法，提供建议的方法名
                        const item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Function);
                        item.detail = `建议方法：与"${keyword}"相关`;
                        item.insertText = new vscode.SnippetString(`${method}($1)$0`);
                        item.sortText = `af_${method}`;
                        item.documentation = new vscode.MarkdownString(`建议的${keyword}相关方法`);
                        completions.push(item);
                    }
                }
                break; // 只匹配第一个关键词
            }
        }

        return completions;
    }

    private getPredictiveCompletions(textBeforeCursor: string, context: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 基于输入模式预测
        const inputPattern = this.analyzeInputPattern(textBeforeCursor);

        if (inputPattern.isMethodChain) {
            // 预测方法链的下一个方法
            completions.push(...this.predictChainedMethod(context, inputPattern.lastMethod));
        }

        if (inputPattern.isConditional) {
            // 预测条件语句中可能的方法
            completions.push(...this.predictConditionalMethods(context));
        }

        if (inputPattern.isLoop) {
            // 预测循环中常用的方法
            completions.push(...this.predictLoopMethods(context));
        }

        return completions;
    }

    private analyzeInputPattern(textBeforeCursor: string): {
        isMethodChain: boolean;
        isConditional: boolean;
        isLoop: boolean;
        lastMethod?: string;
    } {
        const isMethodChain = /\w+\(\)\s*$/.test(textBeforeCursor);
        const isConditional = /\b(if|else)\s+/.test(textBeforeCursor);
        const isLoop = /\b(for|while)\s+/.test(textBeforeCursor);

        let lastMethod: string | undefined;
        if (isMethodChain) {
            const match = textBeforeCursor.match(/(\w+)\(\)\s*$/);
            if (match) {
                lastMethod = match[1];
            }
        }

        return {
            isMethodChain,
            isConditional,
            isLoop,
            lastMethod
        };
    }

    private predictChainedMethod(context: CompletionContext, lastMethod?: string): vscode.CompletionItem[] {
        if (!lastMethod) return [];

        const completions: vscode.CompletionItem[] = [];

        // 查找与上一个方法相关的方法
        const lastMethodSymbol = context.documentScope.find(s => s.name === lastMethod);
        if (lastMethodSymbol?.labels) {
            const relatedMethods = context.documentScope.filter(s =>
                s.name !== lastMethod &&
                s.labels &&
                s.labels.some(label => lastMethodSymbol.labels!.includes(label))
            );

            for (const method of relatedMethods.slice(0, 3)) {
                const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Function);
                item.detail = `链式调用：与 ${lastMethod} 相关`;
                item.insertText = new vscode.SnippetString(`\n    ${method.name}($1)$0`);
                item.sortText = `ag_${method.name}`;
                completions.push(item);
            }
        }

        return completions;
    }

    private predictConditionalMethods(context: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 在条件语句中常用的方法
        const conditionalMethods = context.documentScope.filter(s =>
            s.type === 'function' &&
            (s.name.includes('check') || s.name.includes('validate') || s.name.includes('verify'))
        );

        for (const method of conditionalMethods.slice(0, 2)) {
            const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Function);
            item.detail = '条件语句中的常用方法';
            item.insertText = new vscode.SnippetString(`${method.name}($1)`);
            item.sortText = `ah_${method.name}`;
            completions.push(item);
        }

        return completions;
    }

    private predictLoopMethods(context: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 在循环中常用的方法
        const loopMethods = context.documentScope.filter(s =>
            s.type === 'function' &&
            (s.name.includes('process') || s.name.includes('apply') || s.name.includes('execute'))
        );

        for (const method of loopMethods.slice(0, 2)) {
            const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Function);
            item.detail = '循环中的常用方法';
            item.insertText = new vscode.SnippetString(`${method.name}($1)`);
            item.sortText = `ai_${method.name}`;
            completions.push(item);
        }

        return completions;
    }

    // ========== 上下文检测方法 ==========

    private isLabelContext(textBeforeCursor: string): boolean {
        return /@label\(\s*["']?$/.test(textBeforeCursor) ||
               /@label\(\s*["'][^"']*$/.test(textBeforeCursor);
    }

    private isFunctionCallContext(textBeforeCursor: string): boolean {
        // 检测函数调用上下文：在行的开始或者在空白字符后
        return /^\s*[a-zA-Z_]*$/.test(textBeforeCursor) ||
               /[\s\{\}\(\),]\s*[a-zA-Z_]*$/.test(textBeforeCursor);
    }

    private isKeywordContext(textBeforeCursor: string): boolean {
        // 在行首或特定关键字后
        return /^\s*[a-zA-Z]*$/.test(textBeforeCursor) ||
               /\b(let|return|if|else|for|while)\s+[a-zA-Z]*$/.test(textBeforeCursor);
    }

    private isTypeContext(textBeforeCursor: string): boolean {
        // 类型标注上下文：-> 或 : 后面
        return /:\s*[a-zA-Z_]*$/.test(textBeforeCursor) ||
               /->\s*[a-zA-Z_]*$/.test(textBeforeCursor);
    }

    private isParameterContext(textBeforeCursor: string, lineText: string, position: vscode.Position): boolean {
        // 检测是否在函数参数内部
        const beforeCursor = textBeforeCursor;
        const afterCursor = lineText.substring(position.character);

        // 寻找最近的开括号和闭括号
        const lastOpenParen = beforeCursor.lastIndexOf('(');
        const lastCloseParen = beforeCursor.lastIndexOf(')');
        const nextCloseParen = afterCursor.indexOf(')');

        // 如果在括号内部，并且没有闭括号在前面
        return lastOpenParen > lastCloseParen && nextCloseParen !== -1;
    }

    private isVersionContext(textBeforeCursor: string): boolean {
        // 检测 version: " 上下文
        return /version\s*:\s*["']?[^"']*$/.test(textBeforeCursor);
    }

    private isVariableContext(textBeforeCursor: string): boolean {
        // 检测变量名上下文：变量声明或使用
        return /\b(let|const)\s+\w*$/.test(textBeforeCursor) ||
               /^\s*\w*$/.test(textBeforeCursor) ||
               /[=\s]\w*$/.test(textBeforeCursor);
    }

    private shouldProvideVariables(textBeforeCursor: string): boolean {
        // 在大多数情况下都可能需要变量补全
        const word = textBeforeCursor.split(/\s+/).pop() || '';
        return word.length > 0 &&
               /^[a-zA-Z_]\w*$/.test(word) &&
               !this.isLabelContext(textBeforeCursor) &&
               !this.isVersionContext(textBeforeCursor) &&
               !this.isTypeContext(textBeforeCursor);
    }

    // ========== 补全提供方法 ==========

    private provideLabelCompletions(context?: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        const existingLabels = this.parser.getAllLabels();

        // 添加已存在的标签
        for (const label of existingLabels) {
            const item = new vscode.CompletionItem(label, vscode.CompletionItemKind.EnumMember);
            item.detail = `已存在的标签`;
            item.documentation = new vscode.MarkdownString(`使用现有标签: \`${label}\``);
            item.insertText = label;
            completions.push(item);
        }

        // 添加常用标签建议
        const commonLabels = [
            'learning', 'reading', 'memory', 'analysis', 'thinking',
            'philosophy', 'science', 'mathematics', 'language',
            'academic', 'practical', 'beginner', 'intermediate', 'advanced',
            'visual', 'auditory', 'kinesthetic', 'systematic', 'creative'
        ];

        for (const label of commonLabels) {
            if (!existingLabels.includes(label)) {
                const item = new vscode.CompletionItem(label, vscode.CompletionItemKind.EnumMember);
                item.detail = `常用标签`;
                item.documentation = new vscode.MarkdownString(`常用标签建议: \`${label}\``);
                item.insertText = label;
                item.sortText = `z_${label}`; // 排到已存在标签后面
                completions.push(item);
            }
        }

        return completions;
    }

    private provideFunctionCompletions(document: vscode.TextDocument, context?: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        const allSymbols = this.parser.getAllSymbols();

        // 获取所有可用的函数和pipeline
        const functions = allSymbols.filter(s =>
            s.type === 'function' || s.type === 'pipeline' || s.type === 'method'
        );

        for (const func of functions) {
            const item = new vscode.CompletionItem(func.name, vscode.CompletionItemKind.Function);

            // 设置详细信息
            item.detail = this.getFunctionDetail(func);
            item.documentation = this.getFunctionDocumentation(func);

            // 设置插入文本和光标位置
            if (func.type === 'function' || func.type === 'method') {
                item.insertText = new vscode.SnippetString(`${func.name}($1)$0`);
            } else {
                item.insertText = func.name;
            }

            // 设置排序优先级
            item.sortText = this.getFunctionSortText(func);

            // 添加标签信息
            if (func.labels && func.labels.length > 0) {
                item.tags = [vscode.CompletionItemTag.Deprecated]; // 暂时使用这个标记
            }

            completions.push(item);
        }

        return completions;
    }

    private provideKeywordCompletions(context?: CompletionContext): vscode.CompletionItem[] {
        const keywords = [
            { name: 'fn', detail: '函数定义', snippet: 'fn ${1:name}(${2:params}) -> ${3:Type} {\n\t$0\n}' },
            { name: 'pipeline', detail: '流程定义', snippet: 'pipeline ${1:name} {\n\t$0\n}' },
            { name: 'class', detail: '类定义', snippet: 'class ${1:Name} {\n\t$0\n}' },
            { name: 'using', detail: '类型别名', snippet: 'using ${1:AliasName} = ${2:Type}' },
            { name: 'macro', detail: '宏定义', snippet: 'macro ${1:NAME} ${2:value}' },
            { name: 'const', detail: '常量定义', snippet: 'const ${1:NAME} = ${2:value}' },
            { name: 'let', detail: '变量声明', snippet: 'let ${1:name} = ${2:value}' },
            { name: 'return', detail: '返回语句', snippet: 'return ${1:value}' },
            { name: 'if', detail: '条件语句', snippet: 'if ${1:condition} {\n\t$0\n}' },
            { name: 'else', detail: 'else语句', snippet: 'else {\n\t$0\n}' },
            { name: 'for', detail: '循环语句', snippet: 'for ${1:item} in ${2:collection} {\n\t$0\n}' },
            { name: 'while', detail: 'while循环', snippet: 'while ${1:condition} {\n\t$0\n}' },
            { name: 'match', detail: '模式匹配', snippet: 'match ${1:value} {\n\t${2:pattern} => ${3:action},\n\t_ => ${4:default}\n}' }
        ];

        return keywords.map(kw => {
            const item = new vscode.CompletionItem(kw.name, vscode.CompletionItemKind.Keyword);
            item.detail = kw.detail;
            item.insertText = new vscode.SnippetString(kw.snippet);
            item.documentation = new vscode.MarkdownString(`LDL 关键字: \`${kw.name}\`\n\n${kw.detail}`);
            return item;
        });
    }

    private provideTypeCompletions(context?: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 基础类型
        const basicTypes = [
            { name: 'str', detail: '字符串类型' },
            { name: 'int', detail: '整数类型' },
            { name: 'float', detail: '浮点数类型' },
            { name: 'bool', detail: '布尔类型' },
            { name: 'void', detail: '空类型' }
        ];

        for (const type of basicTypes) {
            const item = new vscode.CompletionItem(type.name, vscode.CompletionItemKind.TypeParameter);
            item.detail = type.detail;
            item.documentation = new vscode.MarkdownString(`基础类型: \`${type.name}\``);
            completions.push(item);
        }

        // 领域特定类型
        const domainTypes = [
            { name: 'Steps', detail: 'LDL步骤类型' },
            { name: 'Args', detail: 'LDL参数类型' },
            { name: 'AnalysisSteps', detail: '分析步骤类型' },
            { name: 'ResearchMethod', detail: '研究方法类型' },
            { name: 'LearningOutcome', detail: '学习结果类型' }
        ];

        for (const type of domainTypes) {
            const item = new vscode.CompletionItem(type.name, vscode.CompletionItemKind.Class);
            item.detail = type.detail;
            item.documentation = new vscode.MarkdownString(`领域类型: \`${type.name}\``);
            completions.push(item);
        }

        // 自定义类型别名
        const typeAliases = this.parser.getAllSymbols().filter(s => s.type === 'type_alias');
        for (const alias of typeAliases) {
            const item = new vscode.CompletionItem(alias.name, vscode.CompletionItemKind.Interface);
            item.detail = `类型别名 -> ${alias.aliasType}`;
            item.documentation = new vscode.MarkdownString(`自定义类型: \`${alias.name}\``);
            completions.push(item);
        }

        return completions;
    }

    private provideParameterCompletions(textBeforeCursor: string, context?: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 常用参数名
        const commonParameters = [
            { name: 'target', detail: '目标对象或内容' },
            { name: 'depth', detail: '深度或层级' },
            { name: 'version', detail: '版本标识' },
            { name: 'context', detail: '上下文信息' },
            { name: 'scope', detail: '范围或作用域' },
            { name: 'level', detail: '级别或水平' },
            { name: 'mode', detail: '模式或方式' },
            { name: 'type', detail: '类型或种类' },
            { name: 'format', detail: '格式' },
            { name: 'criteria', detail: '标准或条件' },
            { name: 'duration', detail: '持续时间' },
            { name: 'intensity', detail: '强度' },
            { name: 'method', detail: '方法' },
            { name: 'strategy', detail: '策略' }
        ];

        for (const param of commonParameters) {
            const item = new vscode.CompletionItem(param.name, vscode.CompletionItemKind.Variable);
            item.detail = param.detail;
            item.insertText = new vscode.SnippetString(`${param.name}: $1`);
            item.documentation = new vscode.MarkdownString(`参数: \`${param.name}\`\n\n${param.detail}`);
            completions.push(item);
        }

        return completions;
    }

    private provideVersionCompletions(textBeforeCursor: string, context?: CompletionContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 提取函数名
        const functionMatch = textBeforeCursor.match(/(\w+)\s*\([^)]*version\s*:\s*["']?[^"']*$/);
        if (!functionMatch) return completions;

        const functionName = functionMatch[1];
        const functions = this.parser.findAllSymbols(functionName);

        // 收集该函数的所有版本
        const versions = new Set<string>();
        for (const func of functions) {
            if (func.version) {
                versions.add(func.version);
            }
        }

        // 添加已有版本
        for (const version of versions) {
            const item = new vscode.CompletionItem(version, vscode.CompletionItemKind.EnumMember);
            item.detail = `${functionName} 的版本`;
            item.insertText = version;
            item.documentation = new vscode.MarkdownString(`函数版本: \`${version}\``);
            completions.push(item);
        }

        // 添加常见版本名建议
        const commonVersions = ['basic', 'advanced', 'academic', 'practical', 'simplified', 'enhanced'];
        for (const version of commonVersions) {
            if (!versions.has(version)) {
                const item = new vscode.CompletionItem(version, vscode.CompletionItemKind.EnumMember);
                item.detail = '常用版本名';
                item.insertText = version;
                item.sortText = `z_${version}`;
                completions.push(item);
            }
        }

        return completions;
    }

    // ========== 辅助方法 ==========

    private getFunctionDetail(func: LDLSymbol): string {
        let detail = func.type;

        if (func.version) {
            detail += ` (v${func.version})`;
        }

        if (func.className) {
            detail += ` in ${func.className}`;
        }

        if (func.labels && func.labels.length > 0) {
            detail += ` @${func.labels.join(' @')}`;
        }

        return detail;
    }

    private getFunctionDocumentation(func: LDLSymbol): vscode.MarkdownString {
        const docs = new vscode.MarkdownString();

        if (func.documentation) {
            docs.appendMarkdown(`**${func.documentation}**\n\n`);
        }

        docs.appendMarkdown(`**类型**: ${func.type}\n\n`);

        if (func.version) {
            docs.appendMarkdown(`**版本**: ${func.version}\n\n`);
        }

        if (func.labels && func.labels.length > 0) {
            docs.appendMarkdown(`**标签**: ${func.labels.map(l => `\`${l}\``).join(', ')}\n\n`);
        }

        if (func.className) {
            docs.appendMarkdown(`**所属类**: \`${func.className}\`\n\n`);
        }

        return docs;
    }

    private getFunctionSortText(func: LDLSymbol): string {
        // 优先级排序：
        // 1. 同文件内的函数
        // 2. 有文档的函数
        // 3. 常用函数（根据类型）
        let priority = 'b'; // 默认优先级

        if (func.documentation) {
            priority = 'a'; // 有文档的优先
        }

        if (func.type === 'pipeline') {
            priority = 'a'; // pipeline 优先
        }

        return `${priority}_${func.name}`;
    }
}