import * as vscode from 'vscode';
import { LDLSymbol } from './parser';

export interface CodePattern {
    name: string;
    description: string;
    pattern: string;
    template: string;
    variables: string[];
}

export interface GenerationContext {
    currentFunction?: string;
    availableSymbols: LDLSymbol[];
    recentPatterns: string[];
    userIntentScore: number;
}

export class AICodeGenerator {
    private patterns = new Map<string, CodePattern[]>();
    private generationHistory: string[] = [];
    private userPreferences = new Map<string, number>();

    constructor() {
        this.initializePatterns();
    }

    // 智能代码生成的主入口
    public generateCode(
        intent: string,
        context: GenerationContext,
        position: vscode.Position
    ): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 1. 基于意图的模板生成
        completions.push(...this.generateByIntent(intent, context));

        // 2. 基于模式的智能生成
        completions.push(...this.generateByPatterns(intent, context));

        // 3. 基于上下文的自适应生成
        completions.push(...this.generateAdaptive(intent, context));

        // 4. 基于用户习惯的个性化生成
        completions.push(...this.generatePersonalized(intent, context));

        return completions;
    }

    private initializePatterns(): void {
        // 学习方法论模式
        this.patterns.set('learning_method', [
            {
                name: 'complete_learning_method',
                description: '完整的学习方法定义',
                pattern: 'fn ${name}',
                template: `/// \${description}
@label("\${primaryLabel}")
@label("\${secondaryLabel}")
fn \${name}(\${params}) -> Steps {
    let steps = [
        "\${step1}",
        "\${step2}",
        "\${step3}",
    ]
    return steps
}`,
                variables: ['name', 'description', 'primaryLabel', 'secondaryLabel', 'params', 'step1', 'step2', 'step3']
            },
            {
                name: 'method_with_version',
                description: '带版本的方法重载',
                pattern: 'fn ${name}(version:',
                template: `/// \${name} 针对\${context}的版本
fn \${name}(version: "\${versionName}") -> Steps {
    let steps = [
        "\${step1}",
        "\${step2}",
        "\${step3}",
    ]
    return steps
}`,
                variables: ['name', 'context', 'versionName', 'step1', 'step2', 'step3']
            }
        ]);

        // 流程组合模式
        this.patterns.set('workflow', [
            {
                name: 'learning_pipeline',
                description: '学习流程组合',
                pattern: 'pipeline ${name}',
                template: `/// \${description}
pipeline \${name} {
    \${method1}(\${params1})
    \${method2}(\${params2})
    \${method3}(\${params3})
}`,
                variables: ['name', 'description', 'method1', 'params1', 'method2', 'params2', 'method3', 'params3']
            },
            {
                name: 'conditional_pipeline',
                description: '条件流程',
                pattern: 'pipeline ${name}',
                template: `/// \${description}
pipeline \${name} {
    if \${condition} {
        \${trueMethod}(\${trueParams})
    } else {
        \${falseMethod}(\${falseParams})
    }
    \${finalMethod}()
}`,
                variables: ['name', 'description', 'condition', 'trueMethod', 'trueParams', 'falseMethod', 'falseParams', 'finalMethod']
            }
        ]);

        // 类定义模式
        this.patterns.set('class_definition', [
            {
                name: 'learning_class',
                description: '学习方法类',
                pattern: 'class ${name}',
                template: `/// \${description}
@label("\${label}")
class \${name} {
    fn init(\${initParams}) {
        // 初始化\${name}
    }

    fn execute(\${executeParams}) -> Steps {
        let steps = [
            "\${step1}",
            "\${step2}",
        ]
        return steps
    }

    fn validate() -> bool {
        // 验证方法有效性
        return true
    }
}`,
                variables: ['name', 'description', 'label', 'initParams', 'executeParams', 'step1', 'step2']
            }
        ]);

        // 分析模式
        this.patterns.set('analysis', [
            {
                name: 'swot_analysis',
                description: 'SWOT分析模板',
                pattern: 'fn ${name}_analysis',
                template: `/// \${target}的SWOT分析
@label("analysis")
@label("strategy")
fn \${name}_analysis(target: str) -> AnalysisSteps {
    let analysis = [
        "识别优势 (Strengths)",
        "识别劣势 (Weaknesses)",
        "发现机会 (Opportunities)",
        "评估威胁 (Threats)",
        "制定策略",
    ]
    return analysis
}`,
                variables: ['name', 'target']
            }
        ]);
    }

    private generateByIntent(intent: string, context: GenerationContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 意图识别和映射
        const intentMap = new Map([
            ['学习方法', 'learning_method'],
            ['分析方法', 'analysis'],
            ['工作流程', 'workflow'],
            ['方法类', 'class_definition'],
            ['学习', 'learning_method'],
            ['分析', 'analysis'],
            ['流程', 'workflow'],
            ['类', 'class_definition']
        ]);

        for (const [keyword, patternType] of intentMap.entries()) {
            if (intent.includes(keyword)) {
                const patterns = this.patterns.get(patternType);
                if (patterns) {
                    for (const pattern of patterns) {
                        const item = this.createCompletionFromPattern(pattern, context);
                        if (item) {
                            completions.push(item);
                        }
                    }
                }
            }
        }

        return completions;
    }

    private generateByPatterns(intent: string, context: GenerationContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 检测常见的编程模式
        if (this.detectMethodDefinitionPattern(intent)) {
            completions.push(...this.generateMethodPatterns(intent, context));
        }

        if (this.detectPipelinePattern(intent)) {
            completions.push(...this.generatePipelinePatterns(intent, context));
        }

        if (this.detectClassPattern(intent)) {
            completions.push(...this.generateClassPatterns(intent, context));
        }

        return completions;
    }

    private generateAdaptive(intent: string, context: GenerationContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 基于当前上下文自适应生成
        if (context.currentFunction) {
            // 在函数内部，生成相关的方法调用
            const relatedMethods = this.findRelatedMethods(context.currentFunction, context.availableSymbols);
            for (const method of relatedMethods.slice(0, 3)) {
                const item = new vscode.CompletionItem(
                    `调用 ${method.name}()`,
                    vscode.CompletionItemKind.Snippet
                );
                item.insertText = new vscode.SnippetString(`${method.name}($1)$0`);
                item.detail = `智能建议：调用相关方法 ${method.name}`;
                item.documentation = new vscode.MarkdownString(`基于当前函数 ${context.currentFunction} 的上下文建议`);
                item.sortText = `aa_${method.name}`;
                completions.push(item);
            }
        }

        // 基于可用符号生成组合建议
        if (context.availableSymbols.length >= 2) {
            const combinations = this.generateMethodCombinations(context.availableSymbols);
            completions.push(...combinations.slice(0, 2));
        }

        return completions;
    }

    private generatePersonalized(intent: string, context: GenerationContext): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];

        // 基于用户历史偏好生成
        const userFavorites = this.getUserFavoritePatterns();
        for (const favorite of userFavorites.slice(0, 2)) {
            const patterns = this.patterns.get(favorite);
            if (patterns) {
                const pattern = patterns[0]; // 取最常用的模式
                const item = this.createCompletionFromPattern(pattern, context);
                if (item) {
                    item.detail = `个人偏好：${item.detail}`;
                    item.sortText = `a_${pattern.name}`;
                    completions.push(item);
                }
            }
        }

        return completions;
    }

    private createCompletionFromPattern(pattern: CodePattern, context: GenerationContext): vscode.CompletionItem | null {
        const item = new vscode.CompletionItem(pattern.name, vscode.CompletionItemKind.Snippet);
        item.detail = pattern.description;
        item.documentation = new vscode.MarkdownString(
            `**模式**: ${pattern.name}\n\n**描述**: ${pattern.description}\n\n**变量**: ${pattern.variables.join(', ')}`
        );

        // 智能填充模板变量
        let template = pattern.template;
        template = this.fillTemplateVariables(template, context);

        item.insertText = new vscode.SnippetString(template);
        item.sortText = `b_${pattern.name}`;

        return item;
    }

    private fillTemplateVariables(template: string, context: GenerationContext): string {
        // 智能填充常见变量
        const substitutions = new Map([
            ['${name}', '${1:methodName}'],
            ['${description}', '${2:方法描述}'],
            ['${primaryLabel}', '${3:learning}'],
            ['${secondaryLabel}', '${4:practical}'],
            ['${params}', '${5:target: str}'],
            ['${step1}', '${6:第一步}'],
            ['${step2}', '${7:第二步}'],
            ['${step3}', '${8:第三步}'],
            ['${condition}', '${9:condition}'],
            ['${method1}', '${10:firstMethod}'],
            ['${method2}', '${11:secondMethod}'],
            ['${method3}', '${12:thirdMethod}']
        ]);

        let result = template;
        for (const [placeholder, replacement] of substitutions.entries()) {
            result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        }

        return result;
    }

    private detectMethodDefinitionPattern(intent: string): boolean {
        return /^fn\s+\w*$/.test(intent.trim()) || intent.includes('函数') || intent.includes('方法');
    }

    private detectPipelinePattern(intent: string): boolean {
        return /^pipeline\s+\w*$/.test(intent.trim()) || intent.includes('流程') || intent.includes('管道');
    }

    private detectClassPattern(intent: string): boolean {
        return /^class\s+\w*$/.test(intent.trim()) || intent.includes('类');
    }

    private generateMethodPatterns(intent: string, context: GenerationContext): vscode.CompletionItem[] {
        const patterns = this.patterns.get('learning_method') || [];
        return patterns.map(pattern => this.createCompletionFromPattern(pattern, context)).filter(Boolean) as vscode.CompletionItem[];
    }

    private generatePipelinePatterns(intent: string, context: GenerationContext): vscode.CompletionItem[] {
        const patterns = this.patterns.get('workflow') || [];
        return patterns.map(pattern => this.createCompletionFromPattern(pattern, context)).filter(Boolean) as vscode.CompletionItem[];
    }

    private generateClassPatterns(intent: string, context: GenerationContext): vscode.CompletionItem[] {
        const patterns = this.patterns.get('class_definition') || [];
        return patterns.map(pattern => this.createCompletionFromPattern(pattern, context)).filter(Boolean) as vscode.CompletionItem[];
    }

    private findRelatedMethods(functionName: string, symbols: LDLSymbol[]): LDLSymbol[] {
        const currentFunction = symbols.find(s => s.name === functionName);
        if (!currentFunction || !currentFunction.labels) return [];

        return symbols.filter(s =>
            s.name !== functionName &&
            s.labels &&
            s.labels.some(label => currentFunction.labels!.includes(label))
        );
    }

    private generateMethodCombinations(symbols: LDLSymbol[]): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        const methods = symbols.filter(s => s.type === 'function' || s.type === 'method');

        if (methods.length >= 2) {
            const combination = methods.slice(0, 3);
            const item = new vscode.CompletionItem('智能流程组合', vscode.CompletionItemKind.Snippet);
            item.detail = `组合多个方法: ${combination.map(m => m.name).join(' → ')}`;

            const template = `pipeline smart_workflow {
    ${combination.map((m, i) => `${m.name}($${i + 1})`).join('\n    ')}
}$0`;

            item.insertText = new vscode.SnippetString(template);
            item.sortText = 'ac_combination';
            completions.push(item);
        }

        return completions;
    }

    private getUserFavoritePatterns(): string[] {
        // 基于使用频率排序
        return Array.from(this.userPreferences.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([pattern]) => pattern);
    }

    // 记录用户使用的模式
    public recordPatternUsage(patternName: string): void {
        const current = this.userPreferences.get(patternName) || 0;
        this.userPreferences.set(patternName, current + 1);

        this.generationHistory.push(patternName);
        if (this.generationHistory.length > 50) {
            this.generationHistory.shift();
        }
    }

    // 获取生成统计
    public getGenerationStats(): { totalGenerated: number; favoritePattern: string; recentPatterns: string[] } {
        const total = this.generationHistory.length;
        const favorite = this.getUserFavoritePatterns()[0] || 'none';
        const recent = this.generationHistory.slice(-10);

        return {
            totalGenerated: total,
            favoritePattern: favorite,
            recentPatterns: recent
        };
    }
}