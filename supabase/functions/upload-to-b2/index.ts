import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";

const B2_KEY_ID = Deno.env.get("B2_KEY_ID");
const B2_APPLICATION_KEY = Deno.env.get("B2_APPLICATION_KEY");
const B2_S3_ENDPOINT = Deno.env.get("B2_S3_ENDPOINT");
const B2_BUCKET_NAME = Deno.env.get("B2_BUCKET_NAME");
const B2_PUBLIC_URL = Deno.env.get("B2_PUBLIC_URL");

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
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;
    const contentType = formData.get('contentType') as string;

    if (!file || !filename) {
      return new Response(
        JSON.stringify({ error: 'Missing file or filename' }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const fileBuffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME!,
      Key: filename,
      Body: new Uint8Array(fileBuffer),
      ContentType: contentType || "video/mp4"
    });

    await s3.send(command);

    // Construct the public URL using S3 path-hosted style
    let publicUrl: string;

    if (B2_PUBLIC_URL && B2_PUBLIC_URL.trim()) {
      // Use the explicitly configured public URL (preferred)
      // B2_PUBLIC_URL should be the S3 endpoint: https://s3.region.backblazeb2.com
      const publicBase = B2_PUBLIC_URL.replace(/\/$/, '');
      publicUrl = `${publicBase}/${B2_BUCKET_NAME}/${filename}`;
    } else if (B2_BUCKET_NAME && B2_S3_ENDPOINT) {
      // Fallback: construct S3 path-hosted style URL (recommended by Backblaze)
      // Format: https://s3.region.backblazeb2.com/bucket-name/key
      const endpointDomain = B2_S3_ENDPOINT.replace(/^https?:\/\//, '').replace(/\/$/, '');
      publicUrl = `https://${endpointDomain}/${B2_BUCKET_NAME}/${filename}`;
    } else {
      // Last resort fallback
      console.error('B2_PUBLIC_URL and fallback endpoint unavailable');
      publicUrl = `https://s3.eu-central-003.backblazeb2.com/${B2_BUCKET_NAME}/${filename}`;
    }

    // Validate the URL to prevent undefined or malformed URLs
    if (publicUrl.includes('undefined') || publicUrl.includes('null')) {
      console.error('Invalid URL constructed:', publicUrl);
      return new Response(
        JSON.stringify({
          error: 'Failed to construct valid public URL. Configuration may be incomplete.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        publicUrl,
        filename
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Upload failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
