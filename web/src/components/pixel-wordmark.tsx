/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { cn } from '@/lib/utils'

/*
 * Site name drawn as pixel art (Model Hub brand): a 5x7 pixel font, the
 * letters in currentColor (so they follow light/dark), a purple layer offset
 * by one pixel behind them, and an orange pixel after the last letter.
 * Names with characters outside the font fall back to plain text.
 */

/** 5x7 glyphs, one string of 5 bits per row, top to bottom. */
const GLYPHS: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '11001', '10101', '10011', '10011', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00000', '00100'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
}
const ROWS = 7
const GLYPH_W = 5
const SPACE_W = 3
const GAP = 1

interface PixelWordmarkProps {
  text: string
  /** Screen pixels per font pixel; integers keep edges crisp. */
  scale?: number
  className?: string
}

export function PixelWordmark(props: PixelWordmarkProps) {
  const scale = props.scale ?? 3
  const chars = [...props.text.trim().toUpperCase()]
  const supported =
    chars.length > 0 && chars.every((c) => c === ' ' || GLYPHS[c])

  if (!supported) {
    return (
      <span className={cn('truncate font-semibold', props.className)}>
        {props.text}
      </span>
    )
  }

  // one path per layer: every lit pixel becomes a 1x1 square
  let path = ''
  let x = 0
  chars.forEach((c, i) => {
    if (i > 0) x += GAP
    if (c === ' ') {
      x += SPACE_W
      return
    }
    GLYPHS[c].forEach((row, y) => {
      for (let col = 0; col < GLYPH_W; col++) {
        if (row[col] === '1') path += `M${x + col} ${y}h1v1h-1z`
      }
    })
    x += GLYPH_W
  })
  const accentX = x + GAP
  const width = accentX + 1
  const height = ROWS + 1

  return (
    <svg
      role='img'
      aria-label={props.text}
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      shapeRendering='crispEdges'
      className={cn('mh-wordmark shrink-0', props.className)}
    >
      <title>{props.text}</title>
      <path d={path} transform='translate(1 1)' fill='#7048ff' />
      <path d={path} fill='currentColor' />
      <rect x={accentX} y={0} width={1} height={1} fill='#ff7a00' />
    </svg>
  )
}
