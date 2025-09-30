import React, {useMemo, useState} from 'react'
import {useFormValue, PatchEvent, setIfMissing, set} from 'sanity'
import type {StringInputProps} from 'sanity'
import {Button, Card, Stack, Text, Badge, Box, Flex, useToast} from '@sanity/ui'

export function SeoAssistant(props: StringInputProps) {
  const title = useFormValue(['title']) as string | undefined
  const body = useFormValue(['body']) as any[] | undefined
  const excerpt = useFormValue(['excerpt']) as string | undefined
  const targetKeyword = useFormValue(['targetKeyword']) as string | undefined
  const eeat = useFormValue(['eeat']) as Record<string, any> | undefined
  const { onChange } = props
  const [loading, setLoading] = useState(false)
  const [coverage, setCoverage] = useState<{score:number; missing:{required:string[]; recommended:string[]}; faqSuggestions:string[]} | null>(null)
  const toast = useToast()

  const report = useMemo(() => {
    const blocks = Array.isArray(body) ? body : []
    const textBlocks = blocks.filter(b => b?._type === 'block')
    const images = blocks.filter((b:any) => b?._type === 'image')
    const plainText = textBlocks.map((b:any) => (b.children||[]).map((c:any)=>c.text||'').join('')).join('\n')
    const chars = plainText.replace(/\s/g,'').length
    const words = plainText.split(/\s+/).filter(Boolean).length
    const headings = textBlocks
      .filter((b:any) => b.style === 'h2' || b.style === 'h3')
      .map((b:any) => ({style: b.style, text: (b.children||[]).map((c:any)=>c.text||'').join('')}))
    const h2 = headings.filter(h=>h.style==='h2')
    const h3 = headings.filter(h=>h.style==='h3')
    const imagesMissingAlt = images.filter((img:any)=>!img.alt)
    const internalLinkCount = (plainText.match(/mamasanlife\.com/gi)||[]).length
    const refs = (eeat?.references || []).length
    let score = 0
    score += Math.min(30, Math.floor(chars/600)*5)
    score += Math.min(15, h2.length*3)
    score += Math.min(10, h3.length*2)
    score += imagesMissingAlt.length === 0 ? 10 : 0
    score += internalLinkCount >= 2 ? 10 : internalLinkCount>0 ? 5 : 0
    score += refs >= 1 ? 10 : 0
    score += targetKeyword && title?.includes(targetKeyword) ? 5 : 0
    score += excerpt && targetKeyword && excerpt.includes(targetKeyword) ? 5 : 0
    score = Math.min(100, score)
    const missingSuggestions:string[] = []
    if (h2.length < 3) missingSuggestions.push('このテーマの全体像（H2）')
    if (!headings.find(h=>/選び方|ポイント|基準/.test(h.text))) missingSuggestions.push('選び方・比較基準（H2）')
    if (!headings.find(h=>/Q&A|よくある質問|FAQ/.test(h.text))) missingSuggestions.push('よくある質問（H2/FAQ）')
    if (refs === 0) missingSuggestions.push('出典・参考リンク（H2）')
    return {chars, words, h2, h3, imagesMissingAlt, internalLinkCount, refs, score, missingSuggestions}
  }, [body, excerpt, targetKeyword, title, eeat])

  function resolveInsertIndex(len: number) { return len }

  const insertH2 = (text: string) => {
    if (typeof onChange !== 'function') return
    const block = { _type: 'block', style: 'h2', markDefs: [], children: [{ _type: 'span', text, marks: [] }] }
    const current = Array.isArray(body) ? body : []
    const idx = resolveInsertIndex(current.length)
    const next = [...current.slice(0, idx), block, ...current.slice(idx)]
    onChange(PatchEvent.from(setIfMissing([], ['body'])))
    onChange(PatchEvent.from(set(next, ['body'])))
    try {
      // Studioがフォーカス時に自動スクロールすることを期待
      ;(props as any).onPathFocus?.(['body', idx])
      toast.push({status:'success', title:`見出しを本文に挿入しました（位置: ${idx+1}行目付近）`})
    } catch {}
  }

  const insertFAQSection = (questions: string[]) => {
    if (typeof onChange !== 'function') return
    const nodes = [
      { _type: 'block', style: 'h2', markDefs: [], children: [{ _type: 'span', text: 'よくある質問（FAQ）', marks: [] }] },
      ...questions.map((q) => ({ _type: 'block', style: 'h3', markDefs: [], children: [{ _type: 'span', text: q, marks: [] }] })),
      { _type: 'block', style: 'normal', markDefs: [], children: [{ _type: 'span', text: '（回答をここに記入）', marks: [] }] },
    ]
    const current = Array.isArray(body) ? body : []
    const idx = resolveInsertIndex(current.length)
    const next = [...current.slice(0, idx), ...nodes, ...current.slice(idx)]
    onChange(PatchEvent.from(setIfMissing([], ['body'])))
    onChange(PatchEvent.from(set(next, ['body'])))
    try {
      ;(props as any).onPathFocus?.(['body', idx])
      toast.push({status:'success', title:`FAQ雛形を本文に挿入しました（位置: ${idx+1}行目付近）`})
    } catch {}
  }

  const runCoverage = async () => {
    try {
      setLoading(true)
      // 1) SERP（モック）
      const serp = await fetch('/api/seo/serp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keyword: targetKeyword || title || 'キーワード', num: 3 }) }).then(r => r.json())
      // 2) 各URLの見出し（モック）
      const comps = await Promise.all(
        (serp.items || []).map((it: any) => fetch('/api/seo/scrape', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: it.url }) }).then(r => r.json()).then((d) => ({ url: it.url, ...d })))
      )
      // 3) カバレッジ
      const draftHeadings = report.h2.map(h => h.text).concat(report.h3.map(h => h.text))
      const cov = await fetch('/api/seo/coverage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keyword: targetKeyword || title || 'キーワード', draftHeadings, competitors: comps }) }).then(r => r.json())
      setCoverage(cov)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padding={3} tone={report.score>=80 ? 'positive' : report.score>=60 ? 'caution' : 'critical'} style={{lineHeight:1.8}}>
      <Stack space={3}>
        <Flex align="center" justify="space-between">
          <Text size={2} weight="semibold">SEOアシスタント（ローカルチェック）</Text>
          <Badge mode="outline">{report.score}/100</Badge>
        </Flex>
        <Box>
          <Stack space={1}>
            <Text size={1}>文字数目安：{report.chars}文字（単語 {report.words}）</Text>
            <Text size={1}>H2: {report.h2.length} / H3: {report.h3.length}</Text>
            <Text size={1}>内部リンク数: {report.internalLinkCount}（推奨2以上）</Text>
            <Text size={1}>出典リンク: {report.refs}（推奨1以上）</Text>
          </Stack>
          {report.imagesMissingAlt.length>0 && (
            <Text tone="critical" size={1}>画像alt未入力: {report.imagesMissingAlt.length}件</Text>
          )}
        </Box>
        <Flex gap={2} wrap="wrap">
          <Button text={loading ? '解析中…' : '上位見出しを解析（モック）'} disabled={loading} onClick={runCoverage} />
          {coverage?.faqSuggestions && <Button tone="primary" text="FAQを挿入" onClick={()=>insertFAQSection(coverage.faqSuggestions)} />}
        </Flex>

        {coverage && (
          <Card padding={3} tone={coverage.score>=80 ? 'positive' : coverage.score>=60 ? 'caution' : 'critical'} radius={2}>
            <Text size={1}>カバレッジ（推定）: {coverage.score}/100</Text>
            <Stack space={3} marginTop={2}>
              {coverage.missing.required.length>0 && (
                <Box>
                  <Text weight="semibold" size={1}>要追加（必須）</Text>
                  <Stack space={2} marginTop={1}>
                  {coverage.missing.required.map((m:string, i:number)=> (
                    <Flex key={i} align="center" justify="space-between" gap={2}>
                      <Text size={1}>• {m}</Text>
                      <Button text="見出し挿入" onClick={()=>insertH2(m)} />
                    </Flex>
                  ))}
                  </Stack>
                </Box>
              )}
              {coverage.missing.recommended.length>0 && (
                <Box>
                  <Text weight="semibold" size={1}>推奨</Text>
                  <Stack space={2} marginTop={1}>
                  {coverage.missing.recommended.map((m:string, i:number)=> (
                    <Flex key={i} align="center" justify="space-between" gap={2}>
                      <Text size={1}>• {m}</Text>
                      <Button text="見出し挿入" onClick={()=>insertH2(m)} />
                    </Flex>
                  ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Card>
        )}
        <Card padding={2} radius={2} tone="transparent">
          <Text muted size={1}>※ 現在はモックAPIで動作。実データへは環境変数で切替可能に設計します。</Text>
        </Card>
      </Stack>
    </Card>
  )
}
