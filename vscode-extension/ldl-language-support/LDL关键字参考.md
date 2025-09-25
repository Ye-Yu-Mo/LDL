# LDL 关键字参考文档

## 📖 概述

LDL (Learning Domain Language) 关键字是构成语言语法的核心元素。本文档详细描述每个关键字的用法、语法规则和实际应用场景。

## 🔧 声明关键字

### `fn` - 函数定义

**用途**: 定义函数，是 LDL 中最基础的代码组织单元

**语法**:
```ldl
fn function_name(parameters) -> return_type {
    // 函数体
}

fn function_name(version: "version_name", parameters) -> return_type {
    // 版本化函数体
}
```

**示例**:
```ldl
/// 基础阅读方法
fn read_systematically(text: str, depth: int = 3) -> Steps {
    scan_overview(text)
    identify_key_points(depth: depth)
    summarize_content()
    return compile_reading_result()
}

/// SQ3R 学术版本
fn SQ3R(version: "academic", material: str) -> Steps {
    survey_material(material, scope: "comprehensive")
    question_formation(type: "analytical")
    read_critically(material)
    recite_key_concepts()
    review_systematically()
    return academic_reading_result()
}
```

**特殊特性**:
- **版本支持**: 同名函数可以有不同版本实现
- **默认参数**: 支持参数默认值
- **类型标注**: 强制要求参数和返回值类型

---

### `pipeline` - 流程定义

**用途**: 定义复杂的工作流程，将多个函数组合成完整的方法论

**语法**:
```ldl
pipeline pipeline_name {
    function_call_1()
    function_call_2(parameters)
    conditional_logic
}
```

**示例**:
```ldl
/// 完整学习流程
@label("learning")
@label("systematic")
pipeline comprehensive_learning {
    // 预处理阶段
    assess_learning_goals(scope: "comprehensive")
    select_learning_materials(criteria: ["relevance", "difficulty"])

    // 核心学习阶段
    SQ3R(version: "academic", material: selected_materials)
    cornell_notes(format: "digital")

    // 巩固阶段
    spaced_repetition(intervals: [1, 3, 7, 14])
    active_recall_testing()

    // 评估阶段
    knowledge_assessment()
    adjust_learning_strategy()
}
```

**应用场景**:
- 复杂学习流程设计
- 方法论的标准化描述
- 最佳实践的流程化

---

### `class` - 类定义

**用途**: 定义面向对象的结构，封装相关的方法和数据

**语法**:
```ldl
class ClassName {
    // 静态方法
    static fn method_name(parameters) -> return_type { }

    // 实例方法
    fn method_name(self, parameters) -> return_type { }
}

class ChildClass extends ParentClass {
    // 继承和扩展
}
```

**示例**:
```ldl
/// 学习方法论基类
@label("learning_framework")
class LearningMethod {
    /// 创建学习方法实例
    static fn create(method_type: str, difficulty: str) -> LearningMethod {
        validate_method_type(method_type)
        configure_difficulty_level(difficulty)
        return instantiate_method(method_type, difficulty)
    }

    /// 执行学习方法
    fn execute(self, content: str, context: str) -> Steps {
        prepare_learning_environment(context)
        apply_method_to_content(self.method_type, content)
        return generate_learning_steps()
    }

    /// 评估学习效果
    fn evaluate_effectiveness(self, metrics: [str]) -> float {
        collect_performance_data(metrics)
        analyze_learning_outcomes()
        return calculate_effectiveness_score()
    }
}

/// 特化的阅读方法类
@label("reading")
class ReadingMethod extends LearningMethod {
    /// 针对不同文本类型的阅读策略
    fn adapt_to_text_type(self, text_type: str) -> Steps {
        if text_type == "academic_paper" {
            return academic_reading_strategy()
        } else if text_type == "technical_documentation" {
            return technical_reading_strategy()
        }
        return general_reading_strategy()
    }
}
```

---

## 🏷️ 元数据关键字

### `using` - 类型别名

**用途**: 为复杂类型创建易读的别名，提高代码可读性

**语法**:
```ldl
using AliasName = OriginalType
```

**示例**:
```ldl
// 基础类型别名
using AnalysisSteps = Steps
using ResearchMethod = str
using LearningOutcome = str
using EffectivenessScore = float

// 复杂类型别名
using MethodologyConfig = {
    name: str,
    difficulty: int,
    time_investment: int,
    prerequisites: [str]
}

using LearningMetrics = {
    retention_rate: float,
    comprehension_score: float,
    application_success: bool
}
```

**最佳实践**:
- 为领域特定概念创建语义化别名
- 简化复杂类型的使用
- 提高代码的领域表达力

---

### `macro` - 宏定义

**用途**: 定义编译时常量，用于配置和重复使用的值

**语法**:
```ldl
macro MACRO_NAME value
```

**示例**:
```ldl
// 学习配置宏
macro DEFAULT_LEARNING_DEPTH 5
macro MAX_ITERATION_COUNT 10
macro SPACED_REPETITION_INTERVALS [1, 3, 7, 14, 30]

// 调试和开发宏
macro DEBUG_MODE true
macro VERBOSE_LOGGING false
macro ENABLE_ANALYTICS true

// 方法论参数宏
macro POMODORO_DURATION 25  // 分钟
macro BREAK_DURATION 5      // 分钟
macro LONG_BREAK_DURATION 15 // 分钟

/// 使用宏的函数示例
fn pomodoro_technique(tasks: [str]) -> Steps {
    for task in tasks {
        focus_work(task, duration: POMODORO_DURATION)
        short_break(duration: BREAK_DURATION)
    }
    long_break(duration: LONG_BREAK_DURATION)
    return compile_productivity_report()
}
```

---

### `const` - 常量定义

**用途**: 定义运行时常量，存储不可变的配置值

**语法**:
```ldl
const CONSTANT_NAME = value
```

**示例**:
```ldl
// 学习效果基准
const MINIMUM_RETENTION_RATE = 0.8
const OPTIMAL_LEARNING_SPEED = 0.75
const MAX_COGNITIVE_LOAD = 7

// 方法论评级
const BEGINNER_DIFFICULTY = 1
const INTERMEDIATE_DIFFICULTY = 2
const ADVANCED_DIFFICULTY = 3
const EXPERT_DIFFICULTY = 4

// 时间管理常量
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const OPTIMAL_FOCUS_DURATION = 90  // 分钟

/// 使用常量的函数示例
fn evaluate_learning_effectiveness(retention: float, speed: float) -> str {
    if retention >= MINIMUM_RETENTION_RATE && speed >= OPTIMAL_LEARNING_SPEED {
        return "excellent"
    } else if retention >= MINIMUM_RETENTION_RATE {
        return "good"
    } else {
        return "needs_improvement"
    }
}
```

---

## 🔄 控制流关键字

### `let` - 变量声明

**用途**: 声明局部变量，支持类型推断和显式类型标注

**语法**:
```ldl
let variable_name = value
let variable_name: type = value
```

**示例**:
```ldl
fn organize_learning_session(topic: str, duration: int) -> Steps {
    // 类型推断
    let session_id = generate_unique_id()
    let start_time = current_timestamp()

    // 显式类型标注
    let learning_goals: [str] = extract_learning_objectives(topic)
    let time_allocation: {str: int} = calculate_time_distribution(duration)
    let progress_tracker: ProgressTracker = create_progress_tracker()

    // 复杂初始化
    let session_config = {
        topic: topic,
        duration: duration,
        goals: learning_goals,
        start_time: start_time
    }

    return setup_learning_environment(session_config)
}
```

---

### `return` - 返回语句

**用途**: 从函数中返回值，结束函数执行

**语法**:
```ldl
return expression
return  // 返回 void
```

**示例**:
```ldl
fn assess_comprehension_level(test_scores: [float]) -> str {
    let average_score = calculate_average(test_scores)
    let consistency = calculate_consistency(test_scores)

    if average_score >= 0.9 && consistency >= 0.8 {
        return "mastery"
    } else if average_score >= 0.7 {
        return "proficient"
    } else if average_score >= 0.5 {
        return "developing"
    } else {
        return "beginning"
    }
}

fn log_learning_event(event: str) {
    write_to_log(event, timestamp: current_time())
    update_analytics(event)
    return  // void 返回
}
```

---

### `if` / `else` - 条件控制

**用途**: 基于条件执行不同的代码路径

**语法**:
```ldl
if condition {
    // 条件为真时执行
} else if another_condition {
    // 另一个条件为真时执行
} else {
    // 所有条件都为假时执行
}
```

**示例**:
```ldl
fn select_learning_strategy(learner_profile: LearnerProfile) -> str {
    let learning_style = learner_profile.preferred_style
    let experience_level = learner_profile.experience
    let time_available = learner_profile.time_budget

    if learning_style == "visual" && experience_level == "beginner" {
        return "visual_scaffolding_strategy"
    } else if learning_style == "kinesthetic" {
        return "hands_on_practice_strategy"
    } else if time_available < 30 {
        return "micro_learning_strategy"
    } else if experience_level == "advanced" {
        return "self_directed_exploration"
    } else {
        return "balanced_multimodal_strategy"
    }
}
```

---

### `for` / `while` - 循环控制

**用途**: 重复执行代码块

**语法**:
```ldl
for item in collection {
    // 遍历集合
}

for i in range(start, end) {
    // 数值范围遍历
}

while condition {
    // 条件循环
}
```

**示例**:
```ldl
fn implement_spaced_repetition(learning_items: [str], intervals: [int]) -> Steps {
    let review_schedule = {}

    // 为每个学习项目设置复习计划
    for item in learning_items {
        review_schedule[item] = []
        for interval in intervals {
            let review_date = add_days(current_date(), interval)
            review_schedule[item].append(review_date)
        }
    }

    // 执行复习循环
    let current_day = 1
    while current_day <= MAX_LEARNING_DAYS {
        let today_reviews = get_reviews_for_date(review_schedule, current_day)

        if today_reviews.length > 0 {
            conduct_review_session(today_reviews)
            update_retention_scores(today_reviews)
        }

        current_day = current_day + 1
    }

    return generate_learning_report(review_schedule)
}
```

---

### `break` / `continue` - 循环控制

**用途**: 控制循环的执行流程

**示例**:
```ldl
fn adaptive_learning_session(concepts: [str], mastery_threshold: float) -> Steps {
    for concept in concepts {
        let understanding_level = 0.0
        let attempts = 0

        while attempts < MAX_ATTEMPTS {
            practice_concept(concept)
            understanding_level = assess_understanding(concept)
            attempts = attempts + 1

            if understanding_level >= mastery_threshold {
                log_mastery_achieved(concept)
                break  // 达到掌握标准，退出内层循环
            }

            if understanding_level < 0.3 && attempts > 3 {
                recommend_prerequisite_review(concept)
                continue  // 跳过本次迭代，继续下一次尝试
            }
        }

        if understanding_level < mastery_threshold {
            schedule_additional_practice(concept)
        }
    }

    return compile_session_summary()
}
```

---

### `match` - 模式匹配

**用途**: 基于值的模式进行分支选择

**语法**:
```ldl
match expression {
    pattern1 => action1,
    pattern2 => action2,
    _ => default_action
}
```

**示例**:
```ldl
fn select_reading_technique(text_type: str, difficulty: int) -> str {
    match text_type {
        "academic_paper" => match difficulty {
            1 => "skim_and_scan",
            2 => "SQ3R_basic",
            3 => "SQ3R_academic",
            _ => "expert_analysis"
        },
        "technical_manual" => "step_by_step_reading",
        "literature" => "close_reading",
        "news_article" => "speed_reading",
        _ => "general_reading"
    }
}
```

---

## 🎯 修饰关键字

### `static` - 静态方法

**用途**: 声明类的静态方法，无需实例即可调用

**示例**:
```ldl
class LearningAnalytics {
    static fn calculate_learning_velocity(sessions: [Session]) -> float {
        let total_concepts = count_unique_concepts(sessions)
        let total_time = sum_session_durations(sessions)
        return total_concepts / total_time
    }

    static fn generate_difficulty_curve(topic: str) -> [float] {
        let subtopics = decompose_topic(topic)
        return map(subtopics, estimate_difficulty)
    }
}
```

---

### `self` / `super` - 对象引用

**用途**: 在类方法中引用当前实例或父类

**示例**:
```ldl
class AdvancedLearningMethod extends LearningMethod {
    fn execute_with_adaptation(self, content: str) -> Steps {
        // 调用父类方法
        let basic_steps = super.execute(content)

        // 添加适应性增强
        let learner_state = self.assess_learner_state()
        let adapted_steps = self.adapt_to_learner(basic_steps, learner_state)

        return adapted_steps
    }
}
```

---

## 🔧 特殊关键字

### `init` - 构造函数

**用途**: 类的初始化方法

**示例**:
```ldl
class PersonalizedLearningPlan {
    fn init(self, learner_id: str, goals: [str]) {
        self.learner_id = learner_id
        self.goals = goals
        self.created_at = current_timestamp()
        self.progress = initialize_progress_tracker()
    }
}
```

---

## 📚 常量关键字

### `true` / `false` - 布尔值

**用途**: 布尔类型的字面值

### `null` / `undefined` - 空值

**用途**: 表示空值或未定义状态

**示例**:
```ldl
fn validate_learning_session(session: Session) -> bool {
    if session == null {
        return false
    }

    let is_valid = session.duration > 0 &&
                   session.participant != undefined &&
                   session.completed == true

    return is_valid
}
```

---

## 🎯 最佳实践

### 1. 关键字使用规范
- **一致性**: 在整个项目中保持关键字使用的一致性
- **语义化**: 选择最能表达意图的关键字结构
- **简洁性**: 避免过度嵌套的控制结构

### 2. 命名约定
- **函数名**: 使用动词开头的驼峰命名 (`calculateAverage`)
- **类名**: 使用名词的帕斯卡命名 (`LearningMethod`)
- **常量名**: 使用全大写下划线命名 (`MAX_ATTEMPTS`)
- **变量名**: 使用驼峰命名 (`learningGoals`)

### 3. 代码组织
- **逻辑分组**: 使用空行和注释分组相关的代码
- **早期返回**: 优先使用早期返回减少嵌套
- **函数职责**: 保持函数功能单一和明确

---

## 📖 相关文档

- [LDL 变量类型参考](./LDL变量类型参考.md)
- [LDL 使用文档](./使用文档.md)
- [LDL 最佳实践指南](./最佳实践指南.md)

---

*最后更新: 2024年9月*