import { createElement } from 'react'
import { resolveContentIcon } from '../lib/contentIcons.js'

export default function ContentIcon({ type, ...props }) {
  const Icon = resolveContentIcon(type)
  return createElement(Icon, { 'aria-hidden': true, ...props })
}