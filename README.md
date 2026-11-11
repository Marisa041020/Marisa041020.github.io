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

### 给图片配图注（`fig` 标签）

想让图片下面跟一行图注、或者几张图并排成一行，用 `fig` 标签。
**图片路径和图注之间用 `|` 隔开，图注一律写在标签正文里**：

单张：

```
{% fig %}
/img/posts/a.webp | 图一：I Want YOU for U.S. Army（1917）
{% endfig %}
```

并排两张（第一行写列数）：

```
{% fig 2 %}
/img/posts/a.webp | 图三：左边这张的说明
/img/posts/b.webp | 图四：右边这张的说明
@图三、图四：这一组的总图注（可省）
{% endfig %}
```

- 每一行三段都可用：`路径 | 图注 | 读屏文字`，第三段不写就沿用图注。
- `@` 开头的那行是**整组**的总图注，没写就不显示。
- 单张默认占正文宽度的 62%，想改就加一行 `@w 80`（80%）。
- 列数最多 4；手机上自动压成两列。
- 图片点一下会放大（主题自带的灯箱）。
- **不要写成 `{% fig 路径 "图注" %}` 这种内联形式**——这版 Hexo 的模板引擎会把引号里的内容二次处理，路径会被转义成 `&#x2F;`，图就裂了。正文形式才安全。

---

## 二、上摄影作品（相册）

导航栏的「相册」指向 `/photos/`。这个页面**不用手写**：构建时会自动扫描
`source/img/photos/` 里的图片，铺成瀑布流；同时首页顶部也会出现一条
「最近的照片」，显示最新 6 张，点「全部照片 →」进相册。

列数会跟着照片数量走：1 张占满一整行、2 张分两列、3 张起固定三列
（窄屏自动降到两列 / 一列），不会出现「只有一张图却空着两列」的情况。

所以上照片只有两步：**压图 → 放进文件夹**。

### 第一步：压缩（重要）

手机原图一张 5–8MB，几十张就能把仓库撑大、把站点拖慢。
用 `tools/压缩照片.bat` 批量处理：

1. 把装有照片的**文件夹**拖到这个 bat 文件上
2. 它会自动：按 EXIF 方向转正 → 长边压到 2048px → 转 WebP（质量 80）
   → **清除 GPS 定位信息** → 输出到 `source/img/photos/`
3. 结束时打印每张压缩前后的大小

命令行也可以，参数自己调：

```bash
python tools/compress_photos.py "D:\照片\2026-11"              # 默认长边 2048、质量 80
python tools/compress_photos.py "D:\照片\2026-11" -m 2560 -q 85
python tools/compress_photos.py "D:\照片\2026-11" --keep-exif
```

目标是一张 200–400KB。横幅风景可以到 500KB，竖幅 250KB 左右就够看。

### 第二步：传上去

**方式一（推荐，全程网页）**

打开 https://github.com/Marisa041020/Marisa041020.github.io/upload/main/source/img/photos
把压好的 `.webp` 拖进去 → `Commit changes`。约 1 分钟后相册里就有这些图。

**方式二（本地）**

压完后在 `hexo` 目录双击 `publish.bat`。

### 第三步：想加一句话描述（可选）

**两种写法，任选其一。**

**写法一：直接写进文件名（最省事）**

用两个下划线 `__` 把描述接在名字后面，**上传时一次搞定**：

```
2026-11-11-窗台上的两本书__下午的光斜过来，书脊上有道亮边.webp
2026-12-05-雪后操场__早自习前，没有人踩过.webp
```

不用管清单文件，传上去就有描述。想改描述就重新传一次、把旧文件删掉。

**写法二：事后补在清单里**

打开 `source/img/photos/_captions.txt`，一行一张，`文件名 | 描述`：

```
2026-11-11-窗台上的两本书.webp | 下午的光斜过来
2026-12-雪后操场-01.webp | 早自习前，没有人踩过的操场
```

**两处都写时，以清单文件为准**（适合文件名已经定下来、只想改文字的情况）。

照片下面显示两行：**上面一行是名字**（衬线字体，取自文件名里日期后面的部分，
`2026-11-11-Bloom.webp` 显示为 `Bloom`），**下面一行是描述**（正文字体，字号小一号）。
没有描述时只显示名字那一行。

几点说明：

- **完全不写，那张照片就只放图、没有描述**
- 清单里文件名不区分大小写、忽略空格，也可以不写扩展名，
  或者只写去掉日期前缀的名字（`Bloom | 路边拍到的一朵` 也认）
- `#` 开头的行是注释
- 文件名写错（找不到对应图片）时，构建日志会有黄色提示
  `[photos] _captions.txt 里的「xxx」找不到对应图片`
- 清单文件以下划线开头，**不会被发布到网站**，只是构建时读

### 排序

按**最后改动时间**排，最新的在最前面。时间取自这张图的 git 提交时间——
所以你在网页上重新上传一次、或者改一次描述，它就会跑到最前面。

文件名里的日期只作为兜底（本地还没提交时用）。建议还是用日期开头：

```
2026-11-梧桐-01.webp
2026-11-梧桐-02.webp
2026-12-雪后操场-01.webp
```

中文、空格都能用，但**不要用 `_` 开头**（那会被当成被忽略的文件）。

### 调整

所有开关都在 `scripts/photos.js` 顶部的 `CONFIG` 里：

- `title` / `intro`：相册页标题和开头那句话
- `homeTitle`：首页那一条的标题（默认「最近的照片」）
- `homeLimit`：首页显示几张（默认 6）
- `homeEnable`：设成 `false` 就不在首页显示照片
- 列数：`source/css/custom.css` 里的 `.photo-grid { column-count }`，
  默认 3 列，窄屏自动降到 2 列 / 1 列

其他：

- 照片会**全部**铺出来。哪天超过一百张，再考虑按年份分页
- 点图能放大（medium_zoom 已启用）

### 不要做的事

- **不要用 Git LFS**。GitHub Pages 不解析 LFS 指针，图片会直接 404
- 不要把没压缩的原图直接传上来
- 仓库建议控制在 1GB 内，单文件不能超过 100MB

---

## 三、写作语法（比旧站强不少）

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

## 四、本地预览（可选）

双击 **`preview.bat`**，浏览器打开 http://localhost:4000 。
改完文件保存，页面会自动刷新。关掉黑窗口即停止。

第一次运行如果提示缺依赖，它会自己装（走国内镜像，几分钟）。

---

## 五、改外观

### 换主题色

打开 `_config.butterfly.yml`，找文件末尾的 `theme_color`：

```yaml
theme_color:
  enable: true
  main: '#0ea5e9'      # 主色：按钮底、标签悬停
  link_color: '#0284c7' # 正文里的链接，比主色深一档，白底上才够清楚
  ...
```

现在整套是**天蓝 + 白**：页面底 `#f5fafd`（冷白，带一点天光）、卡片纯白、
强调色 `#0ea5e9`。换颜色时记住一条：`main` 要压在白色文字底下，
所以别选太浅的蓝，否则按钮上的白字会糊；正文链接再深一档更保险。

几个现成的替代色：

- 更淡：`main: '#38bdf8'`、`link_color: '#0369a1'`
- 更沉：`main: '#0369a1'`、`link_color: '#075985'`
- 换色系：`main: '#8b5cf6'`（紫）、`'#10b981'`（绿），`link_color` 相应加深

改完记得同步改 `source/css/custom.css` 里那些写死的 `rgba(14, 165, 233, ...)`
（分隔线、引用底、阴影），否则会新色配旧色。

### 改细节样式

`source/css/custom.css`，已经写好一套中文排版（段间距、首行缩进、引用块、
图片圆角、暗色适配）。想调字号行距改最上面那几行即可。这个文件**不会被主题升级覆盖**。

### 换首页大图

`source/img/banner.svg` 是现在那张天蓝渐变的底图（首页、归档、标签、关于页共用）。
换成自己的照片：把 `photo.jpg` 传到 `source/img/`，然后把 `_config.butterfly.yml` 里的

```yaml
default_top_img: /img/banner.svg
index_img: /img/banner.svg
```

改成 `/img/photo.jpg`。

首页大图高度在 `index_top_img_height: 360px`，想更矮改 260px。

### 站名与简介

`_config.yml` 顶部：

```yaml
title: 一般路过魔法使的个人博客
subtitle: 给情绪一个出口
description: 列车终将驶向下一站
author: 一般路过魔法使
```

---

## 六、目录结构

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
├─ scripts/
│  └─ photos.js           相册页自动生成，别删
├─ tools/
│  ├─ compress_photos.py  批量压图脚本
│  └─ 压缩照片.bat        双击/拖文件夹就能跑
└─ source/
   ├─ _posts/             文章都在这
   ├─ about/index.md      关于页
   ├─ tags/index.md       标签总览页
   ├─ css/custom.css      自己的样式
   ├─ img/
   │  ├─ photos/          相册照片放这里（放进去就自动上墙）
   │  │  └─ _captions.txt 照片描述，一行一张（不发布）
   │  └─ ...              头像、图标、banner
   ├─ CNAME               notedown.top（绑域名用）
   └─ robots.txt          爬虫规则
```

`node_modules/` 和 `public/` 是生成物，已加入 `.gitignore`，不参与提交。

---

## 七、常见问题

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

## 八、和旧站的关系

- **文章网址不变**：`/posts/2026-10-12-yi-ben-shu-de-shi-jian.html` 这类地址照旧能用
- **`/feed.xml`、`/sitemap.xml`、`/robots.txt` 都保留**
- 多了：标签页、归档页、站内搜索、目录（TOC）、暗色切换、图片放大、上下篇
- 域名和证书都没动，`https://notedown.top` 直接可用
