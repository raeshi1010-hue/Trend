# X、论坛采集与看板筛选

X适配器现已实现：官方Recent Search读取最多10条construction/waterproofing/cladding关键词样本，带作者、首发、帖子级public_metrics及原帖标签；不请求作者累计互动，不推断国家或BGM。不翻页、不购买额度。

## X配置

在仓库Actions设置Secret `X_BEARER_TOKEN`；确认开发者应用具备搜索访问权限且接受实际调用额度/费用后，设置Variable `X_API_ENABLED=true`。两个条件齐备才发请求，默认不开启。只在手动workflow_dispatch注入，PR不接收凭据。凭据存在不代表实际接口已通过。

[官方Search Recent Posts文档](https://docs.x.com/x-api/posts/search-recent-posts)。本阶段不实现令牌创建、平台账户授权、付费购买、写入、私信或发帖。API失败不输出令牌、请求URL或上游错误正文；仅返回HTTP状态或错误类型。未配置时可以继续其他来源采集。

## 论坛扩展

ContractorTalk、SkyscraperCity从可读论坛主页发现最多4条同站主题直链，去重，顺序尝试DiscussionForumPosting/首帖元数据。只接受同源HTTPS线程路径，不跟随详情重定向。首页候选不是全站热门排行，也不保证来自目标国家；无法取得字段保留为空，不把抓取时间当发布时间。原有DIYnot首帖与回复/浏览采集保留。

## 看板

新增市场与六类产业链筛选，行业为原文标题关键词初筛，不是客户角色事实认定。现有数据市场未确认，所以选择欧洲、北美或中东可以是空结果；不会将英文自动归入欧美。搜索平台与两类筛选组合生效，显示候选计数，保留原文和原帖链接。

## 验证

14项本地测试通过，覆盖X未启用/未授权零请求、作者展开、市场/BGM不推断、论坛同源链接与重复过滤。GitHub真实试采结果从Actions的运行摘要和artifact读取。无X凭据时不能称官方接口实测通过；浏览器视觉验证尚未完成。日周报调度尚未开启。
