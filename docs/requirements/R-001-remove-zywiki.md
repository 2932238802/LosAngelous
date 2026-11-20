# R-001 · 下线 zywiki 整站

- 关联需求卡：`docs/requirements/CR-001-remove-zywiki.md`
- 版本：v1（G1 已确认）
- 状态：G3 通过（2026-11-20，P2-1 已关闭）

## 需求陈述

从 LosAngelous 门户站点中完全下线「大学实用就业指南」（`/zywiki/`）：删除整个 `zywiki/` 目录，并清理首页门户中该服务的卡片与 noscript 链接。

## 验收标准（AC）

- **AC-1 目录删除**：仓库中不存在 `zywiki/` 目录，包括 10 个页面、`assets/site.css`、`assets/site.js`、`search.json`、`sitemap.xml`、`favicon.svg`、`大学生实用就业指南.pdf`。
- **AC-2 服务清单清理**：`assets/app.js` 的 `SERVICES` 数组不再包含 `id: 'zywiki'` 的条目；数组长度为 5。
- **AC-3 首页静态内容清理**：`index.html` 的 `<noscript>` 列表不再包含 `/zywiki/` 链接；骨架文案「6 services」与占位卡片数同步改为 5。
- **AC-4 无残留引用**：`grep -rn "zywiki\|就业指南" --exclude-dir=.git .`（在文档目录以外）无命中。
- **AC-5 其余服务不受影响**：theseus / forus / losnote / vesta / lospool 五个服务的配置、卡片渲染、端口探测逻辑保持不变；页面可正常加载并显示「5 services」。
- **AC-6 可回滚**：改动集中在一个提交，git 历史可 revert。

## 任务拆分（T）

- **T-1**：删除 `zywiki/` 目录全部文件（16 个）。
- **T-2**：从 `assets/app.js` 移除 zywiki 服务对象。
- **T-3**：更新 `index.html`：删除 noscript 中 zywiki 条目；骨架文案与占位卡片数量 6 → 5。
- **T-4**：执行 AC-4 全仓扫描与 AC-5 页面自检，记录命令输出。

## 影响分析

| 文件/目录 | 变更 | 风险 |
| --- | --- | --- |
| `zywiki/**`（16 文件） | 删除 | 低；独立静态内容，无外部依赖 |
| `assets/app.js` L54–60 | 删除一个数组元素 | 低；`SERVICES.length` 自动驱动计数与渲染 |
| `index.html` L24、L36–46 | 文案/占位卡片数、删一条 `<li>` | 低；纯静态骨架 |
| `assets/app.css` | 不改（无 zywiki 专属样式） | — |
| 其他 5 个服务 | 不改 | — |

## 追溯矩阵

| 需求项 | AC | 任务 |
| --- | --- | --- |
| 整站下线 | AC-1、AC-4 | T-1、T-4 |
| 门户清理 | AC-2、AC-3 | T-2、T-3 |
| 不影响其余服务 | AC-5 | T-3、T-4 |
| 可回滚 | AC-6 | 提交策略 |

## 验证方式

1. `test ! -d zywiki`（AC-1）
2. `grep -c "id: '" assets/app.js` 应为 5；无 `zywiki`（AC-2）
3. `grep -n "zywiki\|就业指南" index.html assets/app.js` 无输出（AC-3/4）
4. 本地打开 `index.html` 或起静态服务器，确认 5 张卡片、无数 zywiki 卡片、状态条为 `x/5 online`；noscript 列表 5 条（AC-5）
