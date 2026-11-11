/* ==========================================================
 *  author-buttons —— 作者卡里多加几个跳转按钮
 *
 *  Butterfly 的 card_author.button 只支持一个（现在是 GitHub），
 *  想再挂一个同款按钮，就在下面 EXTRA_BUTTONS 里加一条。
 *
 *  做法：在渲染完的 HTML 里找到那个按钮，把它和一个壳一起包起来，
 *  多出来的按钮用同样的 class。不改主题文件，主题升级不会丢。
 *  样式在 source/css/custom.css 的「7. 作者卡按钮」。
 * ========================================================== */

'use strict'

const EXTRA_BUTTONS = [
  {
    href: 'https://space.bilibili.com/52781172',
    icon: 'fab fa-bilibili',
    text: '哔哩哔哩',
    title: '哔哩哔哩个人主页',
    external: true,
    mod: 'bilibili', // 对应 CSS 里的 .card-info-btn--bilibili（B 站粉底）
  },
]

const MARKER = 'card-info-btns'

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderButton(btn) {
  const ext = btn.external ? ' target="_blank" rel="noopener noreferrer"' : ''
  const title = btn.title || btn.text
  const cls = btn.mod ? `card-info-btn card-info-btn--${btn.mod}` : 'card-info-btn'
  return `<a class="${esc(cls)}" href="${esc(btn.href)}"${ext} title="${esc(title)}">` +
    `<i class="${esc(btn.icon)}"></i><span>${esc(btn.text)}</span></a>`
}

hexo.extend.filter.register('after_render:html', function (str) {
  if (!EXTRA_BUTTONS.length) return str
  if (str.indexOf('id="card-info-btn"') === -1) return str
  if (str.indexOf(MARKER) !== -1) return str // 已经处理过

  const extra = EXTRA_BUTTONS.map(renderButton).join('')

  return str.replace(
    /<a id="card-info-btn"[\s\S]*?<\/a>/,
    original => `<div class="${MARKER}">${original}${extra}</div>`
  )
})
