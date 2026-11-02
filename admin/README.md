# 内容管理

访问 `/admin/` 管理 Portfolio、Selected work 和 Hello。

- **保存草稿**：仅写入当前浏览器 IndexedDB；旧草稿继续保留。
- **发布到网站**：使用仅限本仓库、Contents 读写权限的 GitHub 细粒度令牌，将图片与配置原子提交到 main。令牌只存在本次操作的内存中，不写入存储或发布文件。
- **导出配置**：下载完整 JSON 备份。
- 支持多选、拖放、缩略图、长按交换位置、独立封面与旋转画廊图片。每张上限 10 MiB，保留原始字节，不压缩。

公开首页和项目详情读取 `site-content.js`，通过 `content-loader.js` 适配旧画廊。新增原图按 SHA-256 存入 `assets/uploads/`；同内容只上传一次。不删除历史资源。

发布先检查草稿对应的线上版本，再创建 blobs/tree/commit，最后以非强制方式更新 main。冲突或失败不覆盖线上。提交成功后轮询公开配置，只有版本匹配时显示“网站已更新”；部署未完成会明确提示等待。

首次接入的 Chrome 草稿已提取为公开配置。原始导出备份保留在本机 Downloads/cecile-content.json。
