> 当前本地开发状态与新增平台配置见 [CURRENT-SETUP.md](CURRENT-SETUP.md)。下文保留原master阶段说明，其中“适配器未实现”等内容属于此前状态。

# 全平台集中配置指引

维护入口：config/social-platforms.json。运行 `node scripts/social-config.mjs` 生成configuration.html和configuration.json；只输出配置项是否存在，不输出凭据值，不测试令牌有效性。PR不注入Secrets，所以PR报告不能用来判断仓库Secrets是否存在。

## 现在可以配置

YouTube、Reddit和X适配器已实现，完整步骤见[AUTHORIZATION.md](AUTHORIZATION.md)。在GitHub仓库Settings → Secrets and variables → Actions中配置：

| 平台 | Actions Secrets | Actions Variables | 前提 |
|---|---|---|---|
| YouTube | YOUTUBE_API_KEY | 无 | Google Cloud启用YouTube Data API v3，API key限制到该API |
| Reddit | REDDIT_ACCESS_TOKEN、REDDIT_USER_AGENT | REDDIT_API_APPROVED=true | 本用途获批及read范围的有效OAuth令牌；令牌续期/删除同步仍待长期运行前实现 |

配置后手动运行Social source pilot；只有手动事件注入Secrets。配置检查显示“配置项齐备”仍需真实API请求成功才可称已接通。GitHub连接不自动授予任何社媒访问权。

## 可以同步准备，但暂不填写凭据

| 平台 | 应先准备 | 接入限制 |
|---|---|---|
| Instagram | 监测的专业账号/话题清单、Meta开发者应用和适合的Instagram产品 | 不同登录产品权限不同，个人账号/任意全网内容不可默认读取；适配器未实现 |
| Facebook | 公共主页清单、对应管理员及Meta应用审核范围 | 公共主页读取不等于全站帖子搜索，也不包括私密群组；适配器未实现 |
| X | 开发者项目、Recent Search访问资格与额度/费用确认 | 现已实现适配器；Secret X_BEARER_TOKEN与Variable X_API_ENABLED=true均齐备才调用，见X-FORUM-UPDATE.md |
| TikTok | 先区分指定授权账号与地区趋势监测 | Display API为授权用户视频，不是全网搜索；Research需另核资格。适配器未实现 |
| LinkedIn | 目标公司主页、管理员、Community Management产品申请 | 组织/主页分析不等于全站关键词监听；适配器未实现 |

不要求发布、私信、广告管理等与当前只读监测无关的权限。账号登录、产品申请/审核、接受平台协议和费用开通需账号持有人完成；这里不创建账号、不签协议、不购买。

## 无需账号的公开路径

DIYnot已有Building RSS和首帖/主题列表字段实测。Houzz、ContractorTalk、SkyscraperCity仍只是可达的发现入口，需实现帖子级解析并核对规则。Screwfix仍有证书链问题，不关闭TLS验证。论坛无数据并不意味着应提供账号密码。

## 验收口径

12个平台/论坛全部登记，不意味着12个采集器已实现。configuration页面反映实现与配置状态，index页面反映上次真实试采。任何配置项存在都不能证明权限有效、额度足够、字段齐全或全市场覆盖。BGM音频标识、热度、市场和商用授权分别验收。每日09:00和周五16:00目标保留，本阶段没有启用定时。

配置状态页为运行时生成的静态文件，不是OAuth授权门户，不能在HTML里输入密钥，也不能在浏览器中自动保存凭据。
