# LDL Language Support

VS Code language support for LDL (Learning Domain Language) - a specialized language for describing learning methodologies and knowledge frameworks.

## ✨ Features

### 🎨 Rich Syntax Highlighting
- **Keywords**: `fn`, `pipeline`, `class`, `using`, `macro`, `const`
- **Types**: Built-in (`str`, `int`, `bool`) and custom types (`Steps`, `AnalysisSteps`)
- **Decorators**: `@label("tag_name")`
- **Comments**: `///` documentation, `//` line comments, `/* */` block comments
- **Operators**: `->`, `=`, `==`, `&&`, `::`, etc.
- **Function calls**: Parameter names, version information

### 🔍 Intelligent Navigation

#### Symbol Definition (`Ctrl+Click` or `F12`)
- Jump to function/pipeline definitions
- **Multi-definition support**: Choose between function overloads
- Version-aware navigation (e.g., `fn method(version: "advanced")`)

#### Document Symbol Navigation (`Ctrl+Shift+O`)
- **Label-based grouping**: Symbols organized by `@label` tags
- Hierarchical view with folder icons for each label
- Quick overview of file structure

#### Workspace Symbol Search (`Ctrl+T`)
- **Label search**: `@label:philosophy` or `label:learning`
- **Type search**: `type:function`, `type:pipeline`, `t:fn`
- **Name search**: Find symbols by name or documentation
- **Multi-criteria filtering**

### 🏷️ Label System
Organize your methodologies with a powerful tagging system:

```ldl
/// Dialectical materialism analysis method
@label("philosophy")
@label("dialectical_materialism")
fn dialectical_materialism() -> AnalysisSteps {
    observe_surface_phenomena(target)
    identify_internal_contradictions(depth: depth)
    analyze_contradiction_movement()
    return build_analysis_result()
}
```

## 🚀 Getting Started

1. **Install the extension** in VS Code
2. **Create a `.ldl` file** to start writing your methodologies
3. **Use labels** to organize your functions and pipelines
4. **Navigate with shortcuts**:
   - `Ctrl+Shift+O`: Browse symbols by label
   - `Ctrl+T`: Global search with filters
   - `Ctrl+Click`: Jump to definitions

## 📝 LDL Language Syntax

### Basic Structures

```ldl
// Type aliases
using AnalysisSteps = Steps
using ResearchMethod = str

// Constants and macros
const MAX_ITERATIONS = 10
macro DEBUG_MODE true

// Function with version support
fn analyze(version: "basic", input: str) -> AnalysisSteps {
    // Implementation
}

fn analyze(version: "advanced", input: str, depth: int) -> AnalysisSteps {
    // Advanced implementation
}

// Pipeline for complex workflows
@label("learning")
@label("systematic")
pipeline comprehensive_study {
    SQ3R(version: "academic")
    cornell_notes()
    spaced_repetition(interval: 24)
}
```

### Concrete Function Calls
Instead of abstract string descriptions, use concrete function calls:

```ldl
// ✅ Good: Concrete function calls
observe_surface_phenomena(target: "social_issue")
identify_internal_contradictions(depth: 3)
analyze_contradiction_movement()

// ❌ Avoid: Abstract string descriptions
let steps = ["observe", "analyze", "conclude"]
```

## ⌨️ Keyboard Shortcuts

| Action | Shortcut | Description |
|--------|----------|-------------|
| Go to Definition | `Ctrl+Click` or `F12` | Jump to symbol definition |
| Document Symbols | `Ctrl+Shift+O` | Browse file symbols by label |
| Workspace Symbols | `Ctrl+T` | Global symbol search |
| Find References | `Shift+F12` | Find all symbol references |
| Rename Symbol | `F2` | Rename symbol across workspace |

## 🔍 Search Examples

```bash
# Label-based search
@label:philosophy       # Find all philosophy-related methods
label:learning         # Find learning methodologies

# Type-based search
type:function          # Show only functions
type:pipeline          # Show only pipelines
t:fn                   # Short form for functions

# Name search
dialectical            # Find symbols containing "dialectical"
SQ3R                   # Find SQ3R method variants
```

## 🛠️ Requirements

- VS Code 1.60.0 or higher
- No additional dependencies required

## 📋 Best Practices

1. **Use descriptive labels**: `@label("learning_method")`, `@label("data_analysis")`
2. **Document functions**: Always include `///` documentation comments
3. **Version appropriately**: Create versions for different use cases
4. **Organize with pipelines**: Group related functions into workflows

## 🐛 Known Issues

- Large files (>1000 lines) may experience slower symbol parsing
- Label search is case-sensitive

## 🗺️ Roadmap

- [ ] Auto-completion for function names and parameters
- [ ] Hover information with documentation
- [ ] Error checking and diagnostics
- [ ] Code formatting
- [ ] Code snippets for common patterns

## 📞 Support

For issues, feature requests, or contributions, please visit our [GitHub repository](https://github.com/your-org/ldl-language-support).

---

**Happy learning and methodology building! 🧠✨**