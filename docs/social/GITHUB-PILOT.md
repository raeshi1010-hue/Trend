# GitHub运行环境复测结果

2026-11-16 北京时间10:22完成第二轮试采。

[GitHub Actions运行记录](https://github.com/raeshi1010-hue/Trend/actions/runs/43791737849) · [看板和JSON下载包](https://github.com/raeshi1010-hue/Trend/actions/runs/43791737849/artifacts/14192162684)

工作流语法检查、试采、12来源结构验证及artifact上传通过；通过仅代表任务执行成功，不代表全平台采集完成。运行包保留14天，仓库pilot.json与index.html保存本轮快照。

| 来源 | 本轮结果 |
|---|---|
| DIYnot Building | HTTP200，10条建筑讨论候选；保留英文标题、讨论直链、RSS日期。尚无互动指标，市场与首发时间须单帖验证 |
| Instagram、YouTube、TikTok、Houzz | HTTP200，页面可达，当前适配器未提取原帖；不能据此声称必须登录 |
| ContractorTalk、SkyscraperCity | HTTP200，论坛主页可达，尚未实现帖子适配器 |
| Facebook | 当前匿名搜索路径HTTP404；不等于全平台不可用 |
| X、Reddit、LinkedIn | 当前公开路径HTTP403；需评估官方授权路径 |
| Screwfix Community | TLS证书链校验失败；没有关闭证书验证 |

## 已修复的试采问题

第一轮DIYnot URL带错误分区编号，虽然HTTP200却返回Software分区。现改为按building路径请求，加入RSS分区标题校验；软件帖子不计入最终建筑候选。避免根据页面含login等通用脚本字样就误判访问受限，现仅依据特定页面标题与登录重定向作初步分类。

## 实际候选的主题范围

保温材料污染、冬季檐口施工、车库墙体防水、窗台/外墙重贴、沉降裂缝、木材与人造覆层成本等。它们是讨论线索，不是经过热度排名的热门榜单。RSS日期可能表示论坛最近活动时间，不能直接当作首发日期；进入日报前需验证原帖。

## 下一步

先实现DIYnot单帖核验（首发、作者、可见回复/浏览指标）以及可达论坛的帖子适配器，再接入YouTube Data API和Reddit官方授权路径。GitHub Secrets目前无需填写；接口实现与权限范围明确后再设置，不将密钥发送到聊天或写入仓库。Instagram/TikTok的音频字段、地区热度、商业授权仍未验证。暂不购买数据服务，暂不启用日报周报定时或在线发布。

下载artifact解压后打开docs/social/index.html。工作流只读仓库，不自动提交数据或合并PR。PR更新会自动试采；合并到默认分支后可在Actions手动运行Social source pilot。
