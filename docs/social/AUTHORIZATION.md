# YouTube / Reddit 接口与授权

本模块位于本仓库scripts/social-adapters.mjs，不依赖其他聊天。无配置时不调用官方接口，仍生成来源状态看板。PR工作流只跑无密钥试采；仅workflow_dispatch手动运行会注入Secrets，避免向PR代码提供令牌。

## YouTube

1. 在Google Cloud选择项目，启用YouTube Data API v3，创建API key。
2. 在本仓库Settings → Secrets and variables → Actions → Secrets新增 `YOUTUBE_API_KEY`，限制该密钥仅可调用YouTube Data API v3。GitHub共享runner的出口可能变化，不要配置与实际runner不符的IP限制。
3. 当前只读取公开搜索及视频详情，无需频道登录或YouTube账号OAuth权限。
4. 合并工作流到默认分支后，在Actions手动运行Social source pilot。当前试采固定单次关键词construction materials Saudi Arabia，最近7天、最多10条，调用一次search.list和一次videos.list；是关键词样本，不是全市场监测或热榜。

返回标题、频道名、发布时间、标签、播放/点赞/评论（接口提供时）。没有返回的指标不填0。未验证买家所在地，不根据关键词认定沙特市场。接口不提供本模块所需BGM热榜及商用音频授权。

## Reddit

先确认Reddit批准此应用及商业监测用途，普通账号登录或创建应用不等同于批准。已批准后取得OAuth bearer access token；读取社区新帖需要 `read` 范围，不请求发帖、私信、修改或身份资料权限。

在本仓库Actions配置：

| 类型 | 名称 | 值 |
|---|---|---|
| Secret | REDDIT_ACCESS_TOKEN | 已批准应用的有效OAuth访问令牌 |
| Secret | REDDIT_USER_AGENT | 真实描述应用与开发者的User-Agent，例如linux:trend-monitor:0.1 (by /u/你的账号) |
| Variable | REDDIT_API_APPROVED | 仅确认当前监测用途已经获批后设置true |

当前实现读取r/Construction最新10条，返回作者、首发时间、score、评论数、upvote_ratio。score是净分，不是点赞总数；没有帖子浏览量或BGM数据。没有市场证据时单列市场未确认。

令牌会过期，本阶段不实现刷新令牌存储和续期；401时需更新有效access token，403时检查审批/权限。长期运行之前需依据获批应用的OAuth方式另行实现续期。不要把密码、token或API key发到聊天、代码、Issue或PR中。

## 论坛单帖

DIYnot逐帖读取DiscussionForumPosting JSON-LD的author/datePublished/interactionStatistic；缺少结构化数据时只回退首帖article的data-author与time。论坛会员累计Messages或Reaction score绝不当作帖子互动。无帖子级互动数据时为空；保留RSS日期另存rssDate，不冒充首发。每条保存单帖采集时间和字段验证状态。

测试覆盖无配置不访问API、错误不泄露密钥、搜索与详情组合、Reddit bearer请求、会员指标隔离与首发/RSS日期区分。凭据尚未配置时只能称接口已实现和模拟响应测试通过，不能声称官方API实测成功。

## 官方依据

- [YouTube授权说明](https://developers.google.com/youtube/data/guides/authentication)：公开搜索和元数据使用API key。
- [YouTube search.list](https://developers.google.com/youtube/data/reference/rest/v3/search/list) / [videos.list](https://developers.google.com/youtube/data/reference/rest/v3/videos/list)
- [Reddit API文档](https://www.reddit.com/dev/api/)
- [Reddit Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)
- [Reddit Data API条款](https://redditinc.com/policies/data-api-terms)：按批准范围访问，商业用途需确认相应许可。
