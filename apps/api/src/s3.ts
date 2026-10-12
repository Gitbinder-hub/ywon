/** S3/R2 live helpers — healthcheck only. No secrets in code. */
export function s3Configured(): boolean {
  return !!(process.env['S3_ENDPOINT'] && process.env['S3_BUCKET'] && process.env['S3_ACCESS_KEY_ID'] && process.env['S3_SECRET_ACCESS_KEY']);
}

export async function checkS3(): Promise<{ ok: boolean; error?: string }> {
  if (!s3Configured()) return { ok: false, error: 'S3 not configured' };
  try {
    const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3' as unknown as string) as unknown as {
      S3Client: new (opts: unknown) => { send(cmd: unknown): Promise<unknown> };
      PutObjectCommand: new (o: unknown) => unknown;
      GetObjectCommand: new (o: unknown) => unknown;
      DeleteObjectCommand: new (o: unknown) => unknown;
    };
    // Lazy: import may fail in offline env
    const client = new S3Client({
      region: 'auto',
      endpoint: process.env['S3_ENDPOINT']!,
      credentials: { accessKeyId: process.env['S3_ACCESS_KEY_ID']!, secretAccessKey: process.env['S3_SECRET_ACCESS_KEY']! },
    });
    const bucket = process.env['S3_BUCKET']!;
    const key = 'healthcheck/live.txt';
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: Buffer.from('healthcheck') }));
    await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return { ok: true };
  } catch (e) {
    // Fallback to python helper if @aws-sdk not installed — probe via health_check.py semantics
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Cannot find package") || msg.includes("ERR_MODULE_NOT_FOUND")) {
      return { ok: false, error: 'S3 SDK not installed (use python scripts/health_check.py for live probe)' };
    }
    return { ok: false, error: msg };
  }
}
