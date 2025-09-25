import * as vscode from 'vscode';

export interface LDLSymbol {
    name: string;
    position: vscode.Position;
    type: 'function' | 'pipeline' | 'type_alias' | 'macro' | 'constant' | 'class' | 'method';
    version?: string;
    value?: string; // 用于宏和常量的值
    aliasType?: string; // 用于类型别名的目标类型
    className?: string; // 用于方法所属的类名
    parentClass?: string; // 用于类继承的父类名
    isStatic?: boolean; // 用于标记静态方法
    labels?: string[]; // 标签列表
    documentation?: string; // 文档注释
}

export class LDLParser {
    private symbols: Map<string, LDLSymbol[]> = new Map();
    private labelIndex: Map<string, LDLSymbol[]> = new Map(); // 按label分类的索引

    parseDocument(document: vscode.TextDocument): void {
        this.symbols.clear();
        this.labelIndex.clear();
        const text = document.getText();
        
        // 解析类定义
        this.parseClasses(text, document);
        
        // 解析函数定义
        this.parseFunctions(text, document);
        
        // 解析 pipeline 定义
        this.parsePipelines(text, document);
        
        // 解析类型别名
        this.parseTypeAliases(text, document);
        
        // 解析宏定义
        this.parseMacros(text, document);
        
        // 解析常量定义
        this.parseConstants(text, document);
    }

    private parseLabelsAndDocumentation(text: string, startIndex: number): { labels: string[], documentation?: string } {
        const lines = text.substring(0, startIndex).split('\n');
        const labels: string[] = [];
        let documentation: string | undefined;

        // 从后往前查找连续的标签和注释
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();

            // 检查是否是@label装饰器
            const labelMatch = line.match(/^@label\(["']([^"']+)["']\)$/);
            if (labelMatch) {
                labels.unshift(labelMatch[1]); // 保持顺序
                continue;
            }

            // 检查是否是文档注释
            if (line.startsWith('///')) {
                documentation = line.substring(3).trim();
                continue;
            }

            // 如果遇到非装饰器、非注释的行，停止查找
            if (line !== '' && !line.startsWith('@') && !line.startsWith('//')) {
                break;
            }
        }

        return { labels, documentation };
    }

    private addToLabelIndex(symbol: LDLSymbol): void {
        if (symbol.labels) {
            for (const label of symbol.labels) {
                if (!this.labelIndex.has(label)) {
                    this.labelIndex.set(label, []);
                }
                this.labelIndex.get(label)!.push(symbol);
            }
        }
    }

    private parseClasses(text: string, document: vscode.TextDocument): void {
        // 匹配 class Name 或 class Name extends Parent 模式
        const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
        
        let match;
        while ((match = classRegex.exec(text)) !== null) {
            const name = match[1];
            const parentClass = match[2];
            const position = document.positionAt(match.index);

            // 解析标签和文档
            const { labels, documentation } = this.parseLabelsAndDocumentation(text, match.index);

            const symbol: LDLSymbol = {
                name,
                position,
                type: 'class',
                parentClass,
                labels,
                documentation
            };

            if (!this.symbols.has(name)) {
                this.symbols.set(name, []);
            }
            this.symbols.get(name)!.push(symbol);
            this.addToLabelIndex(symbol);
            
            // 解析类内的方法
            this.parseClassMethods(text, document, name, match.index);
        }
    }

    private parseClassMethods(text: string, document: vscode.TextDocument, className: string, classStartIndex: number): void {
        // 找到类的结束位置
        const classEndIndex = this.findClassEndIndex(text, classStartIndex);
        const classBody = text.substring(classStartIndex, classEndIndex);
        
        // 匹配类内的方法：static fn name(...) 或 fn name(...)
        const methodRegex = /(static\s+)?fn\s+(\w+)(?:\s*\([^)]*version:\s*"([^"]+)"[^)]*\))?/g;
        
        let match;
        while ((match = methodRegex.exec(classBody)) !== null) {
            const isStatic = !!match[1];
            const methodName = match[2];
            const version = match[3];
            const position = document.positionAt(classStartIndex + match.index);

            // 解析标签和文档
            const { labels, documentation } = this.parseLabelsAndDocumentation(text, classStartIndex + match.index);

            const symbol: LDLSymbol = {
                name: methodName,
                position,
                type: 'method',
                className,
                version,
                isStatic,
                labels,
                documentation
            };

            if (!this.symbols.has(methodName)) {
                this.symbols.set(methodName, []);
            }
            this.symbols.get(methodName)!.push(symbol);
            this.addToLabelIndex(symbol);
        }
    }

    private findClassEndIndex(text: string, startIndex: number): number {
        let braceCount = 0;
        let inString = false;
        let stringChar = '';
        
        for (let i = startIndex; i < text.length; i++) {
            const char = text[i];
            
            if (!inString) {
                if (char === '"' || char === "'") {
                    inString = true;
                    stringChar = char;
                } else if (char === '{') {
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        return i + 1;
                    }
                }
            } else {
                if (char === stringChar && text[i - 1] !== '\\') {
                    inString = false;
                }
            }
        }
        
        return text.length;
    }

    private parseFunctions(text: string, document: vscode.TextDocument): void {
        // 匹配顶级函数：fn name(...) 或 fn name(version: "...") 模式（不在类内）
        const fnRegex = /(?:^|\n)\s*(fn\s+(\w+)(?:\s*\([^)]*version:\s*"([^"]+)"[^)]*\))?)/gm;
        
        let match;
        while ((match = fnRegex.exec(text)) !== null) {
            // 检查这个函数是否在类内部
            if (this.isInsideClass(text, match.index)) {
                continue; // 跳过类内方法，由 parseClassMethods 处理
            }
            
            const name = match[2];
            const version = match[3];
            const position = document.positionAt(match.index + match[0].indexOf('fn'));

            // 解析标签和文档
            const { labels, documentation } = this.parseLabelsAndDocumentation(text, match.index);

            const symbol: LDLSymbol = {
                name,
                position,
                type: 'function',
                version,
                labels,
                documentation
            };

            if (!this.symbols.has(name)) {
                this.symbols.set(name, []);
            }
            this.symbols.get(name)!.push(symbol);
            this.addToLabelIndex(symbol);
        }
    }

    private isInsideClass(text: string, position: number): boolean {
        // 简单检查：从位置向前查找最近的 class 和 } 
        const beforeText = text.substring(0, position);
        const lastClassIndex = beforeText.lastIndexOf('class ');
        const lastBraceIndex = beforeText.lastIndexOf('}');
        
        return lastClassIndex > lastBraceIndex && lastClassIndex !== -1;
    }

    private parsePipelines(text: string, document: vscode.TextDocument): void {
        const pipelineRegex = /pipeline\s+(\w+)/g;
        
        let match;
        while ((match = pipelineRegex.exec(text)) !== null) {
            const name = match[1];
            const position = document.positionAt(match.index);

            // 解析标签和文档
            const { labels, documentation } = this.parseLabelsAndDocumentation(text, match.index);

            const symbol: LDLSymbol = {
                name,
                position,
                type: 'pipeline',
                labels,
                documentation
            };

            if (!this.symbols.has(name)) {
                this.symbols.set(name, []);
            }
            this.symbols.get(name)!.push(symbol);
            this.addToLabelIndex(symbol);
        }
    }

    private parseTypeAliases(text: string, document: vscode.TextDocument): void {
        // 匹配 using Name = Type 模式
        const aliasRegex = /using\s+(\w+)\s*=\s*(\w+)/g;
        
        let match;
        while ((match = aliasRegex.exec(text)) !== null) {
            const name = match[1];
            const aliasType = match[2];
            const position = document.positionAt(match.index);
            
            const symbol: LDLSymbol = {
                name,
                position,
                type: 'type_alias',
                aliasType
            };

            if (!this.symbols.has(name)) {
                this.symbols.set(name, []);
            }
            this.symbols.get(name)!.push(symbol);
        }
    }

    private parseMacros(text: string, document: vscode.TextDocument): void {
        // 匹配 macro NAME value 模式
        const macroRegex = /macro\s+(\w+)\s+([^\r\n]+)/g;
        
        let match;
        while ((match = macroRegex.exec(text)) !== null) {
            const name = match[1];
            const value = match[2].trim();
            const position = document.positionAt(match.index);
            
            const symbol: LDLSymbol = {
                name,
                position,
                type: 'macro',
                value
            };

            if (!this.symbols.has(name)) {
                this.symbols.set(name, []);
            }
            this.symbols.get(name)!.push(symbol);
        }
    }

    private parseConstants(text: string, document: vscode.TextDocument): void {
        // 匹配 const NAME = value 模式
        const constRegex = /const\s+(\w+)\s*=\s*([^\r\n]+)/g;
        
        let match;
        while ((match = constRegex.exec(text)) !== null) {
            const name = match[1];
            const value = match[2].trim();
            const position = document.positionAt(match.index);
            
            const symbol: LDLSymbol = {
                name,
                position,
                type: 'constant',
                value
            };

            if (!this.symbols.has(name)) {
                this.symbols.set(name, []);
            }
            this.symbols.get(name)!.push(symbol);
        }
    }

    findSymbol(name: string, version?: string, className?: string): LDLSymbol | undefined {
        const symbols = this.symbols.get(name);
        if (!symbols) return undefined;

        // 如果指定了类名，优先查找该类的方法
        if (className) {
            const classMethod = symbols.find(s => s.className === className);
            if (classMethod) return classMethod;
        }

        if (version) {
            return symbols.find(s => s.version === version);
        }

        // 返回第一个匹配的符号
        return symbols[0];
    }

    findAllSymbols(name: string, version?: string, className?: string): LDLSymbol[] {
        const symbols = this.symbols.get(name);
        if (!symbols) return [];

        // 如果指定了类名，返回该类的所有匹配方法
        if (className) {
            const classMethods = symbols.filter(s => s.className === className);
            if (classMethods.length > 0) {
                // 如果还指定了版本，进一步过滤
                if (version) {
                    return classMethods.filter(s => s.version === version);
                }
                return classMethods;
            }
        }

        // 如果指定了版本，返回所有该版本的符号
        if (version) {
            return symbols.filter(s => s.version === version);
        }

        // 返回所有匹配的符号
        return [...symbols];
    }

    findSymbolsByLabel(label: string): LDLSymbol[] {
        return this.labelIndex.get(label) || [];
    }

    getAllLabels(): string[] {
        return Array.from(this.labelIndex.keys()).sort();
    }

    getSymbolsByLabels(): Map<string, LDLSymbol[]> {
        return new Map(this.labelIndex);
    }

    getAllSymbols(): LDLSymbol[] {
        const result: LDLSymbol[] = [];
        for (const symbols of this.symbols.values()) {
            result.push(...symbols);
        }
        return result;
    }
}