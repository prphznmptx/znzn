import { createClient } from 'npm:@supabase/supabase-js';

const MUX_WEBHOOK_SECRET = Deno.env.get("MUX_WEBHOOK_SECRET");

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const data = await req.json();

  if (data.type === 'video.asset.ready') {
    const assetId = data.data.id;
    const playbackId = data.data.playback_ids?.[0]?.id;

    if (!playbackId) {
      return new Response(JSON.stringify({ error: 'Missing playback ID' }), { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('video_uploads')
      .update({
        playback_id: playbackId,
        status: 'ready'
      })
      .eq('asset_id', assetId);

    if (error) {
      console.error("Database update error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    console.log(`Video Asset ${assetId} is ready with playback ID ${playbackId}.`);

    return new Response(JSON.stringify({
      status: 'success',
      assetId,
      playbackId
    }), { status: 200 });
  }

  return new Response(JSON.stringify({ status: `ignored event type: ${data.type}` }), { status: 200 });
});
