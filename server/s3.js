// Filebase（s3.filebase.io）S3 客户端 —— 纯标准 SigV4，无 UA 校验
// 注意：Filebase 的 .io 与 .com 是两套不同存储空间，bucket 建在哪个就用哪个端点（当前用 .io）
//
// 环境变量：
//   CSTCLOUD_S3_ENDPOINT      端点，默认 https://s3.filebase.io
//   CSTCLOUD_S3_REGION        region，Filebase 固定 us-east-1（可覆盖）
//   CSTCLOUD_ACCESS_KEY       S3 Access Key（Filebase 控制台生成）
//   CSTCLOUD_SECRET_KEY       S3 Secret Key
//   CSTCLOUD_BUCKET           bucket 名称（私有桶即可：写用 presigned PUT，读用签名 GET 直链）
//   CSTCLOUD_FORCE_PATH_STYLE 是否用 path-style 寻址，Filebase 兼容 path-style，默认 true
const { S3Client } = require('@aws-sdk/client-s3');

const endpoint = process.env.CSTCLOUD_S3_ENDPOINT || 'https://s3.filebase.io';
const accessKey = process.env.CSTCLOUD_ACCESS_KEY || '';
const secretKey = process.env.CSTCLOUD_SECRET_KEY || '';

// 未配置密钥时也允许创建（启动不报错），直到真正上传时再给出明确错误
const credentials =
  accessKey && secretKey
    ? { accessKeyId: accessKey, secretAccessKey: secretKey }
    : undefined;

const s3 = new S3Client({
  region: process.env.CSTCLOUD_S3_REGION || 'us-east-1',
  endpoint,
  forcePathStyle: process.env.CSTCLOUD_FORCE_PATH_STYLE !== 'false',
  credentials,
  // 关闭自动附加 CRC32 校验：presigned PUT 由浏览器直发，无法带上 SDK 按空 body 算的 checksum，
  // 留着会让 S3 兼容服务因为校验和不匹配拒绝上传
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

const bucket = process.env.CSTCLOUD_BUCKET || '';

module.exports = { s3, bucket };
