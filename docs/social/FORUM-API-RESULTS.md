# 论坛详情与官方API实现结果

2026-11-16，GitHub Actions运行43792688458通过8项测试、公开试采、输出结构校验及artifact上传。

[运行记录](https://github.com/raeshi1010-hue/Trend/actions/runs/43792688458)；最新看板与记录见本目录index.html、pilot.json。运行页Artifacts可下载离线网页。

## 论坛真实数据验证

DIYnot Building当前10条候选全部取得首帖作者、首发时间及主题列表回复数/浏览量。例如：

| 原帖主题 | 作者 | 首发UTC | 回复 | 浏览 |
|---|---|---|---|---|
| Earth banked up against garage wall - how to 'tank' the wall? | honestworker | 2026-11-12 15:44:08 | 7 | 216 |
| Subsidence cracks getting longer by the day | yjones | 2026-11-11 08:05:42 | 20 | 543 |
| Cladding costs. Timber v man made. | Tigercubrider | 2026-11-09 20:11:04 | 9 | 286 |

这些数值为本次观察的累计值，不是日增长，不是平台热门榜。市场仍未确认。首发从单帖提取，RSS日期另存，可与首发不同。互动来自主题列表的Replies/Views，不能与作者累计Messages/Reaction score混淆。只有结构化评论数据可得时才采用JSON-LD字段，缩写计数保留Display文本，不假装精确。

## 官方API状态

YouTube：已实现search.list → videos.list，返回视频、频道、首发、标签及可提供的播放/点赞/评论。单个固定关键词、最多10条、最近7天的试采范围。没有密钥时零请求，明确未配置。

Reddit：已实现OAuth只读社区new列表，返回作者、首发、score、num_comments和upvote_ratio。只有明确批准标记、有效token及真实User-Agent同时存在才请求。不再用匿名JSON路径重试403。score不等同于点赞总数。

两者目前都通过模拟响应测试，尚未通过真实凭据进行联网验收；不提供BGM热榜。令牌续期、多市场多关键词、删除同步和长期存储不在本阶段实现。Reddit投入长期运行前必须依据实际批准范围补充删除与保留机制，不能将用户内容永久写入Git历史；当前仓库快照只有论坛数据。

## 授权与下一步

完整操作见[AUTHORIZATION.md](AUTHORIZATION.md)。先将PR置为Ready并合并至默认分支，再配置YouTube Secret并手动运行Social source pilot；Reddit先确认应用及用途批准，再配置只读令牌、User-Agent与批准标记。PR事件不注入Secret，只有手动workflow_dispatch使用凭据。

本轮没有要求或使用账号密码，没有读取其他聊天，没有启用日周报定时，也没有在线发布。
