# LDL (Learning Domain Language)

<div align="center">

![LDL Logo](https://img.shields.io/badge/LDL-Learning%20Domain%20Language-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K)

**一种面向方法论的现代化描述性 DSL**

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-007ACC?logo=visual-studio-code)](./vscode-extension/ldl-language-support/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Ye-Yu-Mo/LDL?style=social)](https://github.com/Ye-Yu-Mo/LDL)

**[English](./README_EN.md)** | **中文**

</div>

---

## 项目愿景

LDL (Learning Domain Language) 致力于解决学习方法论记录和管理中的痛点，通过代码化的方式让知识结构化、方法标准化、经验可复用。

### 解决的问题

- **信息冗余**: 传统笔记含有大量连词、语气词等冗余信息
- **模糊描述**: 只知道方法名，不清楚具体执行步骤
- **检索困难**: 难以快速索引、跳转和复用已有方法
- **缺乏关联**: 方法间缺乏有效的组合和关联能力

---

## 核心特性

### 现代化语法设计
- **类似主流编程语言**: Python/Rust/TypeScript 风格的语法
- **强类型系统**: 支持类型注释和类型检查
- **模块化设计**: 支持函数、类、pipeline 等多种代码组织方式

### 方法重载与版本化
```ldl
/// SQ3R 经典版本
fn SQ3R(version: "classic") -> Steps { ... }

/// SQ3R 学术论文专用版本
fn SQ3R(version: "academic") -> Steps { ... }
```

### 流程组合与编排
```ldl
pipeline learning_workflow {
    SQ3R(version="academic")
    cornell_notes()
    mind_mapping(depth: 3)
    spaced_repetition(interval: 24)
}
```

### 智能标签系统
```ldl
@label("learning")
@label("reading")
@label("academic")
fn systematic_reading() -> Steps { ... }
```

### AI 增强的开发体验
- **智能补全**: 上下文感知的代码补全
- **错误检测**: 实时语法和语义错误提示
- **AI 代码生成**: 基于意图的代码模板生成
- **变量智能建议**: 根据上下文自动建议合适的变量名
- **跨文件跳转**: 支持跨文件的定义跳转和引用查找

---

## 语法示例

### 基础方法定义

```ldl
/// 康奈尔笔记法
/// 一种高效的笔记记录和复习方法
@label("note_taking")
@label("learning")
fn cornell_notes(subject: str, format: str = "physical") -> Steps {
    let preparation = [
        "准备笔记本或数字工具",
        "划分页面区域：笔记区、提示区、总结区"
    ]

    let recording = [
        "在笔记区记录要点",
        "课后在提示区写关键词",
        "在总结区概括主要内容"
    ]

    return preparation + recording
}
```

### 高级流程组合

```ldl
/// 完整的学术研究流程
@label("research")
@label("academic")
pipeline research_methodology {
    // 文献调研阶段
    literature_review(scope: "comprehensive", depth: 3)

    // 问题定义阶段
    if research_type == "empirical" {
        hypothesis_formation()
        variable_identification()
    } else {
        theoretical_framework_building()
    }

    // 数据收集与分析
    data_collection(method: "mixed")
    data_analysis(approach: "quantitative_qualitative")

    // 结果呈现
    findings_synthesis()
    conclusion_drawing()
    academic_writing(style: "APA")
}
```

### 类与方法继承

```ldl
/// 分析方法基类
@label("analysis")
abstract class AnalysisMethod {
    fn prepare(data: str) -> PreparedData {
        // 数据预处理的通用逻辑
    }

    abstract fn analyze(data: PreparedData) -> Results

    fn report(results: Results, format: str = "markdown") -> Report {
        // 生成分析报告的通用逻辑
    }
}

/// SWOT 分析的具体实现
@label("strategic_analysis")
class SWOTAnalysis extends AnalysisMethod {
    fn analyze(data: PreparedData) -> SWOTResults {
        let strengths = identify_strengths(data)
        let weaknesses = identify_weaknesses(data)
        let opportunities = identify_opportunities(data)
        let threats = identify_threats(data)

        return SWOTResults {
            strengths,
            weaknesses,
            opportunities,
            threats,
            strategic_recommendations: derive_strategies(
                strengths, weaknesses, opportunities, threats
            )
        }
    }
}
```

---

## 开发工具

### VS Code 扩展

我们提供了功能完整的 VS Code 扩展，包含：

- **语法高亮**: 完整的 LDL 语法高亮支持
- **智能导航**: 符号跳转、定义查找、引用搜索
- **智能补全**: AI 增强的代码补全系统
  - 上下文感知补全
  - 变量名智能建议
  - 基于语义的方法推荐
  - 代码片段自动生成
- **错误检测**: 实时语法和语义错误检查
- **标签系统**: 基于标签的符号组织和搜索
- **跨文件功能**: 支持多文件项目的定义跳转

#### 安装方式
可以在 VS Code 扩展商店搜索 "LDL Learning Domain Language" 直接安装，或：

```bash
# 从源码安装
cd vscode-extension/ldl-language-support
npm install
npm run compile
# 在 VS Code 中按 F5 启动调试
```

---

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone https://github.com/Ye-Yu-Mo/LDL.git
cd LDL

# 安装 VS Code 扩展
cd vscode-extension/ldl-language-support
npm install
npm run compile
```

### 2. 创建你的第一个 LDL 文件

创建 `my_learning_methods.ldl`:

```ldl
/// 我的学习方法库
/// 记录和管理个人学习方法论

/// 番茄工作法
@label("productivity")
@label("time_management")
fn pomodoro_technique(work_duration: int = 25, break_duration: int = 5) -> Steps {
    let cycle = [
        "设置计时器到工作时间",
        "专注工作，避免干扰",
        "计时结束后短暂休息",
        "完成4个周期后长休息"
    ]
    return cycle
}

/// 费曼学习法
@label("learning")
@label("teaching")
fn feynman_technique(topic: str) -> Steps {
    let process = [
        "选择要学习的概念",
        "尝试用简单语言解释给别人听",
        "发现理解不足的地方",
        "回到学习资料加深理解",
        "重复解释直到完全掌握"
    ]
    return process
}

/// 综合学习流程
pipeline effective_learning {
    pomodoro_technique(work_duration: 50, break_duration: 10)
    feynman_technique(topic: "目标概念")
}
```

### 3. 体验智能功能

1. **语法高亮**: 立即看到彩色的语法高亮
2. **智能补全**: 输入时按 `Ctrl+Space` 获取建议
3. **符号导航**: `Ctrl+Shift+O` 查看文件符号结构
4. **全局搜索**: `Ctrl+T` 搜索 `@label:productivity`
5. **错误检测**: 实时看到语法和语义错误提示
6. **跨文件跳转**: `Ctrl+Click` 或 `F12` 跳转到定义

---

## 项目结构

```
LDL/
├── README.md                          # 项目主文档（中文）
├── README_EN.md                       # 项目主文档（英文）
├── 快速开始.md                        # 快速入门指南
├── vscode-extension/                  # VS Code 扩展
│   └── ldl-language-support/
│       ├── src/                      # 源代码
│       │   ├── completionProvider.ts   # 智能补全系统
│       │   ├── variableCompletionProvider.ts # 变量补全
│       │   ├── aiCodeGenerator.ts      # AI 代码生成
│       │   ├── errorDetector.ts        # 错误检测系统
│       │   ├── definitionProvider.ts   # 跨文件跳转
│       │   └── parser.ts               # LDL 解析器
│       ├── examples/                 # 示例文件
│       ├── syntaxes/                 # 语法高亮定义
│       └── package.json              # 扩展配置
├── docs/                             # 完整文档
├── examples/                         # 示例代码库
└── 使用文档.md                       # 详细使用说明
```

---

## 项目状态

### 已完成功能

#### 核心语言特性
- [x] 完整的语法设计和规范
- [x] 函数定义与方法重载
- [x] Pipeline 流程组合
- [x] 类定义与继承
- [x] 标签系统与元数据
- [x] 类型系统与类型别名

#### VS Code 插件
- [x] 语法高亮与主题支持
- [x] 符号导航与跳转
- [x] 跨文件定义跳转
- [x] 文档符号与全局搜索
- [x] 智能补全系统
  - [x] 多层次上下文分析
  - [x] 智能缓存机制
  - [x] 使用频率学习
  - [x] 语义模式识别
- [x] 变量补全系统
  - [x] 作用域感知补全
  - [x] 智能变量名建议
- [x] AI 代码生成
  - [x] 基于意图的代码生成
  - [x] 模式匹配与模板填充
- [x] 错误检测系统
  - [x] 语法、语义、样式检查
  - [x] 自动修复建议

#### 文档体系
- [x] 中英文双语文档
- [x] 完整的使用文档
- [x] 语法参考手册
- [x] 开发者指南

### 进行中

- [ ] 性能优化与大文件支持
- [ ] 单元测试覆盖率提升
- [ ] 用户反馈收集与分析

### 规划中

#### 功能增强
- [ ] 悬停信息与智能提示
- [ ] 代码片段模板系统
- [ ] 重构工具与批量操作
- [ ] 插件设置与个性化配置

#### 可视化分析
- [ ] 方法调用关系可视化
- [ ] 标签网络图与聚类分析
- [ ] 流程图自动生成
- [ ] 统计分析面板

#### 导出分享
- [ ] 多格式文档生成 (HTML/PDF/Markdown)
- [ ] 在线分享与协作平台
- [ ] 外部工具集成 (Notion/Obsidian/Anki)

---

## 贡献指南

我们欢迎所有形式的贡献！无论是代码贡献、文档改进、bug 报告还是功能建议。

### 开发贡献

1. **Fork 项目** 并创建你的分支
```bash
git checkout -b feature/amazing-feature
```

2. **设置开发环境**
```bash
cd vscode-extension/ldl-language-support
npm install
npm run compile
```

3. **提交你的改动**
```bash
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature
```

4. **创建 Pull Request**

### 文档贡献

- 改进现有文档
- 添加使用示例
- 翻译文档
- 修复拼写错误

### Bug 报告

使用 [GitHub Issues](https://github.com/Ye-Yu-Mo/LDL/issues) 报告 bug，请包含：
- 详细的重现步骤
- 期望的行为
- 实际观察到的行为
- 环境信息 (OS, VS Code 版本等)

### 功能建议

我们期待你的创新想法！请在 Issues 中描述：
- 功能的使用场景
- 具体的实现建议
- 对现有功能的影响

---

## 联系方式

- **项目作者**: [@Ye-Yu-Mo](https://github.com/Ye-Yu-Mo)
- **GitHub Issues**: [问题报告与功能请求](https://github.com/Ye-Yu-Mo/LDL/issues)
- **GitHub Discussions**: [社区讨论与分享](https://github.com/Ye-Yu-Mo/LDL/discussions)

---

## 学习资源

- [语法完整指南](./docs/LDL关键字参考.md)
- [变量类型参考](./docs/LDL变量类型参考.md)
- [使用文档](./使用文档.md)
- [开发文档](./vscode-extension/ldl-language-support/开发文档.md)

---

## 许可证

本项目采用 [MIT 许可证](LICENSE)。这意味着你可以自由使用、修改、分发本项目，无论是用于个人项目还是商业用途。

---

## 致谢

感谢所有为 LDL 项目做出贡献的开发者、用户和支持者！

### 核心贡献者
- [@Ye-Yu-Mo](https://github.com/Ye-Yu-Mo) - 项目创始人与主要维护者

### 特别鸣谢
- VS Code 团队提供的优秀扩展 API
- Tree-sitter 项目的语法解析技术
- 所有提供反馈和建议的早期用户

---

<div align="center">

## 愿景

**让方法论的记录、学习和应用变得更加高效和系统化**

**帮助每个人建立自己的方法论知识库**

---

**LDL - 让方法论结构化，让学习更高效！**

[回到顶部](#ldl-learning-domain-language)

</div>