# 当前平台配置与验收（2026-11-16）

本轮改动在 H:/ADTO/test/Trend 本地，尚未提交或推送到GitHub。现有index.html和pilot.json保留master历史17条快照；configuration页面为当前本机配置检查；public-acceptance.json为本轮真实公开路径试采。不能混称同一次运行。

## 新增授权账号适配器

进入仓库 Settings → Secrets and variables → Actions，按类型填写。不要将值发到聊天。本文只列名称，不包含凭据。

| 平台 | Secrets | Variables | 授权范围 |
|---|---|---|---|
| Instagram | INSTAGRAM_ACCESS_TOKEN | INSTAGRAM_USER_ID、META_API_VERSION | Instagram Login专业账号、instagram_business_basic；不是Facebook Login令牌 |
| Facebook | FACEBOOK_PAGE_ACCESS_TOKEN | FACEBOOK_PAGE_ID、META_API_VERSION | 指定主页、具备读取该主页内容权限的Page令牌；第三方公共内容需另核批准 |
| TikTok | TIKTOK_ACCESS_TOKEN | 无 | Login Kit/Display产品批准及video.list用户授权 |
| LinkedIn | LINKEDIN_ACCESS_TOKEN | LINKEDIN_ORGANIZATION_ID、LINKEDIN_API_VERSION | 获批组织读取权限及所需主页角色 |

META_API_VERSION填写应用当前支持的v主版本.次版本；LinkedIn版本填写当前支持的YYYYMM，不自动猜测或回退。账号/主页/组织ID填写对应数字ID。不会通过HTML收集或保存凭据。

这四个平台目前每次最多取10条，不自动翻页；TikTok作者未取得保留为空，Facebook和LinkedIn互动暂未实现。缺少标题或安全原帖直链的记录不展示。正文标签只标记为原文中的话题字符串，不作趋势榜。BGM未取得。

YouTube、Reddit、X仍按AUTHORIZATION.md及X-FORUM-UPDATE.md配置。当前本机未注入Secrets，无法据此判断GitHub是否已保存。PR事件不注入Secrets，真实接口验收须在代码进入GitHub后用workflow_dispatch。

## 双路径覆盖

用户已选择同时监测行业公开内容和授权账号，两者必须分别展示。新增四个平台本轮仅实现授权账号样本；行业公开话题/任意第三方账号路径尚未接通，不能声称实现全网搜索。还需目标账号/主页、话题清单，以及平台实际允许的产品访问范围。授权、创建应用、提交审核由账号持有人完成；未购买付费服务。

## 公开来源实测

- Houzz：HTTP访问受限，0条；不绕过限制。
- Screwfix：证书链失败，0条；未关闭TLS。
- The Construction Index：RSS取得10条候选，来源提供的作者/首发保留；这是行业资讯，不是社媒热榜。
- ArchDaily：请求失败；Pinterest与Behance：本机网络超时，均0条。
- DIYnot、ContractorTalk、SkyscraperCity：保留原master的历史验证结果，本轮未重新采集。

公开结构化采集器只接受同站HTTPS链接、RSS条目或JSON-LD文章/讨论类型。无法解析时显示缺口，不用任意链接填充。扩展来源结果单独存储，不覆盖原17条快照。Actions已增加公开验收脚本和产物输出。

## 验证与剩余事项

47项本地测试通过，新增覆盖缺配置零调用、令牌脱敏、平台响应错误、安全链接、组织过滤、时间、零值及结构化来源；账号API尚无真实凭据验收。没有启用日报/周报或公网发布。令牌续期、多账号批量读取、第三方公开话题、BGM和完整中文创作建议仍未完成。

官方文档：
- Instagram：https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login
- Facebook：https://developers.facebook.com/documentation/pages-api/posts
- TikTok：https://developers.tiktok.com/docs/en/tiktok-api-v2-video-list
- LinkedIn：https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
