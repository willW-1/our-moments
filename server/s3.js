// 中国科技云数据胶囊（CSTCloud Data Capsule）S3 客户端
//
// 环境变量：
//   CSTCLOUD_S3_ENDPOINT      端点，默认 https://s3.cstcloud.cn
//   CSTCLOUD_S3_REGION        region，数据胶囊面板里通常不区分 region，填 us-east-1 即可（可覆盖）
//   CSTCLOUD_ACCESS_KEY       S3 Access Key（数据空间面板「客户端访问」里生成）
//   CSTCLOUD_SECRET_KEY       S3 Secret Key
//   CSTCLOUD_BUCKET           你的 bucket 名称
//   CSTCLOUD_FORCE_PATH_STYLE 是否用 path-style 寻址，兼容服务默认 true
const { S3Client } = require('@aws-sdk/client-s3');

const endpoint = process.env.CSTCLOUD_S3_ENDPOINT || 'https://s3.cstcloud.cn';
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
