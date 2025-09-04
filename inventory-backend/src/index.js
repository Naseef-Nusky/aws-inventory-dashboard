const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const path = require("path");

dotenv.config();

const {
  s3,
  PutObjectCommand,
  DeleteObjectCommand,
  ddb,
  PutCommand,
  ScanCommand,
  GetCommand,
  DeleteCommand,
  getSignedUrl
} = require("./aws");

const app = express();
app.use(cors());
app.use(express.json());

// Multer (memory) for multipart form-data
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 5000;
const BUCKET = process.env.S3_BUCKET;
const TABLE = process.env.DDB_TABLE;
const PRESIGN_EXPIRES_SECONDS = Number(process.env.PRESIGN_EXPIRES_SECONDS || 3600);

app.get("/", (_req, res) => {
  res.send("Inventory API is running!");
});

/**
 * POST /products
 * multipart/form-data:
 * - name (string)
 * - quantity (number)
 * - price (number)
 * - image (file, optional)
 */
app.post("/products", upload.single("image"), async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    if (!name || quantity == null || price == null) {
      return res.status(400).json({ error: "name, quantity, price are required" });
    }

    const id = uuid();
    let imageKey = null;

    if (req.file) {
      const ext = path.extname(req.file.originalname) || ".bin";
      imageKey = `products/${id}/${Date.now()}${ext}`;

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }));
    }

    const item = {
      id,
      name,
      quantity: Number(quantity),
      price: Number(price),
      imageKey
    };

    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: item
    }));

    // Pre-sign URL if there is an image
    let imageUrl = null;
    if (imageKey) {
      imageUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: BUCKET, Key: imageKey }), // Not for GET! fix below
        { expiresIn: PRESIGN_EXPIRES_SECONDS }
      );
    }

    // Correction: pre-sign GET URL (not PUT)
    if (imageKey) {
      const { GetObjectCommand } = require("@aws-sdk/client-s3");
      imageUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: imageKey }),
        { expiresIn: PRESIGN_EXPIRES_SECONDS }
      );
    }

    res.status(201).json({ ...item, imageUrl });
  } catch (err) {
    console.error("POST /products error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /products
 */
app.get("/products", async (_req, res) => {
  try {
    const data = await ddb.send(new ScanCommand({ TableName: TABLE }));
    const items = data.Items || [];

    // Attach signed URLs for each item that has imageKey
    const { GetObjectCommand } = require("@aws-sdk/client-s3");

    const withUrls = await Promise.all(items.map(async (it) => {
      if (it.imageKey) {
        const url = await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: BUCKET, Key: it.imageKey }),
          { expiresIn: PRESIGN_EXPIRES_SECONDS }
        );
        return { ...it, imageUrl: url };
      }
      return it;
    }));

    res.json(withUrls);
  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE /products/:id
 * - removes item from DynamoDB
 * - if imageKey exists, delete from S3
 */
app.delete("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // fetch item first to get imageKey
    const getResp = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { id }
    }));

    const item = getResp.Item;

    await ddb.send(new DeleteCommand({
      TableName: TABLE,
      Key: { id }
    }));

    if (item && item.imageKey) {
      await s3.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: item.imageKey
      }));
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /products/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
/**
 * PUT /products/:id
 * multipart/form-data:
 * - name (string, optional)
 * - quantity (number, optional)
 * - price (number, optional)
 * - image (file, optional)
 */
app.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const id = req.params.id;
    const { name, quantity, price } = req.body;

    // Fetch existing item
    const getResp = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { id }
    }));

    const item = getResp.Item;
    if (!item) return res.status(404).json({ error: "Product not found" });

    let imageKey = item.imageKey;

    // If new image is uploaded, replace it
    if (req.file) {
      // Delete old image from S3
      if (imageKey) {
        await s3.send(new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: imageKey
        }));
      }

      const ext = path.extname(req.file.originalname) || ".bin";
      imageKey = `products/${id}/${Date.now()}${ext}`;

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }));
    }

    // Prepare updated item
    const updatedItem = {
      ...item,
      name: name ?? item.name,
      quantity: quantity != null ? Number(quantity) : item.quantity,
      price: price != null ? Number(price) : item.price,
      imageKey
    };

    // Update in DynamoDB
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: updatedItem
    }));

    // Generate signed URL if image exists
    let imageUrl = null;
    if (imageKey) {
      const { GetObjectCommand } = require("@aws-sdk/client-s3");
      imageUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: imageKey }),
        { expiresIn: PRESIGN_EXPIRES_SECONDS }
      );
    }

    res.json({ ...updatedItem, imageUrl });
  } catch (err) {
    console.error("PUT /products/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
