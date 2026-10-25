# Smart Hospital - Hệ thống Quản lý Bệnh viện Thông minh

Dự án này bao gồm hệ thống ứng dụng web giúp quản lý hàng đợi, đặt lịch khám và hồ sơ bệnh nhân, chia làm 2 phân hệ chính.

## 📂 Cấu trúc dự án

Dự án được tổ chức với thư mục `apps` chứa các ứng dụng độc lập:

```text
├── apps
│   ├── patient-app  # Ứng dụng dành cho bệnh nhân (Mobile Web App)
│   └── staff-web    # Ứng dụng dành cho nhân viên y tế (Desktop Web)
├── .gitignore
└── README.md
```

* **Patient App**: Giúp bệnh nhân xem số thứ tự trực tiếp, đặt lịch khám, lấy số tại ki-ốt, và quản lý hồ sơ người thân.
* **Staff Web**: Giúp nhân viên y tế / bác sĩ quản lý danh sách chờ, gọi bệnh nhân, quản lý bệnh án và các dịch vụ chỉ định.

## 💻 Yêu cầu hệ thống

* **Node.js**: Phiên bản 18.x hoặc 20.x trở lên.
* **Trình quản lý gói**: Dự án hỗ trợ `npm` hoặc `pnpm`.

## 🚀 Hướng dẫn cài đặt và khởi chạy

Sau khi clone repository này về máy:
```bash
> git clone https://github.com/uyentrn/smart-hospital-queue.git

> cd ten-repo
```

Cài đặt và khởi chạy độc lập từng ứng dụng như sau:

### 1. Chạy Ứng dụng Bệnh nhân (Patient App)

Mở một terminal mới và di chuyển vào thư mục của app bệnh nhân:
```bash
cd apps/patient-app
```

Cài đặt các gói phụ thuộc (dependencies):
```bash
npm install
```
hoặc nếu bạn dùng pnpm:
```pnpm install```

Khởi chạy môi trường phát triển (Development Server):
```bash
npm run dev
```
hoặc: 
```pnpm dev```

> Mặc định ứng dụng sẽ chạy trên `http://localhost:5173`. Mở trình duyệt với kích thước màn hình điện thoại (DevTools) để có trải nghiệm tốt nhất.

### 2. Chạy Ứng dụng Nhân viên (Staff Web)

Mở thêm một tab terminal mới và di chuyển vào thư mục của app nhân viên:
```bash
cd apps/staff-web
```

Cài đặt các gói phụ thuộc:
```bash
npm install
```
hoặc: ```pnpm install```

Khởi chạy môi trường phát triển:
```bash
npm run dev
```
hoặc: ```pnpm dev```

> Mặc định ứng dụng sẽ chạy trên `http://localhost:5174`.

## 🛠 Công nghệ sử dụng

* **Framework**: React 19 + TypeScript
* **Build Tool**: Vite 8
* **Styling**: Tailwind CSS v4
* **Icons**: Lucide React

## Lưu ý:
2 phiên bản trên hiện đang sử dụng mock data và không đồng bộ với nhau