import React, {useState} from 'react'
import type {ObjectInputProps} from 'sanity'
import {useFormValue, PatchEvent, set, insert} from 'sanity'
import {Card, Stack, Text, TextInput, Flex, Button, useToast} from '@sanity/ui'

export function AssistantBlock(props: ObjectInputProps) {
  const {onChange, path, value} = props
  const toast = useToast()
  const body = useFormValue(['body']) as any[] | undefined
  const [h2, setH2] = useState('セクション見出し')

  const findIndex = () => {
    const key = (value as any)?._key
    if (!key || !Array.isArray(body)) return -1
    return (body as any[]).findIndex((b:any) => b && b._key === key)
  }

  const insertAfter = (nodes: any[]) => {
    if (typeof onChange !== 'function') return
    const idx = findIndex()
    const key = (value as any)?._key
    if (idx >= 0 && key) {
      // 安全なキー基準での相対挿入（Sanityのinsert()を使用）
      onChange(PatchEvent.from(insert(nodes, 'after', ['body', { _key: key }])))
    } else {
      // 万一キーが無い場合は末尾に上書き
      const arr = Array.isArray(body) ? [...body] : []
      const next = [...arr, ...nodes]
      onChange(PatchEvent.from(set(next, ['body'])))
    }
    try {
      const at = Math.min((Array.isArray(body)? body.length: 0)+1, findIndex()+1+nodes.length)
      ;(props as any).onPathFocus?.(['body', at-1])
      toast.push({status:'success', title:`本文に挿入しました（このブロック直後）`})
    } catch {}
  }

  const insertH2 = () => {
    insertAfter([{ _type:'block', style:'h2', markDefs:[], children:[{_type:'span', text:h2, marks:[]}]}])
  }

  const insertFAQ = () => {
    const nodes = [
      { _type:'block', style:'h2', markDefs:[], children:[{_type:'span', text:'よくある質問（FAQ）', marks:[]} ]},
      { _type:'block', style:'h3', markDefs:[], children:[{_type:'span', text:'Q1: 何をすれば良い？', marks:[]} ]},
      { _type:'block', style:'normal', markDefs:[], children:[{_type:'span', text:'（回答をここに記入）', marks:[]} ]},
    ]
    insertAfter(nodes)
  }

  return (
    <Card padding={3} tone="caution" radius={2} style={{lineHeight:1.6}}>
      <Stack space={3}>
        <Text size={1} weight="semibold">挿入ツール（このブロックの直後に追加されます）</Text>
        <Text muted size={1}>挿入後は右上の Publish を押さないとフロントに反映されません。</Text>
        <Flex gap={2} align="center" wrap="wrap">
          <TextInput value={h2} onChange={(e)=>setH2(e.currentTarget.value)} style={{minWidth:260}} />
          <Button text="H2を挿入" tone="primary" onClick={insertH2} />
          <Button text="FAQ雛形" onClick={insertFAQ} />
        </Flex>
        <Text muted size={1}>本文の任意位置にこのブロックを配置して使います。用が済んだらこのブロック自体は削除してOKです。</Text>
      </Stack>
    </Card>
  )
}
