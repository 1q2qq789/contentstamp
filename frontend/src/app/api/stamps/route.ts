import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/stamps — 记录存证
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content_hash, uri, author_name, author_address, tx_hash, block_number, block_timestamp, network } = body

    if (!content_hash || !tx_hash) {
      return Response.json({ error: 'content_hash and tx_hash are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('stamps')
      .insert({
        content_hash,
        uri,
        author_name,
        author_address,
        tx_hash,
        block_number: block_number ? parseInt(block_number) : null,
        block_timestamp: block_timestamp || null,
        network: network || 'base',
      })
      .select()
      .single()

    if (error) {
      // 如果是重复 tx_hash
      if (error.code === '23505') {
        return Response.json({ error: 'This transaction has already been recorded' }, { status: 409 })
      }
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(data, { status: 201 })
  } catch (e) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// GET /api/stamps — 查询存证记录
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hash = searchParams.get('hash')
  const address = searchParams.get('address')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase.from('stamps').select('*')

  if (hash) {
    query = query.eq('content_hash', hash)
  }

  if (address) {
    query = query.eq('author_address', address)
  }

  query = query.order('block_timestamp', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data, count })
}
