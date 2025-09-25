# LDL (Learning Domain Language)

<div align="center">

![LDL Logo](https://img.shields.io/badge/LDL-Learning%20Domain%20Language-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K)

**A Modern Methodological Domain-Specific Language**

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-007ACC?logo=visual-studio-code)](./vscode-extension/ldl-language-support/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Ye-Yu-Mo/LDL?style=social)](https://github.com/Ye-Yu-Mo/LDL)

**English** | **[中文](./README.md)**

</div>

---

## Project Vision

LDL (Learning Domain Language) aims to solve pain points in learning methodology recording and management by codifying knowledge to make it structured, standardized, and reusable.

### Problems We Solve

- **Information Redundancy**: Traditional notes contain redundant conjunctions, mood words, and other unnecessary information
- **Vague Descriptions**: Knowing only method names without clear execution steps
- **Search Difficulties**: Hard to quickly index, navigate, and reuse existing methods
- **Lack of Association**: Methods lack effective combination and correlation capabilities

---

## Core Features

### Modern Syntax Design
- **Mainstream Programming Language Style**: Python/Rust/TypeScript inspired syntax
- **Strong Type System**: Support for type annotations and type checking
- **Modular Design**: Support for functions, classes, pipelines, and other code organization patterns

### Method Overloading & Versioning
```ldl
/// SQ3R classic version
fn SQ3R(version: "classic") -> Steps { ... }

/// SQ3R academic paper specialized version
fn SQ3R(version: "academic") -> Steps { ... }
```

### Process Composition & Orchestration
```ldl
pipeline learning_workflow {
    SQ3R(version="academic")
    cornell_notes()
    mind_mapping(depth: 3)
    spaced_repetition(interval: 24)
}
```

### Smart Label System
```ldl
@label("learning")
@label("reading")
@label("academic")
fn systematic_reading() -> Steps { ... }
```

### AI-Enhanced Development Experience
- **Smart Completion**: Context-aware code completion
- **Error Detection**: Real-time syntax and semantic error hints
- **AI Code Generation**: Intent-based code template generation
- **Smart Variable Suggestions**: Context-aware variable name recommendations
- **Cross-file Navigation**: Support for cross-file definition jumping and reference finding

---

## Syntax Examples

### Basic Method Definition

```ldl
/// Cornell Note-taking Method
/// An efficient note-taking and review method
@label("note_taking")
@label("learning")
fn cornell_notes(subject: str, format: str = "physical") -> Steps {
    let preparation = [
        "Prepare notebook or digital tool",
        "Divide page into areas: note area, cue area, summary area"
    ]

    let recording = [
        "Record key points in note area",
        "Write keywords in cue area after class",
        "Summarize main content in summary area"
    ]

    return preparation + recording
}
```

### Advanced Process Composition

```ldl
/// Complete academic research workflow
@label("research")
@label("academic")
pipeline research_methodology {
    // Literature review phase
    literature_review(scope: "comprehensive", depth: 3)

    // Problem definition phase
    if research_type == "empirical" {
        hypothesis_formation()
        variable_identification()
    } else {
        theoretical_framework_building()
    }

    // Data collection and analysis
    data_collection(method: "mixed")
    data_analysis(approach: "quantitative_qualitative")

    // Results presentation
    findings_synthesis()
    conclusion_drawing()
    academic_writing(style: "APA")
}
```

### Class and Method Inheritance

```ldl
/// Analysis method base class
@label("analysis")
abstract class AnalysisMethod {
    fn prepare(data: str) -> PreparedData {
        // Common data preprocessing logic
    }

    abstract fn analyze(data: PreparedData) -> Results

    fn report(results: Results, format: str = "markdown") -> Report {
        // Common report generation logic
    }
}

/// SWOT analysis implementation
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

## Developer Tools

### VS Code Extension

We provide a full-featured VS Code extension including:

- **Syntax Highlighting**: Complete LDL syntax highlighting support
- **Smart Navigation**: Symbol jumping, definition finding, reference searching
- **Smart Completion**: AI-enhanced code completion system
  - Context-aware completion
  - Smart variable name suggestions
  - Semantic method recommendations
  - Automatic code snippet generation
- **Error Detection**: Real-time syntax and semantic error checking
- **Label System**: Tag-based symbol organization and search
- **Cross-file Features**: Support for multi-file project definition jumping

#### Installation
Search for "LDL Learning Domain Language" in the VS Code Extension Marketplace, or:

```bash
# Install from source
cd vscode-extension/ldl-language-support
npm install
npm run compile
# Press F5 in VS Code to start debugging
```

---

## Quick Start

### 1. Environment Setup

```bash
# Clone the project
git clone https://github.com/Ye-Yu-Mo/LDL.git
cd LDL

# Install VS Code extension
cd vscode-extension/ldl-language-support
npm install
npm run compile
```

### 2. Create Your First LDL File

Create `my_learning_methods.ldl`:

```ldl
/// My Learning Methods Library
/// Record and manage personal learning methodologies

/// Pomodoro Technique
@label("productivity")
@label("time_management")
fn pomodoro_technique(work_duration: int = 25, break_duration: int = 5) -> Steps {
    let cycle = [
        "Set timer for work duration",
        "Focus on work, avoid distractions",
        "Take short break when timer ends",
        "Take long break after 4 cycles"
    ]
    return cycle
}

/// Feynman Learning Technique
@label("learning")
@label("teaching")
fn feynman_technique(topic: str) -> Steps {
    let process = [
        "Choose concept to learn",
        "Try to explain it in simple terms to others",
        "Identify gaps in understanding",
        "Go back to study materials to deepen understanding",
        "Repeat explanation until fully mastered"
    ]
    return process
}

/// Comprehensive learning workflow
pipeline effective_learning {
    pomodoro_technique(work_duration: 50, break_duration: 10)
    feynman_technique(topic: "target concept")
}
```

### 3. Experience Smart Features

1. **Syntax Highlighting**: Immediately see colorful syntax highlighting
2. **Smart Completion**: Press `Ctrl+Space` while typing for suggestions
3. **Symbol Navigation**: `Ctrl+Shift+O` to view file symbol structure
4. **Global Search**: `Ctrl+T` to search `@label:productivity`
5. **Error Detection**: See real-time syntax and semantic error hints
6. **Cross-file Navigation**: `Ctrl+Click` or `F12` to jump to definitions

---

## Project Structure

```
LDL/
├── README.md                          # Main documentation (Chinese)
├── README_EN.md                       # Main documentation (English)
├── 快速开始.md                        # Quick start guide
├── vscode-extension/                  # VS Code extension
│   └── ldl-language-support/
│       ├── src/                      # Source code
│       │   ├── completionProvider.ts   # Smart completion system
│       │   ├── variableCompletionProvider.ts # Variable completion
│       │   ├── aiCodeGenerator.ts      # AI code generation
│       │   ├── errorDetector.ts        # Error detection system
│       │   ├── definitionProvider.ts   # Cross-file navigation
│       │   └── parser.ts               # LDL parser
│       ├── examples/                 # Example files
│       ├── syntaxes/                 # Syntax highlighting definitions
│       └── package.json              # Extension configuration
├── docs/                             # Complete documentation
├── examples/                         # Example code library
└── 使用文档.md                       # Detailed usage documentation
```

---

## Project Status

### Completed Features

#### Core Language Features
- [x] Complete syntax design and specification
- [x] Function definition and method overloading
- [x] Pipeline process composition
- [x] Class definition and inheritance
- [x] Label system and metadata
- [x] Type system and type aliases

#### VS Code Plugin
- [x] Syntax highlighting and theme support
- [x] Symbol navigation and jumping
- [x] Cross-file definition jumping
- [x] Document symbols and global search
- [x] Smart completion system
  - [x] Multi-level context analysis
  - [x] Smart caching mechanism
  - [x] Usage frequency learning
  - [x] Semantic pattern recognition
- [x] Variable completion system
  - [x] Scope-aware completion
  - [x] Smart variable name suggestions
- [x] AI code generation
  - [x] Intent-based code generation
  - [x] Pattern matching and template filling
- [x] Error detection system
  - [x] Syntax, semantic, style checking
  - [x] Automatic fix suggestions

#### Documentation System
- [x] Bilingual Chinese-English documentation
- [x] Complete usage documentation
- [x] Syntax reference manual
- [x] Developer guide

### In Progress

- [ ] Performance optimization and large file support
- [ ] Unit test coverage improvement
- [ ] User feedback collection and analysis

### Planned

#### Feature Enhancement
- [ ] Hover information and smart hints
- [ ] Code snippet template system
- [ ] Refactoring tools and batch operations
- [ ] Plugin settings and personalized configuration

#### Visualization Analysis
- [ ] Method call relationship visualization
- [ ] Tag network graphs and clustering analysis
- [ ] Automatic flowchart generation
- [ ] Statistical analysis panels

#### Export and Sharing
- [ ] Multi-format document generation (HTML/PDF/Markdown)
- [ ] Online sharing and collaboration platform
- [ ] External tool integration (Notion/Obsidian/Anki)

---

## Contributing

We welcome all forms of contributions! Whether code contributions, documentation improvements, bug reports, or feature suggestions.

### Development Contribution

1. **Fork the project** and create your branch
```bash
git checkout -b feature/amazing-feature
```

2. **Set up development environment**
```bash
cd vscode-extension/ldl-language-support
npm install
npm run compile
```

3. **Commit your changes**
```bash
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature
```

4. **Create Pull Request**

### Documentation Contribution

- Improve existing documentation
- Add usage examples
- Translate documentation
- Fix spelling errors

### Bug Reports

Use [GitHub Issues](https://github.com/Ye-Yu-Mo/LDL/issues) to report bugs, please include:
- Detailed reproduction steps
- Expected behavior
- Actual observed behavior
- Environment information (OS, VS Code version, etc.)

### Feature Suggestions

We look forward to your innovative ideas! Please describe in Issues:
- Usage scenarios for the feature
- Specific implementation suggestions
- Impact on existing features

---

## Contact

- **Project Author**: [@Ye-Yu-Mo](https://github.com/Ye-Yu-Mo)
- **GitHub Issues**: [Bug reports and feature requests](https://github.com/Ye-Yu-Mo/LDL/issues)
- **GitHub Discussions**: [Community discussions and sharing](https://github.com/Ye-Yu-Mo/LDL/discussions)

---

## Learning Resources

- [Complete Syntax Guide](./docs/LDL关键字参考.md)
- [Variable Type Reference](./docs/LDL变量类型参考.md)
- [Usage Documentation](./使用文档.md)
- [Development Documentation](./vscode-extension/ldl-language-support/开发文档.md)

---

## License

This project is licensed under the [MIT License](LICENSE). This means you can freely use, modify, and distribute this project for both personal and commercial purposes.

---

## Acknowledgments

Thanks to all developers, users, and supporters who have contributed to the LDL project!

### Core Contributors
- [@Ye-Yu-Mo](https://github.com/Ye-Yu-Mo) - Project founder and main maintainer

### Special Thanks
- VS Code team for the excellent extension API
- Tree-sitter project for syntax parsing technology
- All early users who provided feedback and suggestions

---

<div align="center">

## Vision

**Make methodology recording, learning, and application more efficient and systematic**

**Help everyone build their own methodology knowledge base**

---

**LDL - Make methodologies structured, make learning more efficient!**

[Back to Top](#ldl-learning-domain-language)

</div>