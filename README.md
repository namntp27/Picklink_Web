# Picklink Web

Frontend React/Vite kết nối với API ASP.NET Core tại `../PicklinkBackend/PicklinkBackend`.

## Chạy local

Yêu cầu: Node.js, .NET 8 SDK, SQL Server và database `SportsPlatformDB`.

Terminal 1 — backend:

```powershell
cd D:\SEP490pass\PicklinkBackend
dotnet run --project PicklinkBackend\PicklinkBackend.csproj --launch-profile http
```

Backend mặc định chạy tại `http://localhost:5209`.

Terminal 2 — frontend:

```powershell
cd D:\SEP490pass\Picklink_Web
npm install
npm run dev
```

Mở `http://localhost:3000`. Trong môi trường dev, Vite tự chuyển tiếp `/api` và `/uploads` sang backend nên không cần tạo `.env`.

## Cấu hình Google

Trong Google Cloud Console, tạo OAuth 2.0 Client ID loại **Web application** và thêm JavaScript origin:

```text
http://localhost:3000
```

Client ID phải giống nhau ở hai nơi:

- Frontend: `VITE_GOOGLE_CLIENT_ID` trong `.env.local`.
- Backend: `Authentication:Google:ClientId` trong `appsettings.Development.json` hoặc biến môi trường tương ứng.

Sau khi đổi Client ID hoặc `.env.local`, khởi động lại cả frontend và backend.

## Bản đồ địa chỉ sân

Form tạo và sửa cụm sân dùng Leaflet + OpenStreetMap, không cần API key. Tìm kiếm và lấy tên địa chỉ sử dụng Nominatim; người dùng cũng có thể bấm bản đồ, kéo marker hoặc dùng vị trí hiện tại.

Khi triển khai với lượng truy cập lớn, nên dùng nhà cung cấp geocoding/tile riêng hoặc tự vận hành dịch vụ thay vì phụ thuộc endpoint Nominatim công cộng.

## Cấu hình deploy

Sao chép `.env.example` thành `.env.local` khi cần đổi địa chỉ API. Với frontend và backend deploy ở hai domain khác nhau, đặt:

```env
VITE_API_BASE_URL="https://api.example.com"
```

Domain frontend cũng cần được cho phép trong CORS của backend.

## Kiểm tra

```powershell
npm run lint
npm run build
```
