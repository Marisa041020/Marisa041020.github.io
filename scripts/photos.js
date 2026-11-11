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

/* ---------- 描述文件 ----------
   格式：文件名 | 描述
   例：  2026-11-梧桐-01.webp | 秋天操场边的那棵树
   # 开头的行是注释，不带 | 的行表示这张不写描述
*/
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
    map.set(key, cap);
    // 允许只写不带扩展名的文件名
    map.set(key.replace(IMAGE_EXT, ''), cap);
  }
  return map;
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
      return {
        name,
        ts,
        caption: (captions.get(name) || captions.get(name.replace(IMAGE_EXT, '')) || '').trim(),
        url: '/' + CONFIG.dir.replace(/^\/+|\/+$/g, '') + '/' + name,
      };
    });

  // 新的在前；同一时间按文件名升序，保证结果稳定
  photos.sort((a, b) => (b.ts - a.ts) || a.name.localeCompare(b.name, 'zh-Hans-CN'));

  // 描述文件里写了但找不到对应图片的，提示一下
  const known = new Set();
  photos.forEach((p) => { known.add(p.name); known.add(p.name.replace(IMAGE_EXT, '')); });
  for (const key of captions.keys()) {
    if (!known.has(key)) {
      hexo.log.warn('[photos] _captions.txt 里的「%s」找不到对应图片', key);
    }
  }

  return photos;
}

function figureHtml(p) {
  const alt = escapeHtml(p.caption || p.name.replace(IMAGE_EXT, ''));
  let html = '<figure><img src="' + escapeHtml(p.url) + '" alt="' + alt + '" loading="lazy">';
  if (p.caption) {
    html += '<figcaption>' + escapeHtml(p.caption) + '</figcaption>';
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
    content += '<div class="photo-grid">' + photos.map(figureHtml).join('') + '</div>';
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
  html += '<div class="photo-grid home-grid">' + list.map(figureHtml).join('') + '</div>';
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
