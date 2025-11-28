# Frontend Documentation

## 📱 Giao Diện Web

Ứng dụng web đơn trang (SPA) được xây dựng bằng HTML5, CSS3 và Vanilla JavaScript.

## 🏗️ Cấu Trúc Thư Mục

```
public/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styling
└── js/
    └── app.js          # Application logic
```

## 📋 Tính Năng

### 1. Tab "Lưu Khuôn Mặt"
- Nhập ID duy nhất cho người dùng
- Nhập thông tin metadata (Tên, Email)
- Chọn ảnh khuôn mặt
- Xem trước ảnh trước khi lưu
- Lưu khuôn mặt vào hệ thống

**API Endpoint:**
```
POST /api/face/embed
```

**Request:**
```json
{
  "id": "user_123",
  "image_base64": "data:image/jpeg;base64,...",
  "metadata": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 2. Tab "Tìm Kiếm"
- Chọn ảnh để tìm kiếm
- Điều chỉnh số kết quả (TopK)
- Xem kết quả tìm kiếm được sắp xếp theo độ tương tự
- Hiển thị khoảng cách (distance) và phần trăm tương tự

**API Endpoint:**
```
POST /api/face/search
```

**Request:**
```json
{
  "image_base64": "data:image/jpeg;base64,...",
  "topK": 5,
  "filter": ""
}
```

### 3. Tab "Trạng Thái"
- Kiểm tra trạng thái server
- Xem thời gian phản hồi API
- Xem lần cập nhật gần nhất
- Làm mới thông tin trạng thái

## 🎨 Thiết Kế

### Màu Sắc
- Primary: `#6366f1` (Indigo)
- Secondary: `#ec4899` (Pink)
- Success: `#10b981` (Green)
- Danger: `#ef4444` (Red)
- Warning: `#f59e0b` (Amber)

### Responsive Design
- Desktop-first design
- Hỗ trợ mobile (≤768px)
- Hỗ trợ tablet

## 🚀 Chạy Frontend

Frontend tự động được serve bởi Express.js từ thư mục `public`:

```bash
npm run dev        # Development mode
npm start          # Production mode
```

Truy cập: `http://localhost:3000` (hoặc PORT đã cấu hình)

## 📝 File Chính

### index.html
- Bố cục HTML semantic
- Chia thành 3 tab chính
- Form input với validation
- Image preview
- Status messages
- Results display

### css/style.css
- CSS Variables cho theming
- Flexbox & Grid layout
- Smooth animations
- Mobile responsive
- Accessibility features

### js/app.js
- Tab switching logic
- Image to Base64 conversion
- API communication
- Error handling
- Status updates
- Health check monitoring

## 🔗 API Integration

Frontend kết nối với backend API thông qua:
- Base URL: `window.location.origin + '/api'`
- Endpoints:
  - `POST /api/face/embed` - Lưu khuôn mặt
  - `POST /api/face/search` - Tìm kiếm
  - `GET /health` - Kiểm tra trạng thái

## 💾 Browser Storage

Hiện tại không sử dụng Local Storage (có thể thêm sau).

## ♿ Accessibility

- Semantic HTML (`header`, `nav`, `main`, `footer`)
- Form labels linked to inputs
- ARIA attributes (có thể thêm)
- Keyboard navigation support
- Color contrast compliant

## 🐛 Error Handling

Tất cả lỗi được hiển thị với thông báo rõ ràng:
- Network errors
- API errors
- Validation errors
- Status messages

## 🔄 Auto-refresh

- Health check mỗi 30 giây
- Automatic status update
- Real-time server status

## 📱 Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🎯 Future Enhancements

- [ ] Drag-and-drop file upload
- [ ] Camera capture support
- [ ] Result export (CSV/JSON)
- [ ] Search history
- [ ] Advanced filters
- [ ] Real-time notifications
- [ ] User authentication
- [ ] Multi-language support

## 📞 Troubleshooting

### Ảnh không xem trước được
- Kiểm tra file format (JPG, PNG, etc.)
- Kiểm tra file size

### Tìm kiếm không hoạt động
- Kiểm tra server đang chạy
- Kiểm tra Redux service
- Kiểm tra embedding service

### Status luôn Offline
- Kiểm tra server port
- Kiểm tra firewall settings
- Kiểm tra browser console errors

## 📄 License

ISC
