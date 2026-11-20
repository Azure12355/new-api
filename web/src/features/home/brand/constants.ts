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

/** Public relay address shown on the home page. */
export const BRAND_BASE_URL = 'https://api.model-hub.org/v1'

/** Shown when /api/pricing returns nothing (for example a fresh install). */
export const FALLBACK_MODELS: Array<{ id: string; vendor: string }> = [
  { id: 'claude-opus-5-5', vendor: 'Anthropic' },
  { id: 'claude-opus-5', vendor: 'Anthropic' },
  { id: 'claude-sonnet-5', vendor: 'Anthropic' },
  { id: 'claude-opus-4-8', vendor: 'Anthropic' },
  { id: 'claude-opus-4-7', vendor: 'Anthropic' },
  { id: 'claude-sonnet-4-6', vendor: 'Anthropic' },
  { id: 'claude-opus-4-6', vendor: 'Anthropic' },
  { id: 'claude-sonnet-4-5-20250929', vendor: 'Anthropic' },
  { id: 'claude-haiku-4-5-20251001', vendor: 'Anthropic' },
  { id: 'deepseek-v4-pro', vendor: 'DeepSeek' },
  { id: 'deepseek-flash', vendor: 'DeepSeek' },
]

/** Models cycled in the "switch models" demo. */
export const DEMO_MODELS = [
  'claude-opus-5-5',
  'claude-sonnet-5',
  'deepseek-v4-pro',
]

export const CLIENTS: Array<{ name: string; kind: string }> = [
  { name: 'Claude Code', kind: 'CLI' },
  { name: 'Cursor', kind: 'IDE' },
  { name: 'Cline', kind: 'IDE' },
  { name: 'Cherry Studio', kind: 'APP' },
  { name: 'LobeChat', kind: 'APP' },
  { name: 'OpenAI SDK', kind: 'SDK' },
  { name: 'Anthropic SDK', kind: 'SDK' },
  { name: 'LangChain', kind: 'SDK' },
  { name: 'Dify', kind: 'APP' },
  { name: 'n8n', kind: 'APP' },
]
