# Tài Liệu Kỹ Thuật: Tổng Hợp Các Tính Năng Hệ Thống Quản Trị (Admin Panel) — Venix Watch

Tài liệu này tổng hợp chi tiết toàn bộ các tính năng, phân hệ quản trị, cơ chế bảo mật và giao diện cấu hình đã được thiết lập và vận hành trên hệ thống Admin Panel của Venix Watch. 

---

## 1. Cấu Trúc Tổng Quan & Cơ Chế Vận Hành Core

Hệ thống Admin Panel là một ứng dụng Single Page Application (SPA) chạy trong phân vùng giao diện quản trị (`#admin-root`), được thiết kế để phân tách độc lập với giao diện Client.

*   **Cơ chế xác thực & Bảo mật:**
    *   Hệ thống sử dụng JWT Token (`localStorage` lưu trữ dưới khóa `dhat_token` hoặc `AUTH_TOKEN`) để xác minh phiên làm việc.
    *   Mỗi khi khởi tạo ứng dụng Admin ([index.js](file:///h:/venixwatch/frontend/src/pages/Admin/index.js)), hệ thống tự động gọi API `/api/admin/dashboard/stats` để kiểm tra tính hợp lệ của Token trước khi cho phép truy cập.
*   **Tải cấu hình & Dynamic Theme:**
    *   Ngay khi khởi động, Admin Panel tải toàn bộ cấu hình từ API `/api/settings`.
    *   Hệ thống tự động đồng bộ tiêu đề trang (`Admin — ${brand_name}`) và tiêm các biến CSS màu sắc giao diện (`theme_colors`) vào thẻ `:root` của DOM để đổi màu chủ đạo (ví dụ màu vàng thương hiệu `#C9A84C`) đồng bộ với giao diện người dùng.
*   **Bố cục Giao diện (Layout Shell):**
    *   **Sidebar ([AdminSidebar.js](file:///h:/venixwatch/frontend/src/pages/Admin/shared/AdminSidebar.js)):** Thanh menu bên trái cố định trên Desktop, hỗ trợ ẩn/hiện trên thiết bị di động kèm phông nền mờ (Backdrop). Hiển thị thông tin phiên đăng nhập của quản trị viên và tích hợp nút Đăng xuất.
    *   **Topbar ([AdminTopbar.js](file:///h:/venixwatch/frontend/src/pages/Admin/shared/AdminTopbar.js)):** Thanh điều khiển phía trên gồm nút đóng/mở Sidebar di động, thanh hiển thị đường dẫn (Breadcrumb), hệ thống hiển thị thông báo khẩn cấp và Dropdown cá nhân của tài khoản Admin.
    *   **Content Area:** Vùng hiển thị nội dung chính tự động nạp các Component tương ứng dựa trên trạng thái URL băm (`window.location.hash`).

---

## 2. Các Phân Hệ Quản Trị Chi Tiết (Admin Modules)

### 2.1. Bảng Điều Khiển Tổng Quan (Dashboard)
Phân hệ cung cấp cái nhìn toàn cảnh về tình hình hoạt động của trang web trong ngày dưới dạng số liệu thời gian thực.
*   **Các chỉ số đo lường chính (Stats Cards):** Số người đang online trực tiếp, lượt xem trang hôm nay, số đơn hàng mới phát sinh, doanh thu ước tính trong ngày, số đơn hàng đang chờ xử lý và cảnh báo số sản phẩm sắp hết hàng trong kho.
*   **Biểu đồ lượt truy cập theo giờ (Hourly Views Chart):** Vẽ biểu đồ đường biểu diễn sự thay đổi lượng truy cập qua các khung giờ trong ngày.
*   **Bản đồ vị trí khách truy cập (Visitor Map):** Hiển thị số lượng truy cập phân theo quốc gia.
*   **Cơ chế Tự động làm mới (Auto Refresh):** Sử dụng bộ đếm thời gian `setInterval` tự động gọi API làm mới số liệu mỗi 30 giây một lần để đảm bảo tính thời gian thực mà không cần tải lại trang.

### 2.2. Báo Cáo Chuyên Sâu (Analytics)
Hệ thống báo cáo chi tiết về hành vi người dùng, nguồn lưu lượng truy cập và hiệu quả bán hàng.
*   **Bộ lọc thời gian linh hoạt:** Lọc số liệu theo các mốc cấu hình nhanh (Hôm nay, 7 ngày, 30 ngày, 90 ngày) hoặc chọn khoảng ngày tùy biến thông qua lịch chọn ngày (Date Picker).
*   **Biểu đồ trực quan (Doughnut/Line Charts):**
    *   Biểu đồ Doughnut phân tích danh mục sản phẩm được ưa thích, thiết bị truy cập (Desktop, Mobile, Tablet), nguồn lưu lượng (Direct, Google, Facebook,...) và tỷ lệ khách truy cập theo quốc gia/thành phố.
    *   Biểu đồ Line biểu diễn xu hướng lượt truy cập (Sessions) và khách truy cập độc nhất (Unique Visitors) theo dòng thời gian.
*   **Bảng số liệu thống kê:**
    *   **Top Products:** Danh sách sản phẩm được xem nhiều nhất kèm theo mã SKU, lượt xem và giá bán.
    *   **Top Search Keywords:** Thống kê tần suất các từ khóa khách hàng tìm kiếm trên thanh search của Client.
    *   **Top Pages:** Thống kê chi tiết các URL được truy cập nhiều nhất kèm số lượt xem, số khách riêng biệt và thời gian lưu lại trung bình.
*   **Xuất Báo Cáo Excel:** Nút **Xuất Excel** hỗ trợ tải về báo cáo tài chính và lượng truy cập dưới định dạng file Excel `.xls` được định dạng bảng biểu, màu sắc thương hiệu chuyên nghiệp.

### 2.3. Quản Lý Sản Phẩm (Products)
Mô-đun cốt lõi quản lý danh mục sản phẩm đồng hồ.
*   **Bảng danh sách sản phẩm:** Hỗ trợ phân trang, tìm kiếm theo tên/SKU và bộ lọc nâng cao theo Thương hiệu, Danh mục ngành hàng và Trạng thái hiển thị (Hoạt động/Ngừng kinh doanh).
*   **Trình chỉnh sửa sản phẩm chuyên sâu (Product Form):**
    *   Cấu hình thông tin cơ bản: Tên sản phẩm, mã SKU, giá bán lẻ, giá khuyến mãi, số lượng tồn kho.
    *   Cấu hình thông số kỹ thuật (Specs): Chất liệu vỏ (Case Material), kích thước mặt (Case Size), loại máy (Movement Type - Quartz, Automatic, Solar, Mechanical), khả năng chống nước (Water Resistance) và xuất xứ thương hiệu (Origin).
    *   Bộ soạn thảo mô tả chi tiết: Tích hợp WYSIWYG Editor đầy đủ công cụ định dạng HTML để biên soạn bài viết giới thiệu sản phẩm.
    *   Bộ chọn ảnh thư viện (Image Picker): Hỗ trợ tải nhiều hình ảnh cùng lúc, sắp xếp thứ tự hiển thị bằng cách kéo thả hoặc click chọn làm ảnh đại diện chính (Thumbnail).

### 2.4. Quản Lý Danh Mục & Thương Hiệu (Categories & Brands)
*   **Quản lý Danh mục (Categories):** Thêm, sửa, xóa các nhóm sản phẩm (Ví dụ: Đồng Hồ Nam, Đồng Hồ Nữ, Đồng Hồ Đôi, Phụ Kiện). Hỗ trợ cấu hình đường dẫn thân thiện (slug) và thứ tự sắp xếp menu.
*   **Quản lý Thương hiệu (Brands):** Danh sách các hãng đồng hồ (Ví dụ: Carnival, Casio, Kemil). Cho phép thêm mô tả ngắn của thương hiệu và tải lên hình ảnh Logo đại diện để hiển thị trên bộ lọc Client.

### 2.5. Quản Lý Đơn Hàng (Orders)
*   **Theo dõi trạng thái đơn hàng:** Bộ lọc trạng thái đơn hàng trực quan: Chờ xử lý (Pending), Đang xử lý (Processing), Đang giao hàng (Shipping), Đã hoàn thành (Completed) và Đã hủy (Cancelled).
*   **Chi tiết đơn hàng (Order Detail):**
    *   Hiển thị thông tin khách hàng, số điện thoại, email, địa chỉ giao hàng và ghi chú của khách.
    *   Chi tiết các sản phẩm được đặt mua kèm theo số lượng, đơn giá và tổng số tiền thanh toán.
    *   Hỗ trợ cập nhật trạng thái thanh toán (Chưa thanh toán/Đã thanh toán) và cập nhật tiến trình giao nhận đơn hàng.
    *   Nút **In hóa đơn** hỗ trợ in hoặc xuất hóa đơn mua hàng ra định dạng PDF chuẩn.

### 2.6. Quản Lý Tin Tức & Sự Kiện (News)
*   Quản lý danh sách bài viết trên trang blog/tin tức của Venix Watch.
*   Form soạn thảo tin tức tích hợp trình soạn thảo WYSIWYG giúp biên tập nội dung bài viết, tiêu đề, tóm tắt bài viết, tác giả, trạng thái xuất bản (Nháp/Công khai) và tải lên hình ảnh đại diện đại diện (Thumbnail).

### 2.7. Quản Lý Bảo Hành (Warranties)
*   **Kích hoạt bảo hành điện tử:** Cho phép tạo mới thẻ bảo hành cho khách mua hàng bằng cách nhập thông tin tên khách hàng, số điện thoại, số Serial Number của sản phẩm, ngày mua và lựa chọn thời hạn bảo hành (1 năm, 2 năm, 5 năm,...).
*   **Tra cứu & Quản lý:** Danh sách thẻ bảo hành hỗ trợ tìm kiếm nhanh theo số điện thoại hoặc Serial Number, hiển thị trạng thái bảo hành hiện tại (Còn hạn/Hết hạn).

### 2.8. Chiến Dịch Giờ Vàng (Flash Sales)
*   Quản lý các chiến dịch Flash Sale kích cầu mua sắm.
*   **Thiết lập chiến dịch:** Đặt tên chương trình, cài đặt thời gian bắt đầu và thời gian kết thúc thông qua bộ chọn ngày giờ chi tiết.
*   **Cấu hình sản phẩm ưu đãi:** Lựa chọn danh sách các sản phẩm tham gia và nhập giá bán Flash Sale tương ứng cho từng sản phẩm. Giá bán này sẽ tự động ghi đè giá bán thường trên toàn hệ thống Client trong thời gian chiến dịch diễn ra.

### 2.9. Quản Lý Tài Khoản Người Dùng (Users)
*   Quản lý danh sách khách hàng và các tài khoản nhân viên.
*   **Tính năng:** Thêm tài khoản mới, chỉnh sửa thông tin liên hệ, đặt lại mật khẩu bảo mật và chuyển đổi trạng thái tài khoản (Kích hoạt/Khóa tài khoản). Phân loại vai trò người dùng để xác định thẩm quyền.

### 2.10. Phân Quyền Hệ Thống (Roles & Permissions)
*   **Quản lý vai trò (Roles):** Cấu hình các cấp độ quản trị khác nhau (Ví dụ: `super_admin`, `admin`, `editor`).
*   **Ma Trận Quyền Hạn (Permission Matrix):** Cho phép bật/tắt các quyền hạn chi tiết cho từng vai trò trên các tác vụ hệ thống (Ví dụ: Quyền đọc cấu hình `settings:read`, quyền ghi cấu hình `settings:write`, quyền chỉnh sửa đơn hàng `orders:write`, quyền sửa đổi sản phẩm `products:write`,...).

### 2.11. Cài Đặt Hệ Thống (System Settings)
Đây là khu vực trung tâm điều khiển cấu hình toàn bộ hoạt động của trang web phía Client, được chia nhỏ thành 8 Tab chức năng chuyên biệt:
1.  **Thông Tin Thương Hiệu (Brand Tab):** Cấu hình tên hiển thị của trang web, tải lên Logo chính, Hotline liên hệ, Email hỗ trợ kỹ thuật và liên kết mạng xã hội chính.
2.  **Menu Điều Hướng (Menu Tab):** Thiết lập danh mục các liên kết xuất hiện trên thanh menu điều hướng chính của Client và danh sách các thương hiệu đồng hồ nổi bật hiển thị riêng biệt trong Mega Menu của hai danh mục Nam và Nữ.
3.  **Hero Banner (Banner Tab):** Quản lý slider ảnh động lớn ở đầu trang chủ Client (Thêm ảnh banner, sửa tiêu đề, phụ đề, gán link chuyển hướng khi click banner, bật/tắt hiển thị và thay đổi thứ tự trượt).
4.  **Bố Cục Trang Chủ (Sections Tab):** Cho phép quản trị viên ẩn/hiện hoặc thay đổi vị trí của các khối nội dung trên trang chủ Client (Ví dụ: Khối Banner Hero, Khối Flash Sale, Khối sản phẩm bán chạy, Khối tin tức...).
5.  **Màu Sắc Giao Diện (Colors Tab):** Tích hợp live-preview giúp Admin chọn và chỉnh sửa bảng màu thương hiệu (Màu nền, màu văn bản, màu nhấn nút, màu viền,...). Thay đổi sẽ cập nhật trực tiếp lên giao diện Client qua thẻ biến CSS.
6.  **Cấu Hình Footer (Footer Tab):** Quản lý chân trang Client gồm thông tin liên hệ, bản đồ địa chỉ, tài khoản ngân hàng chuyển khoản VietQR, và quản lý các liên kết chân trang theo 3 nhóm cột (Cột Cửa hàng, Dịch vụ KH, Về chúng tôi).
7.  **Chính Sách & Trust Badges (Policy Tab):** Tích hợp trình soạn thảo WYSIWYG để viết bài cho các trang chính sách tĩnh (Giới thiệu, Vận chuyển, Đổi trả, Bảo mật, FAQ...) và quản lý các Trust Badges cam kết khách hàng (Đổi tên badge, icon SVG, mô tả phụ).
8.  **Lịch Sử Thay Đổi (History Tab):** Bảng ghi nhật ký kiểm toán (Audit Logs), theo dõi xem tài khoản admin nào đã thực hiện thay đổi cấu hình hệ thống vào thời gian nào để dễ dàng đối soát khi xảy ra sự cố.
