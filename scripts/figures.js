/* ==========================================================
 *  fig —— 带图注的配图标签
 *
 *  单张：
 *    {% fig %}
 *    /img/posts/a.webp | 图一：说明
 *    {% endfig %}
 *
 *  成排（第一个参数是列数）：
 *    {% fig 2 %}
 *    /img/posts/a.webp | 图三：左边这张
 *    /img/posts/b.webp | 图四：右边这张
 *    @图三、图四：一组海报        <- 整组的总图注，可省
 *    {% endfig %}
 *
 *  每一行的格式：图片路径 | 图注 | 读屏文字（第三段可省）
 *  指令：@w 70  —— 单图宽度占正文百分比（默认 62）
 *
 *  ── 为什么用块语法而不是 {% fig 路径 "图注" %} ──
 *  实测这版 Hexo 的模板引擎会把内联标签的引号参数二次处理：引号被替换成全角、
 *  路径里的 / 被转义成 &#x2F;，导致图片加载失败。块标签的正文是原样传入的，
 *  不受影响，所以图注一律写在正文里。
 *
 *  输出 <figure>，交给主题的 medium_zoom 放大、原生 lazyload 懒加载，
 *  样式在 source/css/custom.css 的「5. 配图」。
 * ========================================================== */

'use strict'

const fs = require('fs')
const path = require('path')
const { url_for } = require('hexo-util')

const DEFAULTS = {
  singleWidth: 62, // 单图默认占正文宽度的百分比
  maxCols: 4,
}

/* ---------- 工具 ---------- */

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* 站内路径换成可访问地址；外链原样返回 */
function toUrl(src) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src
  return url_for.call(hexo, src)
}

/* 站内路径 -> 磁盘路径，用来读图片尺寸 */
function toLocal(src) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return null
  const rel = src.replace(/^\/+/, '').split(/[?#]/)[0]
  return path.join(hexo.source_dir, rel)
}

/* ---------- 读图片宽高（避免图片加载时版面跳动） ---------- */

const sizeCache = new Map()

function parseSize(buf) {
  if (buf.length < 26) return null

  // PNG
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  }
  // GIF
  if (buf.toString('ascii', 0, 3) === 'GIF') {
    return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) }
  }
  // JPEG：扫到 SOF 段
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue }
      const marker = buf[i + 1]
      const isSOF = marker >= 0xc0 && marker <= 0xcf &&
        marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      if (isSOF) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) }
      const len = buf.readUInt16BE(i + 2)
      if (len <= 0) return null
      i += 2 + len
    }
    return null
  }
  // WebP
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = buf.toString('ascii', 12, 16)
    if (fmt === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) }
    if (fmt === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
    if (fmt === 'VP8L') {
      const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24]
      return {
        w: 1 + (((b1 & 0x3f) << 8) | b0),
        h: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      }
    }
    return null
  }
  return null
}

function imageSize(localPath) {
  if (!localPath) return null
  if (sizeCache.has(localPath)) return sizeCache.get(localPath)
  let dim = null
  try {
    dim = parseSize(fs.readFileSync(localPath))
  } catch (e) {
    dim = null
  }
  sizeCache.set(localPath, dim)
  return dim
}

/* ---------- 片段 ---------- */

function imgTag(src, alt) {
  const dim = imageSize(toLocal(src))
  const attrs = [
    `src="${esc(toUrl(src))}"`,
    `alt="${esc(alt)}"`,
    'loading="lazy"',
    'decoding="async"',
  ]
  if (dim) attrs.push(`width="${dim.w}"`, `height="${dim.h}"`)
  return `<img ${attrs.join(' ')}>`
}

function captionTag(text, cls) {
  return text ? `<figcaption class="${cls}">${esc(text)}</figcaption>` : ''
}

/* 路径被转义过就说明参数被二次处理了，直接报出来，别让读者看到裂图 */
function checkSrc(src) {
  if (/&#|\uFF02|^\u201C/.test(src)) {
    hexo.log.error(`[fig] 图片路径被转义了：${src}。请确认路径写在块标签正文里，且不含引号。`)
    return false
  }
  return true
}

/* ---------- 标签本体 ---------- */

function renderFig(args, content) {
  const nodes = []
  let groupCaption = ''
  let width = DEFAULTS.singleWidth
  let colsArg = parseInt((args && args[0]) || '', 10)

  for (const raw of String(content || '').split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('@')) {
      const directive = line.match(/^@w\s*[:=]?\s*(\d+(?:\.\d+)?)%?$/i)
      if (directive) {
        width = Math.min(parseFloat(directive[1]), 100)
      } else {
        groupCaption = line.slice(1).trim()
      }
      continue
    }

    const parts = line.split('|').map(s => s.trim())
    const src = parts[0]
    if (!src) continue
    if (!checkSrc(src)) continue
    nodes.push({ src, caption: parts[1] || '', alt: parts[2] || parts[1] || '' })
  }

  if (!nodes.length) {
    hexo.log.warn('[fig] 里面没有可用图片，这段已跳过')
    return ''
  }

  // 只有一张：居中单图
  if (nodes.length === 1) {
    const n = nodes[0]
    return [
      `<figure class="pfig pfig--single" style="--pfig-w:${width}%">`,
      `<div class="pfig__media">${imgTag(n.src, n.alt)}</div>`,
      captionTag(n.caption, 'pfig__caption'),
      '</figure>',
    ].join('')
  }

  // 多张：排成一行
  let cols = colsArg > 0 ? colsArg : nodes.length
  cols = Math.min(cols, DEFAULTS.maxCols, nodes.length)

  const cells = nodes.map(n => {
    const cap = n.caption
      ? `<figcaption class="pfig__cellcaption">${esc(n.caption)}</figcaption>`
      : ''
    return `<figure class="pfig__cell"><div class="pfig__media">${imgTag(n.src, n.alt)}</div>${cap}</figure>`
  }).join('')

  return [
    `<figure class="pfig pfig--group" style="--pfig-cols:${cols}">`,
    `<div class="pfig__grid">${cells}</div>`,
    captionTag(groupCaption, 'pfig__caption'),
    '</figure>',
  ].join('')
}

hexo.extend.tag.register('fig', renderFig, { ends: true })
// figs 作为别名，写 {% figs 3 %} 一样能用
hexo.extend.tag.register('figs', renderFig, { ends: true })
