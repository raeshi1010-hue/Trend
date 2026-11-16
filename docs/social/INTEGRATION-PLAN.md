# 全平台接入执行清单

更新：2026-11-16。范围为本 Trend 仓库，不操作其他聊天或其任务。

## 完成标准

登记来源、实现适配器、配置凭据、真实调用验收、满足监测范围是不同阶段。只有真实返回符合范围的数据才标记接通。指定授权账号的内容不能冒充行业全网趋势。

| 来源 | 代码现状 | 下一项工作 | 外部依赖 |
|---|---|---|---|
| YouTube | 已实现 | master 手动运行并核查返回和错误 | GitHub Secret YOUTUBE_API_KEY，启用 Data API v3 |
| Reddit | 已实现 | 核验用途批准、有效令牌及真实样本 | REDDIT_ACCESS_TOKEN、REDDIT_USER_AGENT；REDDIT_API_APPROVED=true |
| X | 已实现 | 确认搜索访问资格及费用后真实验收 | X_BEARER_TOKEN；X_API_ENABLED=true |
| Instagram | 待实现 | 根据第三方话题发现或授权专业账号选择产品，再实现读取 | 目标账号/话题、Meta应用及所选产品权限 |
| Facebook | 待实现 | 确定公共主页清单和可读取范围，再实现读取 | Page权限或获批公共内容访问；普通登录不等于访问全站 |
| TikTok | 待实现 | 区分行业发现和授权账号视频读取 | Display需Login Kit及API产品批准、video.list和用户授权；研究接口资格另核 |
| LinkedIn | 待实现 | 确定组织主页，核对Community Management权限后实现 | 产品批准和组织读取权限；不是全网关键词搜索 |
| DIYnot | 已有公开采样 | 保留首发与列表证据，持续检验解析 | 公开可达性、规则和频率 |
| ContractorTalk | 已有公开采样 | 继续定位详情首帖，核对列表证据 | 公开可达性、规则和频率 |
| SkyscraperCity | 已有公开采样 | 继续定位详情首帖，核对列表证据 | 公开可达性、规则和频率 |
| Houzz | 仅发现入口 | 验证讨论详情、原帖和字段，再实现解析 | 公开可达性和规则 |
| Screwfix Community | 仅发现入口 | 复查有效RSS、TLS和帖子字段 | 有效证书链；不关闭TLS验证 |

## 执行顺序

1. 验收已实现的三个官方接口，同时确定其余四个平台的监测对象和接入产品。
2. 完善无需账号的Houzz和Screwfix公开路径，访问失败如实记录。
3. 按确定产品实现其余官方适配器、无凭据零请求、字段映射与错误脱敏验证，再逐个平台真实验收。
4. 在可用来源基础上补充多地区查询、连续观测、中文解读和创作建议；BGM仅展示可追溯证据。
5. 来源与输出验收通过后，再实施日报09:00、周五周报16:00及发布。当前不启用。

密钥只保存于GitHub Secrets；账号持有人完成登录、平台申请和授权。不在聊天、代码或日志接收密钥，不自动购买付费接口。

## 官方参考

- Meta Page：https://developers.facebook.com/docs/graph-api/reference/page/
- Instagram：https://developers.facebook.com/docs/instagram/platform/instagram-api/
- TikTok Display：https://developers.tiktok.com/docs/en/display-api-overview
- TikTok Get Started：https://developers.tiktok.com/docs/en/display-api-get-started
- LinkedIn Posts：https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api

## 用户确认的监测范围（2026-11-16）

Instagram、Facebook、TikTok、LinkedIn同时推进两条路径：行业公开话题/第三方账号，以及自有/已授权账号。看板分别展示覆盖范围，不能把授权账号样本称为全网趋势。

每条来源记录接入路径、监测对象、可读取字段、观察窗口、最近成功时间和缺口；分别标记未实现、待授权、待真实验收、已验证可用。地区与受众归属依据单独展示。

扩展候选（尚未接通）：Pinterest（家装设计与材料灵感）、ArchDaily（建筑项目与材料应用）、Behance（建筑室内作品）、The Construction Index（工程与行业资讯）。这些来源的媒体/作品/搜索兴趣属性应单列，不混算社媒互动热度。接入前逐一核对公开读取方式、条款、字段及地区覆盖。
