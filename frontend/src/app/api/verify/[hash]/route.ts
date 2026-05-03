import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/verify/:hash — 验证内容哈希
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params

  if (!hash || hash.length < 5) {
    return Response.json({ error: 'Invalid hash' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('stamps')
    .select('*')
    .eq('content_hash', hash)
    .order('block_timestamp', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return Response.json({
      verified: false,
      message: 'This content hash has not been stamped on the blockchain yet.',
      stamps: [],
    })
  }

  return Response.json({
    verified: true,
    message: `Found ${data.length} stamp record(s) for this content hash.`,
    count: data.length,
    stamps: data,
  })
}
