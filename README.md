# Face Recognition Backend API

Express.js REST API server cho hệ thống nhận diện khuôn mặt sử dụng Redis Vector Search.

## 📋 Yêu cầu

- Node.js 18+
- Redis 6.0+ (với RedisSearch module)
- Embedding Service (Python service tại port 1301)

## 🚀 Cài đặt

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Cấu hình Environment

Tạo file `.env` từ `.env.sample`:

```bash
cp env.sample .env
```

Cập nhật các giá trị theo cấu hình của bạn:

```env
PORT=3000
NODE_ENV=development
REDIS_URI=redis://localhost:6379
EMBEDDING_SERVICE_URL=http://127.0.0.1:1301
```

### 3. Build Project

```bash
npm run build
```

## 🏃 Chạy Server

### Development Mode (với auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## 📚 API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Embed Face (Lưu khuôn mặt)

```http
POST /api/face/embed
Content-Type: application/json

{
  "id": "user_123",
  "image_base64": "data:image/jpeg;base64,...",
  "metadata": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Response:**
```json
{
  "message": "Face embedded and stored successfully",
  "id": "user_123",
  "embeddingDim": 512
}
```

### Search Similar Faces

```http
POST /api/face/search
Content-Type: application/json

{
  "image_base64": "data:image/jpeg;base64,...",
  "topK": 5,
  "filter": ""
}
```

**Response:**
```json
{
  "message": "Search completed",
  "count": 3,
  "topK": 5,
  "results": [
    {
      "id": "face:user_123:0",
      "content": "Face embedding for user_123",
      "docId": "user_123",
      "chunkId": 0,
      "distance": 0.15
    }
  ]
}
```

### Get Face by ID

```http
GET /api/face/:id
```

### Delete Face

```http
DELETE /api/face/:id
```

## 📁 Project Structure

```
src/
├── app.ts                      # Express app configuration
├── index.ts                    # Entry point, start server
├── router.ts                   # Route definitions
├── controller/
│   └── face.controller.ts      # Face API handlers
├── services/
│   ├── redis.service.ts        # Redis vector search
│   └── embedding.service.ts    # Embedding service client
└── utils/
    └── config.util.ts          # Environment config
```

## 🔧 Available Scripts

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check format
npm run format:check

# Clean dist folder
npm run clean
```

## 🏗️ Architecture

### EmbeddingService
- Tương tác với Python embedding service
- Hỗ trợ base64 encoded images
- Trả về Float32Array embeddings

### RedisClient (Singleton)
- Kết nối Redis với Vector Search
- Tạo/quản lý vector indices
- Thực hiện KNN search

### FaceController
- Xử lý face embedding requests
- Thực hiện face search
- Quản lý face metadata

## 🔐 Error Handling

Tất cả errors được xử lý thông qua middleware:

```json
{
  "error": "Error message here",
  "stack": "... (development mode only)"
}
```

## 📝 Development

### TypeScript Configuration

- Target: ES2022
- Strict mode enabled
- Source maps enabled

### ESLint & Prettier

Code được format tự động với Prettier và lint với ESLint.

Format code trước khi commit:
```bash
npm run format
npm run lint:fix
```

## 🚀 Deployment

1. Build project: `npm run build`
2. Cài dependencies: `npm ci --only=production`
3. Set environment variables
4. Start server: `npm start`

## 📞 Troubleshooting

### Redis Connection Failed
- Kiểm tra Redis service đang chạy
- Verify REDIS_URI trong .env

### Embedding Service Not Responding
- Kiểm tra Python embedding service đang chạy
- Verify EMBEDDING_SERVICE_URL trong .env

### TypeScript Errors
- Chạy `npm run build` để kiểm tra
- Chạy `npm run lint` để kiểm tra linting issues

## 📄 License

ISC
