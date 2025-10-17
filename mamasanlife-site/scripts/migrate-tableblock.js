#!/usr/bin/env node
const { createClient } = require('@sanity/client')

const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || process.env.SANITY_AUTH_TOKEN

if (!projectId || !token){
  console.error('Set SANITY_PROJECT_ID and SANITY_WRITE_TOKEN')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion:'2025-09-01', useCdn:false, token })

async function run(){
  const docs = await client.fetch(`*[_type=='post' && defined(body) && count(body[_type=='tableBlock'])>0]{_id, body}`)
  let changed=0
  for (const d of docs){
    let dirty=false
    const body = (d.body||[]).map(b=>{
      if (b?._type==='tableBlock' && Array.isArray(b.rows) && Array.isArray(b.rows[0])){
        dirty=true
        return { ...b, rows: b.rows.map(cells=>({ cells })) }
      }
      return b
    })
    if (dirty){
      await client.patch(d._id).set({ body }).commit()
      changed++
      console.log('migrated', d._id)
    }
  }
  console.log('done, migrated', changed)
}

run().catch(e=>{ console.error(e); process.exit(1) })

