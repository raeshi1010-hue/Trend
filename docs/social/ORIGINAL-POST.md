# 首帖与回复识别修正

旧实现取页面第一个带data-author的article作为首帖，实际可读页面可能先提供回复，导致其作者/时间与论坛列表明确起始字段不一致。

新实现仅从线程头明确标注的Thread starter / Start date，或message-attribution归属栏中的#1帖子提取详情首帖。任意可见article数据仅作为visiblePostMetadata保存，不再自动升格为首帖。

详情未定位到首帖时，允许使用同一线程行中明确标注的thread-item-username和structItem-startDate补齐，记录listingMetadata来源和originResolution。若明确首帖与列表确有冲突，仍进入待核验，不能任意覆盖。列表字段补齐属于来源明确的数据，不表示首帖已被两条路径独立核验。

## 2026-11-16 实测

[运行43800995800](https://github.com/raeshi1010-hue/Trend/actions/runs/43800995800)通过35项测试、采集与结构校验。17条候选基础字段齐备：DIYnot10、ContractorTalk4、SkyscraperCity3。

新增论坛7条均未直接定位到详情首帖，采用列表明确起始字段，并保留可见回复数据用于追溯。因此此前6条来源冲突不再由“回复被错误认作首帖”触发，但仍未完成详情首帖双重核验。

例如AI估算工具讨论的起始作者为hinejs、起始时间2026-11-13T21:22:16Z；此前可读article的KAP是另一条可见帖子数据，不应默认作为首帖。Manchester项目采用列表起始作者mileymc1及2026-11-10T22:17:51Z，而不是页面首个可读回复。原有可见字段未被删除。

所有互动数仍为累计值，买家/受众市场未确认；字段完整不代表热门榜。尚未完成浏览器视觉验收、正式API凭据验收、BGM、日周报自动更新及线上发布。
