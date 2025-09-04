// Centralized AWS clients (SDK v3)
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const region = process.env.AWS_REGION;

const s3 = new S3Client({ region });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

module.exports = {
  s3,
  PutObjectCommand,
  DeleteObjectCommand,
  ddb,
  PutCommand,
  ScanCommand,
  GetCommand,
  DeleteCommand,
  getSignedUrl
};
