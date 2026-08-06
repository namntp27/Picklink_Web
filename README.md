# Picklink Web

Monorepo frontend gồm ba React/Vite web app độc lập, cùng kết nối với API ASP.NET Core
tại `../PicklinkBackend/PicklinkBackend`:

- Player Web: trải nghiệm công khai và nghiệp vụ người chơi.
- Owner Web: vận hành chủ sân và workspace nhân viên sân.
- Admin Web: quản trị nền tảng.

Ba app dùng chung auth, API client, UI component và domain types trong `src`, nhưng có
router, dev server và build artifact riêng.

## Chạy local

Yêu cầu: Node.js, .NET 8 SDK, SQL Server và database `SportsPlatformDB`.

Terminal 1 — backend:

```powershell
cd D:\SEP490pass\PicklinkBackend
dotnet run --project PicklinkBackend\PicklinkBackend.csproj --launch-profile http
```

Backend mặc định chạy tại `http://localhost:5209`.

Mở Player Web:

```powershell
cd D:\SEP490pass\Picklink_Web
npm install
npm run dev:player
```

Mở `http://localhost:3000`.

Owner Web và Admin Web chạy ở terminal riêng khi cần:

```powershell
npm run dev:owner
npm run dev:admin
```

- Player Web: `http://localhost:3000`
- Owner Web: `http://localhost:3001`
- Admin Web: `http://localhost:3002`

Trong môi trường dev, cả ba Vite server tự chuyển tiếp `/api` và `/uploads` sang backend
nên không cần tạo `.env`.

## Cấu trúc source

Entry point của từng web app nằm trong `apps/player`, `apps/owner` và `apps/admin`.
Mã nguồn dùng chung nằm trong `src`.

- `apps/*/index.html`: HTML entry riêng.
- `apps/*/src/main.tsx`: mount app qua provider dùng chung.
- `apps/*/src/*App.tsx`: router chỉ chứa route thuộc đúng web app.
- `src/apps`: bootstrap và app frame dùng chung.

- `src/pages`: route-level pages. Mỗi file ở đây nên tương ứng với một màn hình
  hoặc một route chính.
- `src/components`: component dùng lại giữa nhiều page.
- `src/components/ui`: UI primitive như button, input, dropdown, toast.
- `src/api`: client gọi backend và type response/request gắn với API.
- `src/auth`: context đăng nhập và route guard.
- `src/hooks`: hook dùng chung, đặc biệt là realtime/SSE hooks.
- `src/data`: dữ liệu mock, formatter hoặc helper dữ liệu phía giao diện.
- `src/types`: type domain dùng chung.
- `src/utils`: helper thuần không phụ thuộc UI.

Project đã cấu hình alias `@`, nên khi chỉnh file có thể ưu tiên import kiểu
`@/api/client` hoặc `@/components/ui/Button` thay vì relative path quá sâu.
Không cần rewrite toàn bộ import trong một lần.

## Cấu hình Google

Trong Google Cloud Console, tạo OAuth 2.0 Client ID loại **Web application** và thêm JavaScript origin:

```text
http://localhost:3000
http://localhost:3001
http://localhost:3002
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

Mỗi app tạo artifact riêng:

```powershell
npm run build:player
npm run build:owner
npm run build:admin
```

Kết quả lần lượt nằm ở `dist/player`, `dist/owner` và `dist/admin`. Lệnh
`npm run build` sẽ tạo đủ cả ba. Mỗi host phải rewrite route SPA về `index.html`.

Khi deploy trên ba origin khác nhau, thêm đủ ba origin vào:

- `Cors:AllowedOrigins` của backend;
- Authorized JavaScript origins của Google OAuth.

Phiên đăng nhập hiện lưu trong `localStorage`, vì vậy không tự chia sẻ giữa các origin.
Người dùng đăng nhập riêng ở đúng web app; không truyền JWT qua URL.

## Kiểm tra

```powershell
npm run lint
npm test
npm run build
```

## Ứng viên dọn cấu trúc Phase 2

Các page lớn nên được tách dần thành container + component/hook nhỏ hơn khi có
thay đổi nghiệp vụ liên quan:

- `src/pages/clubs/ClubDashboard.tsx`
- `src/pages/messages/Messages.tsx`
- `src/pages/matches/MatchDetail.tsx`
- `src/pages/matches/Opponents.tsx`
- `src/pages/community/CreatePost.tsx`
- `src/pages/community/PostDetail.tsx`

Ưu tiên đặt component chỉ dùng trong một feature vào `components/` bên trong
feature đó trước khi đưa lên `src/components`.
