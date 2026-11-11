/* ==========================================================
   相册页生成器
   作用：构建时扫描 source/img/photos/ 里的图片，
        自动生成 /photos/ 相册页。放新图后重新构建即可，不用改任何页面。
   说明：本文件属于 Hexo 插件脚本，放在 scripts/ 下会被自动加载。
        改完必须重新构建（本地 publish.bat / 云端 Actions 自动）
   ========================================================== */

/* ---------- 想改的就改这一段 ---------- */
const CONFIG = {
  title: '相册',                          // 页面标题
  intro: '用相机留下的一些下午。',          // 页面开头一句话，留空则不显示
  dir: 'img/photos',                      // 照片目录（相对 source/）
  pagePath: 'photos/index.html',          // 生成出来的网址路径
  emptyHint: '还没有照片，过些日子再来看。',
};
/* ---------------------------------------- */

const fs = require('fs');
const path = require('path');

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|bmp)$/i;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function listPhotos() {
  const abs = path.join(hexo.source_dir, CONFIG.dir);
  let names = [];
  try {
    names = fs.readdirSync(abs);
  } catch (e) {
    return [];
  }
  return names
    .filter((n) => IMAGE_EXT.test(n) && !n.startsWith('.'))
    // 按文件名升序：建议用 YYYY-MM 或日期开头命名，阅读顺序即时间顺序
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
}

hexo.extend.generator.register('photos', function () {
  const photos = listPhotos();
  const base = '/' + CONFIG.dir.replace(/^\/+|\/+$/g, '') + '/';

  let content = '';

  if (CONFIG.intro) {
    content += '<p class="photo-intro">' + escapeHtml(CONFIG.intro) + '</p>';
  }

  if (photos.length === 0) {
    content += '<p class="photo-empty">' + escapeHtml(CONFIG.emptyHint) + '</p>';
  } else {
    content += '<div class="photo-grid">';
    for (const name of photos) {
      const alt = escapeHtml(name.replace(IMAGE_EXT, ''));
      const src = escapeHtml(base + name);
      content +=
        '<figure><img src="' + src + '" alt="' + alt + '" loading="lazy"></figure>';
    }
    content += '</div>';
  }

  return {
    path: CONFIG.pagePath,
    layout: 'page',
    data: {
      title: CONFIG.title,
      content: content,
      comments: false,
    },
  };
});
