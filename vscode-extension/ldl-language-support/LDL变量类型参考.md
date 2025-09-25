# LDL 变量类型参考文档

## 📖 概述

LDL (Learning Domain Language) 类型系统为学习方法论的描述提供了强大而灵活的类型支持。本文档详细介绍 LDL 中的所有变量类型，包括基础类型、复合类型、领域特定类型和自定义类型。

## 🔤 基础数据类型

### `str` - 字符串类型

**用途**: 存储文本数据，是最常用的类型之一

**语法**:
```ldl
let text: str = "学习内容"
let method_name: str = 'SQ3R'
```

**特性**:
- 支持单引号和双引号
- 支持转义字符
- Unicode 支持

**示例**:
```ldl
/// 文本处理函数
fn process_learning_material(content: str, format: str) -> str {
    let processed_content: str = ""
    let metadata: str = "处理时间: " + current_timestamp()

    if format == "markdown" {
        processed_content = convert_to_markdown(content)
    } else if format == "html" {
        processed_content = convert_to_html(content)
    } else {
        processed_content = content
    }

    return processed_content + "\n\n" + metadata
}
```

**常用操作**:
- 字符串连接: `+`
- 长度获取: `text.length`
- 子串提取: `text.substring(start, end)`
- 包含检查: `text.contains("keyword")`

---

### `int` - 整数类型

**用途**: 存储整数值，用于计数、索引、时间等

**语法**:
```ldl
let count: int = 42
let duration: int = -15
```

**示例**:
```ldl
/// 学习时间管理
fn calculate_optimal_session_length(
    attention_span: int,
    complexity_level: int,
    experience_level: int
) -> int {
    let base_duration: int = 25  // 基础番茄钟时间

    // 根据注意力调整
    let attention_factor: int = attention_span / 10
    let adjusted_duration: int = base_duration + attention_factor

    // 根据复杂度调整
    if complexity_level > 3 {
        adjusted_duration = adjusted_duration + 10
    } else if complexity_level < 2 {
        adjusted_duration = adjusted_duration - 5
    }

    // 根据经验调整
    let experience_bonus: int = experience_level * 5
    adjusted_duration = adjusted_duration + experience_bonus

    return max(15, min(90, adjusted_duration))  // 限制在15-90分钟
}
```

**数值范围**:
- 最小值: `-2^31`
- 最大值: `2^31 - 1`

---

### `float` - 浮点数类型

**用途**: 存储小数值，用于精确计算和比率

**语法**:
```ldl
let ratio: float = 0.75
let score: float = 98.5
```

**示例**:
```ldl
/// 学习效果评估
fn calculate_learning_effectiveness(
    retention_rate: float,
    comprehension_score: float,
    application_success: float
) -> float {
    let weights: [float] = [0.4, 0.4, 0.2]  // 权重分配
    let scores: [float] = [retention_rate, comprehension_score, application_success]

    let weighted_sum: float = 0.0
    for i in range(0, weights.length) {
        weighted_sum = weighted_sum + (weights[i] * scores[i])
    }

    // 应用学习曲线调整
    let curve_factor: float = calculate_learning_curve_factor()
    let final_score: float = weighted_sum * curve_factor

    return round(final_score, 2)  // 保留两位小数
}
```

---

### `bool` - 布尔类型

**用途**: 存储真假值，用于条件判断和状态标记

**语法**:
```ldl
let is_completed: bool = true
let has_prerequisites: bool = false
```

**示例**:
```ldl
/// 学习前置条件检查
fn validate_learning_readiness(
    has_prerequisites: bool,
    sufficient_time: bool,
    proper_environment: bool,
    motivated: bool
) -> bool {
    let basic_requirements: bool = has_prerequisites && sufficient_time
    let environmental_readiness: bool = proper_environment && motivated

    let overall_readiness: bool = basic_requirements && environmental_readiness

    if !overall_readiness {
        log_readiness_issues(has_prerequisites, sufficient_time, proper_environment, motivated)
    }

    return overall_readiness
}
```

---

## 📊 复合数据类型

### `[type]` - 数组类型

**用途**: 存储同类型元素的有序集合

**语法**:
```ldl
let numbers: [int] = [1, 2, 3, 4, 5]
let methods: [str] = ["SQ3R", "Cornell Notes", "Feynman Technique"]
```

**示例**:
```ldl
/// 学习方法比较分析
fn analyze_learning_methods(methods: [str], effectiveness_scores: [float]) -> [str] {
    let analysis_results: [str] = []
    let method_count: int = methods.length

    for i in range(0, method_count) {
        let method: str = methods[i]
        let score: float = effectiveness_scores[i]
        let category: str = categorize_effectiveness(score)

        let analysis: str = method + " - 效果: " + category + " (" + score + ")"
        analysis_results.append(analysis)
    }

    // 排序结果
    let sorted_results: [str] = sort_by_effectiveness(analysis_results, effectiveness_scores)
    return sorted_results
}

/// 数组操作示例
fn process_learning_steps(steps: [str]) -> [str] {
    let processed_steps: [str] = []

    // 遍历处理
    for step in steps {
        let processed: str = validate_and_format_step(step)
        processed_steps.append(processed)
    }

    // 过滤有效步骤
    let valid_steps: [str] = filter(processed_steps, is_valid_step)

    // 去重
    let unique_steps: [str] = remove_duplicates(valid_steps)

    return unique_steps
}
```

**常用操作**:
- 长度: `array.length`
- 添加元素: `array.append(item)`
- 访问元素: `array[index]`
- 切片: `array[start:end]`

---

### `{key: value}` - 对象/字典类型

**用途**: 存储键值对，用于结构化数据

**语法**:
```ldl
let person: {str: str} = {
    "name": "张三",
    "role": "学习者"
}

let config: {str: int} = {
    "max_sessions": 5,
    "break_duration": 15
}
```

**示例**:
```ldl
/// 学习者档案管理
fn create_learner_profile(
    name: str,
    learning_style: str,
    experience_level: int,
    goals: [str]
) -> {str: any} {
    let profile: {str: any} = {
        "basic_info": {
            "name": name,
            "created_at": current_timestamp(),
            "last_updated": current_timestamp()
        },
        "learning_preferences": {
            "style": learning_style,
            "pace": "moderate",
            "difficulty_preference": "progressive"
        },
        "capabilities": {
            "experience_level": experience_level,
            "current_skills": [],
            "target_skills": goals
        },
        "progress_tracking": {
            "completed_sessions": 0,
            "total_study_time": 0,
            "achievement_badges": []
        }
    }

    return profile
}

/// 复杂配置管理
fn setup_learning_environment(config: {str: any}) -> {str: any} {
    let environment_config: {str: any} = {
        "session_settings": {
            "duration": config["session_duration"] || 25,
            "break_duration": config["break_duration"] || 5,
            "long_break_interval": config["long_break_interval"] || 4
        },
        "content_settings": {
            "difficulty_level": config["difficulty"] || "intermediate",
            "content_format": config["format"] || "mixed",
            "interactive_elements": config["interactive"] || true
        },
        "tracking_settings": {
            "detailed_analytics": config["analytics"] || false,
            "progress_notifications": config["notifications"] || true,
            "export_data": config["export"] || false
        }
    }

    return environment_config
}
```

---

## 🎓 领域特定类型

### `Steps` - 步骤类型

**用途**: LDL 的核心类型，表示一系列学习或方法论步骤

**特性**:
- 专门用于描述学习流程
- 支持步骤的组合和嵌套
- 内置执行和验证逻辑

**示例**:
```ldl
/// 系统化阅读步骤
fn systematic_reading_process(material: str, depth: int) -> Steps {
    let reading_steps: Steps = create_empty_steps()

    // 预览阶段
    reading_steps.add_phase("preview", [
        scan_title_and_headings(material),
        identify_key_sections(material),
        estimate_reading_time(material, depth)
    ])

    // 深度阅读阶段
    reading_steps.add_phase("deep_reading", [
        read_with_purpose(material, depth),
        take_strategic_notes(material),
        identify_key_concepts(material)
    ])

    // 整合阶段
    reading_steps.add_phase("integration", [
        summarize_main_points(material),
        connect_to_prior_knowledge(material),
        formulate_follow_up_questions(material)
    ])

    return reading_steps
}
```

---

### `Args` - 参数类型

**用途**: 表示函数或方法的参数集合

**示例**:
```ldl
/// 动态参数处理
fn execute_learning_method(method_name: str, args: Args) -> Steps {
    let validated_args: Args = validate_method_arguments(method_name, args)

    match method_name {
        "SQ3R" => return execute_sq3r(validated_args),
        "cornell_notes" => return execute_cornell_notes(validated_args),
        "mind_mapping" => return execute_mind_mapping(validated_args),
        _ => return execute_generic_method(method_name, validated_args)
    }
}
```

---

## 🔧 自定义复合类型

### 学习相关类型

```ldl
/// 学习会话类型
using LearningSession = {
    id: str,
    learner_id: str,
    method_used: str,
    start_time: str,
    duration: int,
    content_covered: [str],
    effectiveness_score: float,
    notes: str,
    completed: bool
}

/// 学习目标类型
using LearningGoal = {
    title: str,
    description: str,
    target_date: str,
    priority: int,
    prerequisites: [str],
    success_criteria: [str],
    progress_percentage: float
}

/// 学习资源类型
using LearningResource = {
    title: str,
    type: str,  // "book", "video", "article", "course"
    url: str,
    difficulty_level: int,
    estimated_time: int,
    tags: [str],
    quality_rating: float
}
```

### 方法论类型

```ldl
/// 方法论定义类型
using MethodologyDefinition = {
    name: str,
    category: str,
    description: str,
    steps: Steps,
    difficulty_level: int,
    time_requirement: int,
    prerequisites: [str],
    effectiveness_domains: [str]
}

/// 方法论评估类型
using MethodologyAssessment = {
    methodology_name: str,
    assessor_id: str,
    effectiveness_score: float,
    ease_of_use: float,
    applicability: float,
    time_efficiency: float,
    overall_rating: float,
    feedback: str,
    assessment_date: str
}
```

### 认知和心理类型

```ldl
/// 认知负荷类型
using CognitiveLoad = {
    intrinsic_load: float,      // 内在认知负荷
    extraneous_load: float,     // 外在认知负荷
    germane_load: float,        // 相关认知负荷
    total_load: float,
    optimal_threshold: float
}

/// 学习状态类型
using LearningState = {
    attention_level: float,
    motivation_level: float,
    energy_level: float,
    stress_level: float,
    confidence_level: float,
    flow_state: bool,
    timestamp: str
}

/// 记忆强度类型
using MemoryStrength = {
    concept_id: str,
    initial_strength: float,
    current_strength: float,
    decay_rate: float,
    last_review: str,
    review_count: int,
    mastery_level: str
}
```

---

## 🔄 类型转换和操作

### 类型转换函数

```ldl
/// 基础类型转换
fn convert_types_example() -> Steps {
    // 字符串转数字
    let score_str: str = "85.5"
    let score_float: float = parse_float(score_str)
    let score_int: int = int(score_float)

    // 数字转字符串
    let duration: int = 45
    let duration_str: str = to_string(duration)

    // 布尔转换
    let has_score: bool = score_float > 0.0
    let completion_status: str = bool_to_string(has_score)

    return create_conversion_report(score_float, score_int, has_score)
}
```

### 类型验证

```ldl
/// 类型安全检查
fn validate_learning_data(data: {str: any}) -> bool {
    // 检查必需字段
    let required_fields: [str] = ["learner_id", "session_type", "duration"]

    for field in required_fields {
        if !data.has_key(field) {
            log_validation_error("Missing required field: " + field)
            return false
        }
    }

    // 类型验证
    if typeof(data["learner_id"]) != "str" {
        log_validation_error("learner_id must be string")
        return false
    }

    if typeof(data["duration"]) != "int" || data["duration"] <= 0 {
        log_validation_error("duration must be positive integer")
        return false
    }

    return true
}
```

---

## 📋 类型使用最佳实践

### 1. 类型标注规范

```ldl
// ✅ 好的做法：明确的类型标注
fn calculate_retention_curve(
    initial_strength: float,
    time_elapsed: int,
    review_intervals: [int]
) -> [float] {
    let retention_values: [float] = []
    // 实现...
    return retention_values
}

// ❌ 避免：缺少类型信息
fn calculate_retention_curve(initial_strength, time_elapsed, review_intervals) {
    let retention_values = []
    // 实现...
    return retention_values
}
```

### 2. 复合类型设计

```ldl
// ✅ 好的做法：结构化的复合类型
using DetailedLearningReport = {
    session_summary: {
        total_sessions: int,
        total_time: int,
        average_effectiveness: float
    },
    progress_metrics: {
        concepts_mastered: int,
        skills_developed: [str],
        improvement_areas: [str]
    },
    recommendations: {
        next_steps: [str],
        resource_suggestions: [LearningResource],
        methodology_adjustments: [str]
    }
}

// ❌ 避免：扁平化的混乱结构
using BadLearningReport = {
    total_sessions: int,
    total_time: int,
    effectiveness: float,
    concepts: int,
    skills: [str],
    areas: [str],
    steps: [str],
    resources: [str],
    adjustments: [str]
}
```

### 3. 空值处理

```ldl
/// 安全的空值处理
fn safe_access_learner_data(learner_id: str) -> LearnerProfile {
    let profile: LearnerProfile = get_learner_profile(learner_id)

    if profile == null {
        log_warning("Profile not found for learner: " + learner_id)
        return create_default_profile(learner_id)
    }

    // 验证关键字段
    if profile.name == null || profile.name == "" {
        profile.name = "Unknown Learner"
    }

    if profile.learning_goals == null {
        profile.learning_goals = []
    }

    return profile
}
```

### 4. 类型组合使用

```ldl
/// 复杂类型组合示例
fn comprehensive_learning_analysis(
    sessions: [LearningSession],
    goals: [LearningGoal],
    resources: [LearningResource]
) -> {str: any} {
    let analysis: {str: any} = {}

    // 会话分析
    analysis["session_stats"] = analyze_sessions(sessions)

    // 目标进度分析
    analysis["goal_progress"] = analyze_goal_progress(goals, sessions)

    // 资源使用分析
    analysis["resource_utilization"] = analyze_resource_usage(resources, sessions)

    // 综合建议
    analysis["recommendations"] = generate_recommendations(
        analysis["session_stats"],
        analysis["goal_progress"],
        analysis["resource_utilization"]
    )

    return analysis
}
```

---

## 🎯 性能优化建议

### 1. 内存效率

```ldl
/// 内存友好的大数据处理
fn process_large_learning_dataset(data_source: str) -> Steps {
    // 使用流式处理而不是加载全部数据
    let processor = create_stream_processor(data_source)
    let results: [str] = []

    while processor.has_next() {
        let batch: [LearningSession] = processor.next_batch(100)  // 批量处理
        let processed_batch: [str] = process_session_batch(batch)
        results.extend(processed_batch)

        // 定期清理内存
        if results.length > 1000 {
            flush_to_storage(results)
            results.clear()
        }
    }

    return create_processing_summary(results)
}
```

### 2. 类型优化

```ldl
/// 选择合适的数据结构
fn optimize_lookup_performance(learning_data: [LearningSession]) -> {str: LearningSession} {
    // 使用哈希表而不是数组进行查找
    let session_lookup: {str: LearningSession} = {}

    for session in learning_data {
        session_lookup[session.id] = session
    }

    return session_lookup
}
```

---

## 📚 相关文档

- [LDL 关键字参考](./LDL关键字参考.md)
- [LDL 使用文档](./使用文档.md)
- [LDL 最佳实践指南](./最佳实践指南.md)

---

*最后更新: 2024年9月*