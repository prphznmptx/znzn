import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";

const B2_KEY_ID = Deno.env.get("B2_KEY_ID");
const B2_APPLICATION_KEY = Deno.env.get("B2_APPLICATION_KEY");
const B2_S3_ENDPOINT = Deno.env.get("B2_S3_ENDPOINT");
const B2_BUCKET_NAME = Deno.env.get("B2_BUCKET_NAME");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const s3 = new S3Client({
  region: "eu-central-003",
  endpoint: B2_S3_ENDPOINT,
  credentials: {
    accessKeyId: B2_KEY_ID!,
    secretAccessKey: B2_APPLICATION_KEY!
  }
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const { filename, contentType } = await req.json();

    if (!filename) {
      return new Response(JSON.stringify({ error: 'Missing filename' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME!,
      Key: filename,
      ContentType: contentType ?? "video/mp4"
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 900
    });

    return new Response(JSON.stringify({ signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to generate signed URL'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
