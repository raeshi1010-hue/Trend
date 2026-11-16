# 新增论坛的指标与项目地点证据

本阶段只增强ContractorTalk和SkyscraperCity，不将项目所在地等同于作者、买家或受众市场。

## 指标

递归读取JSON-LD中的DiscussionForumPosting，必须与当前线程路径一致才采用commentCount和interactionStatistic。主题列表指标按线程ID匹配。若详情页没有指标，只跟随同站、结构化面包屑给出的具体论坛分区，复用该分区响应尝试补齐Replies/Views。缓存同一分区，避免逐帖重复请求。没有可核验值就保持空，不使用作者累计Messages或Reaction score，不使用推荐帖计数。

## 项目所在地

初始词表Manchester、Dubai、Riyadh、London、Paris、Berlin仅用于识别项目地点线索，不是完整地名识别系统。标题命中记录为“仅标题提及，待核验”；仅当来源JSON-LD面包屑支持对应城市/国家时标记“原帖标题与来源分区支持”。保存原帖URL、标题及分区文字，仍不是独立第三方核验。所有记录的买家/受众市场继续为未确认。

原帖标题保持原语言；中文看板在帖子卡中展示项目线索和证据级别。市场筛选仍针对已核验的市场字段，不将项目地名自动写入市场。

27项测试覆盖指标线程匹配、作者累计数隔离、结构化与DOM面包屑、分区链接同站限制、项目与受众市场分离及既有采集、授权、重试逻辑。真实覆盖以最新GitHub Actions及pilot.json为准，测试通过不能代替实测数据完整性。没有新增付费服务、凭据或定时任务。

## 2026-11-16 实测结果

[GitHub运行43798587169](https://github.com/raeshi1010-hue/Trend/actions/runs/43798587169)通过27项测试、试采、输出校验和artifact上传。本轮仍为14条候选，DIYnot10条保留互动；新增论坛4条的互动未补齐，缺失不填0。

- Dubai项目帖：标题与“United Arab Emirates / Dubai Projects / Dubai Waterfront and Palm Jebel Ali”分区导航一致，项目地点标为“原帖标题与来源分区支持”。作者、首发仍缺失，不能作为已核实近期热点；买家和受众市场未确认。
- Manchester项目帖：仅标题提供城市线索，论坛分区为Proposed Highrises，没有国家证据，保持待核验。
- ContractorTalk工具分区、SkyscraperCity的Proposed Highrises及Dubai分区请求两次均超时；Tirana分区读取成功，但未取得可匹配的帖子互动值。按线程匹配的机制已实现，不能宣称实际互动已补齐。

本期快照已同步index.html、pilot.json和配置页。下一步应在成功读取的论坛分区内核对主题列表实际结构，先验证可提取字段再扩大来源；不通过反复增加重试次数填补数据缺口。
