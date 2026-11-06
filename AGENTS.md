# Agent Instructions

All commits must follow the Conventional Commits format enforced by `@commitlint/config-conventional`.

Examples:

- `fix: stabilize settings sheet presentation`
- `refactor: introduce media adapter harness`
- `test: add query key contract coverage`
- `docs: document test harness architecture`

Before committing behavior changes, run the relevant local regression commands and mention any command that could not be run.

## Repository cleanliness

Do not add new files under `docs/` unless explicitly requested. Keep device-specific or simulator-specific reports, ad hoc inspection reports, diagnostic logs, validation screenshots, recordings, sampling data, and temporary investigation notes outside the repository, such as in a task-specific directory under `/tmp`. Retain only maintained project documentation and intentional product or README assets in the repository. Update existing documentation for durable usage and release instructions, and put verification details in the pull request description.

When cleaning repository artifacts, also remove superseded design proposals, generated concept images, and their prompts. Check application imports, platform-specific resolution, native resource names, and README references before deleting assets or source files; retain source artwork used to maintain shipped assets.

## UI components

Prefer each platform's native components and interactions throughout this project. Use iOS and Android system controls through the appropriate React Native or Expo APIs instead of recreating their appearance with custom views. In particular, use native alerts, menus, pickers, and sheets when they meet the requirement. Only use custom components when native capabilities cannot provide the required behavior or the user explicitly requests a custom design.

## 上游同步：优先使用 Merge

本仓库是基于上游 Nekofin 的 iOS 15.1+ 维护分支。远程仓库约定：

- iOS 15.1 兼容层、SDK 55 适配和本地 IPA 构建流程属于本分支维护内容，不能为了追上游而直接丢弃。

长期维护时，默认用 **Merge 同步上游，不要对已形成并验证的 iOS 迁移提交反复 Rebase**。Merge 可以保留上游和本分支的提交 SHA 与分叉历史，避免重写已经验证或推送过的迁移提交。只有用户明确要求 Rebase，或确认分支尚未共享且确实需要线性历史时，才考虑 Rebase。

执行前：
1. 检查 git status、未提交修改、未跟踪文件、当前分支、最近提交和两个 remote 的地址。保护所有现有工作；不得擅自 reset、clean、stash、覆盖或删除用户文件。若工作区修改会影响合并，先说明并停下来询问，不要替用户处理。
2. 执行 git fetch origin，更新上游引用；不要用 git pull 隐式合并。
3. 检查 merge-base、双方 ahead/behind、上游新增提交列表及其文件 diff。识别上游是否改动播放器、详情页、导航、设置、原生组件、依赖或构建配置，并评估对 iOS 15.1 兼容层的影响。
4. 先给出同步范围、风险和可能冲突文件的简要计划。若上游历史异常、目标分支不明确或出现意料之外的历史重写，暂停并询问。

合并要求：
1. 在确认目标为当前维护分支后，使用 git merge --no-ff origin/main 保留上游合并节点；不要 rebase，不要 cherry-pick 整批上游提交来代替正常合并。
2. 逐个处理冲突。必须比较 merge-base、当前 iOS 分支和上游三个版本，理解双方意图后再编辑；禁止对整个文件或目录盲目使用 git checkout --ours/--theirs、git restore 或批量覆盖。
3. 优先保留 iOS 15.1 的运行兼容性，同时吸收上游仍然有效的功能、修复和测试。不得为了消除冲突而删除 iOS 兼容实现、平台分支、补丁、原生模块或必要的 SDK 55 适配。若上游已提供等价实现，应先验证行为和最低系统版本，再谨慎去重。
4. 特别检查 Expo Router / React Navigation API、iOS 原生导航与标题、原生 Sheet / Settings、播放器退出与控制、详情页和剧集选择、Android 平台文件解析，以及 package.json、bun.lock、Expo 插件和 CocoaPods / patch-package 补丁。
5. 保留用户未提交的 README、构建脚本、打包器和 docs 工作；除非用户明确要求，不要把这些内容混入合并提交，也不要提交 docs 下的阶段记录或临时报告。
6. 解决冲突后检查 git diff --check、冲突标记、变更清单和最终 diff，确认没有意外删除、回退或本机绝对路径泄露。

验证要求：
1. 运行 bun run typecheck 和 bun run test；若项目提供其他与变更相关的测试，也应运行。
2. 运行 bash build-ios15.sh 做完整 Clean Release 构建并重新生成 TrollStore IPA；检查 Archive 成功、最低 iOS 版本、arm64、Bundle ID、JS Bundle、ZIP 完整性、codesign 验证、dSYM UUID 和 SHA-256 Manifest。
3. 扫描最终 IPA，确认不包含当前开发机器的项目根目录或用户主目录绝对路径。若发现泄露，先定位来源并修复构建/打包流程，再重新 Clean Build、签名和验证；不得只凭编译成功就宣称验收通过。
4. 汇总合并提交、冲突处理、测试结果、IPA 路径与 SHA-256，以及仍未解决的问题。区分构建验证和真实设备安装/运行验证。

收尾要求：
1. 未经用户明确要求，不要 push、force-push、删除分支、改写远程历史或创建发布/tag。
2. 用户未明确要求提交时，不要擅自 commit；若用户要求提交，遵循 Conventional Commits，并保留原提交作者信息，不伪造身份。
3. 若合并或验证无法安全完成，保留现场，说明具体阻塞点和恢复方式，不要通过丢弃改动来强行完成。
