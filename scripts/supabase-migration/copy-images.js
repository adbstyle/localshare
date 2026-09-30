// Copies all objects from the source S3 bucket (R2) to the target (Supabase Storage).
// Idempotent: skips keys that already exist in the target with the same size.
// Env: SRC_ENDPOINT SRC_REGION SRC_BUCKET SRC_KEY SRC_SECRET, DST_ENDPOINT DST_REGION DST_BUCKET DST_KEY DST_SECRET
const req = require('module').createRequire(require('path').join(__dirname, '../../apps/backend/package.json'));
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = req('@aws-sdk/client-s3');
const e = process.env;
const src = new S3Client({ region: e.SRC_REGION, endpoint: e.SRC_ENDPOINT, credentials: { accessKeyId: e.SRC_KEY, secretAccessKey: e.SRC_SECRET } });
const dst = new S3Client({ region: e.DST_REGION, endpoint: e.DST_ENDPOINT, forcePathStyle: true, credentials: { accessKeyId: e.DST_KEY, secretAccessKey: e.DST_SECRET } });

async function listAll(client, Bucket) {
  const objects = new Map();
  let ContinuationToken;
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket, ContinuationToken }));
    (page.Contents || []).forEach((o) => objects.set(o.Key, o.Size));
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return objects;
}

(async () => {
  const [source, target] = await Promise.all([listAll(src, e.SRC_BUCKET), listAll(dst, e.DST_BUCKET)]);
  let copied = 0, skipped = 0, failed = 0;
  for (const [Key, size] of source) {
    if (target.get(Key) === size) { skipped++; continue; }
    try {
      const obj = await src.send(new GetObjectCommand({ Bucket: e.SRC_BUCKET, Key }));
      const Body = Buffer.from(await obj.Body.transformToByteArray());
      await dst.send(new PutObjectCommand({ Bucket: e.DST_BUCKET, Key, Body, ContentType: obj.ContentType || 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable' }));
      copied++;
    } catch (err) { failed++; console.log('FAIL', Key, err.name, err.message); }
  }
  const after = await listAll(dst, e.DST_BUCKET);
  const missing = [...source.keys()].filter((k) => after.get(k) !== source.get(k));
  console.log(JSON.stringify({ sourceObjects: source.size, copied, skipped, failed, targetObjects: after.size, missingOrSizeMismatch: missing.length }));
  if (missing.length || failed) process.exit(1);
})().catch((err) => { console.log('ERROR', err.name, err.message); process.exit(1); });
