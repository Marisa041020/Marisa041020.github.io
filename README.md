# 灯下 · 写作与维护说明

站点：**https://notedown.top**
仓库：**github.com/Marisa041020/Marisa041020.github.io**
引擎：Hexo 8.1.2 + Butterfly 5.7.2

---

## 一、写文章（推荐：全程在浏览器里）

打开这个地址，直接新建文件：

**https://github.com/Marisa041020/Marisa041020.github.io/new/main/source/_posts**

1. 文件名填 `2026-11-20-dong-tian-de-di-yi-chang-xue.md`
   —— 建议「日期-拼音」，因为**文件名就是网址**，会变成
   `/posts/2026-11-20-dong-tian-de-di-yi-chang-xue.html`
2. 正文最上面写这一段（`---` 必须有）：

   ```markdown
   ---
   title: 冬天的第一场雪
   date: 2026-11-20 21:00:00
   tags:
     - 随笔
   description: 首页列表里显示的摘要，一两句话。
   ---
   ```

3. 下面直接写正文
4. 页面底部点 **`Commit changes`**
5. 等约 1 分钟，`notedown.top` 自动更新

改文章：打开 `source/_posts/` 里对应文件，点右上角铅笔。
删文章：文件页右上角 `···` → `Delete file`。
看构建状态：https://github.com/Marisa041020/Marisa041020.github.io/actions
（绿勾=成功，红叉=失败，点进去能看报错）

### 几个要点

- **每个 `.md` 都会成为一篇公开文章**。想存草稿，把文件名前面加下划线，
  如 `_draft-某篇.md`，Hexo 会跳过以 `_` 开头的文件。
- `source/about/index.md` 是「关于」页，不是文章。
- **date 决定排序**，写未来的时间不会立刻显示（`future: true` 已开，所以也可以）。
- 网页上新建文件时，文件名里带 `/` 会自动建目录，比如
  `posts/某篇.md`，但**不要**在 `_posts` 下再套目录，会让网址多一层。

### 插图片

1. 打开 https://github.com/Marisa041020/Marisa041020.github.io/upload/main/source/img
2. 把图片拖进去，`Commit changes`
3. 文章里写 `![说明](/img/图片名.jpg)`（开头是 `/img/`，不是 `../`）

---

## 二、写作语法（比旧站强不少）

旧那套自写解析器只认得标题、粗体、引用、列表。现在换成标准 Markdown，
之前写不了的都能用了：

| 写法 | 效果 |
|---|---|
| `\| 甲 \| 乙 \|` 两行 | **表格**（旧站不支持，现在支持） |
| `> 引用` | 引用块，左侧赭色细线 |
| `**粗体**` `*斜体*` | 正常 |
| `---` | 分隔线 |
| ` ```python ` | 代码块，带语言高亮和复制按钮 |
| `![说明](/img/x.jpg)` | 图片，**点击可放大** |

还有几个 Hexo 专属的块，写文章时很有用：

```markdown
{% note info 小标题 %}
这是一个提示块，四边有底色。
{% endnote %}
```

`info` 可换成 `default` / `primary` / `success` / `warning` / `danger`。

```markdown
{% hideToggle 点开看 %}
被折叠的内容。
{% endhideToggle %}
```

---

## 三、本地预览（可选）

双击 **`preview.bat`**，浏览器打开 http://localhost:4000 。
改完文件保存，页面会自动刷新。关掉黑窗口即停止。

第一次运行如果提示缺依赖，它会自己装（走国内镜像，几分钟）。

---

## 四、改外观

### 换主题色

打开 `_config.butterfly.yml`，找文件末尾的 `theme_color`：

```yaml
theme_color:
  enable: true
  main: '#8c5535'      # 主色：按钮、链接、强调
  ...
```

改颜色值、`Commit changes`，一分钟生效。现在是**赭石**（旧站也是这一支）。

- 更清冷：`#3f5e6b`（青灰）
- 更沉：`#4a4237`（墨褐）
- 更暖：`#9a4c3a`（铁锈红）

### 改细节样式

`source/css/custom.css`，已经写好一套中文排版（段间距、首行缩进、引用块、
图片圆角、暗色适配）。想调字号行距改最上面那几行即可。这个文件**不会被主题升级覆盖**。

### 换首页大图

`source/img/banner.svg` 是现在那张深色底图。换成自己的照片：
把 `photo.jpg` 传到 `source/img/`，然后把 `_config.butterfly.yml` 里的

```yaml
default_top_img: /img/banner.svg
index_img: /img/banner.svg
```

改成 `/img/photo.jpg`。

首页大图高度在 `index_top_img_height: 360px`，想更矮改 260px。

### 站名与简介

`_config.yml` 顶部：

```yaml
title: 灯下
subtitle: 把日子读得慢一点
description: 一些关于读书、教书与生活的随笔。
author: 灯下
```

---

## 五、目录结构

```
hexo/
├─ _config.yml            Hexo 主配置：站名、网址、永久链接
├─ _config.butterfly.yml  主题配置：菜单、侧栏、颜色、字体、搜索
├─ package.json           依赖清单（云端构建按它安装）
├─ package-lock.json      锁定版本，别删
├─ preview.bat            本地预览
├─ publish.bat            本地提交并推送（可选）
├─ .github/workflows/
│  └─ pages.yml           云端构建 + 发布，别删
└─ source/
   ├─ _posts/             文章都在这
   ├─ about/index.md      关于页
   ├─ tags/index.md       标签总览页
   ├─ css/custom.css      自己的样式
   ├─ img/                图片、头像、图标、banner
   ├─ CNAME               notedown.top（绑域名用）
   └─ robots.txt          爬虫规则
```

`node_modules/` 和 `public/` 是生成物，已加入 `.gitignore`，不参与提交。

---

## 六、常见问题

**构建失败（Actions 红叉）**
九成是 `_config.butterfly.yml` 的 YAML 缩进错了，或者颜色值没加引号。
点进失败的 run，看 `构建（hexo generate）` 那一步的报错行号。

**YAML 三条铁律**：冒号后面必须有空格；缩进只能用空格不能用 Tab；
颜色值要加引号 `'#8c5535'`。

**网页上改了没生效**
先看 Actions 是不是还在跑（约 1 分钟）。浏览器强刷 Ctrl+F5。

**文章网址变了**
网址取自文件名。改了文件名等于换了网址，旧链接会 404。

**想回到旧版静态站**
旧的生成器归档在 `../blog-old-static/`，已经断开远端连接，不会再覆盖线上。
里面 `content/*.md` 的文章原文都在，可以复制到 `source/_posts/`。
确认不需要了，整个文件夹删掉即可。

---

## 七、和旧站的关系

- **文章网址不变**：`/posts/2026-10-12-yi-ben-shu-de-shi-jian.html` 这类地址照旧能用
- **`/feed.xml`、`/sitemap.xml`、`/robots.txt` 都保留**
- 多了：标签页、归档页、站内搜索、目录（TOC）、暗色切换、图片放大、上下篇
- 域名和证书都没动，`https://notedown.top` 直接可用
