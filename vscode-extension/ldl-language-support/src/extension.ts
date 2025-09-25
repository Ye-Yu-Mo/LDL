import * as vscode from 'vscode';
import { LDLDefinitionProvider } from './definitionProvider';
import { LDLDocumentSymbolProvider } from './documentSymbolProvider';
import { LDLWorkspaceSymbolProvider } from './workspaceSymbolProvider';
import { LDLCompletionProvider } from './completionProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('LDL Language Support is now active!');

    const documentSelector = { scheme: 'file', language: 'ldl' };

    // 注册定义提供器
    const definitionProvider = vscode.languages.registerDefinitionProvider(
        documentSelector,
        new LDLDefinitionProvider()
    );

    // 注册文档符号提供器 (Ctrl+Shift+O - 文件内符号导航)
    const documentSymbolProvider = vscode.languages.registerDocumentSymbolProvider(
        documentSelector,
        new LDLDocumentSymbolProvider()
    );

    // 注册工作区符号提供器 (Ctrl+T - 全局符号搜索)
    const workspaceSymbolProvider = vscode.languages.registerWorkspaceSymbolProvider(
        new LDLWorkspaceSymbolProvider()
    );

    // 注册自动补全提供器 (Ctrl+Space - 智能补全)
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        documentSelector,
        new LDLCompletionProvider(),
        '(', '"', "'", '@', '.', ':'  // 触发字符
    );

    context.subscriptions.push(
        definitionProvider,
        documentSymbolProvider,
        workspaceSymbolProvider,
        completionProvider
    );
}

export function deactivate() {}