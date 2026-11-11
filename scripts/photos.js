/* ==========================================================
   相册 + 首页照片流
   ----------------------------------------------------------
   1. 扫描 source/img/photos/ 里的图片，生成 /photos/ 相册页
   2. 往首页 #recent-posts 顶部插一条「最近的照片」
   3. 图片描述写在 source/img/photos/_captions.txt（可留空）
   4. 排序按「最后改动时间」（取 git 提交时间，没有则退回文件名里的日期）

   本文件属于 Hexo 插件脚本，放在 scripts/ 下会被自动加载。
   ========================================================== */

/* ---------- 想改的就改这一段 ---------- */
const CONFIG = {
  title: '相册',                          // 相册页标题
  intro: '用相机留下的一些下午。',          // 相册页开头一句话，留空则不显示
  dir: 'img/photos',                      // 照片目录（相对 source/）
  pagePath: 'photos/index.html',          // 相册页网址
  captionsFile: '_captions.txt',          // 描述文件（下划线开头，不会被发布）
  emptyHint: '还没有照片，过些日子再来看。',

  homeEnable: true,                       // 首页要不要显示照片
  homeTitle: '最近的照片',
  homeLimit: 6,                           // 首页最多显示几张
};
/* ---------------------------------------- */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|bmp)$/i;
const PHOTO_DIR_REL = 'source/' + CONFIG.dir.replace(/^\/+|\/+$/g, '');

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- 描述来源 ----------
   两种，任选其一：
   ① 直接写进文件名：名字__描述.webp
      例 2026-11-11-窗台上的两本书__下午的光斜过来.webp
      —— 上传时顺手写好，不用再打开任何文件
   ② 事后补在 _captions.txt 里：文件名 | 描述
      —— 文件名部分不区分大小写、忽略空格，也可以不写扩展名

   两处都写时，_captions.txt 优先。
*/
function normalizeKey(s) {
  return String(s).replace(/\s+/g, '').toLowerCase();
}

function loadCaptions() {
  const p = path.join(hexo.source_dir, CONFIG.dir, CONFIG.captionsFile);
  const map = new Map();
  if (!fs.existsSync(p)) return map;

  const text = fs.readFileSync(p, 'utf-8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const at = line.indexOf('|');
    const key = (at === -1 ? line : line.slice(0, at)).trim();
    const cap = at === -1 ? '' : line.slice(at + 1).trim();
    if (!key) continue;
    map.set(normalizeKey(key), cap);
    // 允许只写不带扩展名的文件名
    map.set(normalizeKey(key.replace(IMAGE_EXT, '')), cap);
  }
  return map;
}

/* 从文件名里拆出「名字」和「内嵌描述」 */
function parseName(name) {
  const stem = name.replace(IMAGE_EXT, '');
  const at = stem.indexOf('__');
  if (at === -1) return { base: stem, inlineCaption: '' };
  return {
    base: stem.slice(0, at).trim(),
    inlineCaption: stem.slice(at + 2).trim(),
  };
}

/* 文件名开头的日期前缀只用来排序，不该显示在页面上
   2026-11-11-《藻井》 -> 《藻井》 / 20261108-Bloom -> Bloom */
const DATE_PREFIX = /^20\d{2}(?:-\d{2}-\d{2}|\d{4})[-_]?/;

function displayTitle(base) {
  const t = String(base).replace(DATE_PREFIX, '').trim();
  return t || String(base);
}

/* ---------- 时间 ----------
   依次尝试：git 最后提交时间 -> 文件名里的日期 -> 文件修改时间
*/
function commitTime(relPath) {
  try {
    const out = execSync(
      `git log -1 --format=%at -- "${relPath}"`,
      { cwd: hexo.base_dir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 8000 }
    ).trim();
    if (out) {
      const n = parseInt(out, 10);
      if (!isNaN(n) && n > 0) return n;
    }
  } catch (e) {
    /* 没有 git、或本地还没提交，忽略 */
  }
  return 0;
}

function nameTime(name) {
  // 2026-11-08-xxx / 2026-11-xxx / 20261108
  let m = name.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]) / 1000;
  m = name.match(/(20\d{2})-(\d{2})/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, 1) / 1000;
  m = name.match(/(20\d{2})(\d{2})(\d{2})/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]) / 1000;
  return 0;
}

function listPhotos() {
  const abs = path.join(hexo.source_dir, CONFIG.dir);
  let names = [];
  try {
    names = fs.readdirSync(abs);
  } catch (e) {
    return [];
  }

  const captions = loadCaptions();
  const photos = names
    .filter((n) => IMAGE_EXT.test(n) && !n.startsWith('.'))
    .map((name) => {
      const rel = PHOTO_DIR_REL + '/' + name;
      const ts = commitTime(rel) || nameTime(name) || 0;
      const { base, inlineCaption } = parseName(name);
      const title = displayTitle(base);

      // 提醒没压过的大图：整个相册页会一起加载，一张几 MB 就够拖慢
      try {
        const bytes = fs.statSync(path.join(hexo.source_dir, CONFIG.dir, name)).size;
        if (bytes > 1.5 * 1024 * 1024) {
          hexo.log.warn('[photos] %s 有 %s MB，太大了，建议先用 tools/压缩照片.bat 压一下',
            name, (bytes / 1048576).toFixed(1));
        }
      } catch (e) { /* 忽略 */ }

      // 描述：_captions.txt 优先，其次文件名里 __ 后面的部分
      // 依次按「完整文件名 → 去掉扩展名 → __ 前面的名字 → 去掉日期前缀的名字」匹配
      const fromFile = captions.get(normalizeKey(name))
        || captions.get(normalizeKey(name.replace(IMAGE_EXT, '')))
        || captions.get(normalizeKey(base))
        || captions.get(normalizeKey(title))
        || '';
      const caption = (fromFile || inlineCaption || '').trim();

      return {
        name,
        base,
        title,
        ts,
        caption,
        url: '/' + CONFIG.dir.replace(/^\/+|\/+$/g, '') + '/' + name,
      };
    });

  // 新的在前；同一时间按文件名升序，保证结果稳定
  photos.sort((a, b) => (b.ts - a.ts) || a.name.localeCompare(b.name, 'zh-Hans-CN'));

  // 描述文件里写了但找不到对应图片的，提示一下
  const known = new Set();
  photos.forEach((p) => {
    known.add(normalizeKey(p.name));
    known.add(normalizeKey(p.name.replace(IMAGE_EXT, '')));
    known.add(normalizeKey(p.base));
    known.add(normalizeKey(p.title));
  });
  for (const key of captions.keys()) {
    if (!known.has(key)) {
      hexo.log.warn('[photos] _captions.txt 里的「%s」找不到对应图片', key);
    }
  }

  return photos;
}

/* ---------- 单张照片的 HTML ----------
   名字在上（衬线字体）、描述在下（正文字体，字号更小），由 custom.css 控制
*/
function figureHtml(p) {
  const alt = escapeHtml([p.title, p.caption].filter(Boolean).join('，'));
  let html = '<figure><img src="' + escapeHtml(p.url) + '" alt="' + alt + '" loading="lazy">';
  if (p.title || p.caption) {
    html += '<figcaption>';
    if (p.title) html += '<span class="photo-name">' + escapeHtml(p.title) + '</span>';
    if (p.caption) html += '<span class="photo-desc">' + escapeHtml(p.caption) + '</span>';
    html += '</figcaption>';
  }
  html += '</figure>';
  return html;
}

/* ---------- 1. /photos/ 相册页 ---------- */
hexo.extend.generator.register('photos', function () {
  const photos = listPhotos();
  let content = '';

  if (CONFIG.intro) {
    content += '<p class="photo-intro">' + escapeHtml(CONFIG.intro) + '</p>';
  }

  if (photos.length === 0) {
    content += '<p class="photo-empty">' + escapeHtml(CONFIG.emptyHint) + '</p>';
  } else {
    // 照片少时按实际张数定列数，不然 3 列只放 1 张会空出两列
    const cols = Math.min(3, photos.length);
    content += '<div class="photo-grid" style="--photo-cols:' + cols + '">'
      + photos.map(figureHtml).join('') + '</div>';
  }

  return {
    path: CONFIG.pagePath,
    layout: 'page',
    data: { title: CONFIG.title, content, comments: false },
  };
});

/* ---------- 2. 首页照片流 ---------- */
function buildHomeSection(photos) {
  if (!photos.length) return '';
  const list = photos.slice(0, CONFIG.homeLimit);

  let html = '<section class="home-photos">';
  html += '<div class="home-photos-head">';
  html += '<h2>' + escapeHtml(CONFIG.homeTitle) + '</h2>';
  html += '<a href="/' + CONFIG.pagePath.replace(/index\.html$/, '') + '">全部照片 →</a>';
  html += '</div>';
  html += '<div class="photo-grid home-grid" style="--photo-cols:'
    + Math.min(3, list.length) + '">' + list.map(figureHtml).join('') + '</div>';
  html += '</section>';
  return html;
}

hexo.extend.filter.register('after_render:html', function (str, data) {
  if (!CONFIG.homeEnable) return str;
  if (!data || data.path !== 'index.html') return str;

  const section = buildHomeSection(listPhotos());
  if (!section) return str;

  const marker = /<div[^>]*id="recent-posts"[^>]*>/;
  const m = str.match(marker);
  if (!m) return str;

  const end = m.index + m[0].length;
  return str.slice(0, end) + section + str.slice(end);
});
