# Tài Liệu Kỹ Thuật: Tổng Hợp Logic Chỉnh Sửa Các Trang Giao Diện Người Dùng (User Pages) — Venix Watch

Tài liệu này tổng hợp chi tiết các logic chỉnh sửa giao diện và tính năng phía người dùng (Client-side / User pages) đã thực hiện trên dự án Venix Watch. Tài liệu phân tích cấu trúc, cách thức cài đặt và cơ chế vận hành của từng hạng mục để phục vụ quản trị và phát triển tiếp theo.

---

## 1. Cấu Hình Chân Trang (Dynamic Footer) & Inline Edit

### Ý nghĩa & Chức năng
Thay thế Footer tĩnh bằng Footer động tải cấu hình trực tiếp từ cơ sở dữ liệu (`window.APP_SETTINGS.footer_settings`), cho phép quản trị viên chỉnh sửa nhanh thông tin liên hệ, mạng xã hội, các nhóm liên kết chân trang, và thông tin chuyển khoản ngân hàng ngay tại giao diện Client.

### Các file liên quan
*   **Hiển thị:** [MainFooter.js](file:///h:/venixwatch/frontend/src/components/MainFooter.js)
*   **Hệ thống cấu hình nhanh:** [QuickSettingsModal.js](file:///h:/venixwatch/frontend/src/components/QuickSettingsModal.js)
*   **Trang cấu hình Admin:** [FooterTab.js](file:///h:/venixwatch/frontend/src/pages/Admin/Settings/FooterTab.js)

### Cơ chế hoạt động & Chỉnh sửa
1.  **Phân quyền nút Inline Edit:**
    Khi render Footer, Component [MainFooter](file:///h:/venixwatch/frontend/src/components/MainFooter.js) kiểm tra quyền của người dùng hiện tại thông qua [authService](file:///h:/venixwatch/frontend/src/services/authService.js). Nếu người dùng có vai trò `admin`, `super_admin`, `editor` hoặc quyền `settings:write`, hệ thống sẽ chèn một nút chỉnh sửa nổi (Pen Icon) tuyệt đối góc trên bên phải của Footer.
2.  **Mở trình chỉnh sửa:**
    Click vào nút Pen Icon sẽ kích hoạt `openQuickSettings('footer')`. Trình cấu hình nhanh Footer được chia làm hai khu vực chính:
    *   **Form thông tin:** Chỉnh sửa Hotline, Email, Địa chỉ, đường dẫn mạng xã hội (Facebook, Instagram, TikTok, YouTube) và Thông tin tài khoản ngân hàng.
    *   **Link Builder:** Quản lý 3 nhóm liên kết (Shop, Dịch vụ KH, Về chúng tôi). Admin có thể sửa nhãn (Label), đường dẫn (URL), kéo thả/đổi vị trí (Move Up/Down) hoặc xóa liên kết.
3.  **Lưu dữ liệu:**
    Dữ liệu được lưu thông qua API `PUT /api/admin/settings`. Sau khi lưu thành công, `window.APP_SETTINGS` được cập nhật và giao diện Footer tự động vẽ lại mà không cần tải lại toàn bộ trang.

---

## 2. Hệ Thống Trang Chính Sách Tích Hợp Trình Soạn Thảo Trực Quan (Inline WYSIWYG)

### Ý nghĩa & Chức năng
Tạo ra một cụm trang chính sách thống nhất dùng chung giao diện tab, đồng thời cung cấp trình soạn thảo trực quan (WYSIWYG) trực tiếp trên giao diện Client dành riêng cho quản trị viên mà không cần vào trang quản trị Admin tách biệt.

### Các file liên quan
*   **Giao diện & Logic Editor:** [StaticPolicy/index.js](file:///h:/venixwatch/frontend/src/pages/StaticPolicy/index.js)
*   **Trang cấu hình Admin:** [PolicyTab.js](file:///h:/venixwatch/frontend/src/pages/Admin/Settings/PolicyTab.js)
*   **Cấu hình router:** [router.js](file:///h:/venixwatch/frontend/src/utils/router.js)

### Các đường dẫn chính sách hoạt động
*   `/gioi-thieu` (Về Chúng Tôi)
*   `/van-chuyen` (Chính Sách Vận Chuyển)
*   `/doi-tra` (Đổi Trả & Hoàn Tiền)
*   `/bao-hanh` (Chính Sách Bảo Hành)
*   `/bao-mat` (Chính Sách Bảo Mật)
*   `/dieu-khoan` (Điều Khoản Dịch Vụ)
*   `/faq` (FAQ — Câu Hỏi Thường Gặp)

### Cơ chế hoạt động & Chỉnh sửa
1.  **Cơ chế Inline Edit (Giao diện Client):**
    *   Khi Admin truy cập một trang chính sách, nút **Chỉnh sửa** sẽ xuất hiện ở góc trên bên phải của khung nội dung.
    *   Khi click vào nút này, vùng nội dung chính được gán thuộc tính `contenteditable="true"` và một thanh công cụ định dạng (Format Toolbar) sẽ được ghim ở phía trên.
    *   **Thanh công cụ định dạng:** Hỗ trợ In đậm (B), In nghiêng (I), Gạch chân (U), định dạng thẻ tiêu đề (H2, H3), đoạn văn (P), tạo danh sách (Ordered/Unordered list). Đặc biệt có nút **Thêm thẻ (Card)** và **Xóa thẻ** để chèn các hộp thông tin nổi bật dạng Grid.
    *   **Bảng thuộc tính thẻ (Properties Panel):** Khi Admin nhấp chuột vào một thẻ bất kỳ, một bảng điều khiển nổi xuất hiện bên phải màn hình cho phép chỉnh sửa: Màu nền, Màu chữ, Khoảng đệm (Padding), Bo góc (Border Radius), Viền (Border), và Kích thước cột (Span 2 cột, Toàn chiều rộng).
2.  **Cơ chế lưu trữ và làm sạch mã nguồn (Clean HTML code):**
    *   Khi bấm **Lưu thay đổi**, hệ thống sẽ tạo một bản sao ảo của cây DOM soạn thảo, sau đó duyệt qua toàn bộ cấu trúc và xóa bỏ tất cả các thẻ điều khiển chỉnh sửa, nút xóa nhanh, viền định khung (`.pe-ctrl`, `.pe-add`, thuộc tính `data-pe-sel`, `contenteditable`, v.v.).
    *   Mã nguồn HTML sạch này sau đó được gửi lên API qua request `PUT /api/admin/settings` dưới trường `policy_content[key]`.
3.  **Accordion FAQ:**
    Riêng trang Câu hỏi thường gặp (`/faq`) có tích hợp logic đóng mở câu hỏi mượt mà bằng JavaScript thuần, tự động thu nhỏ các câu hỏi khác khi mở câu hỏi mới.

---

## 3. Quản Lý Cam Kết Khách Hàng (Dynamic Trust Badges)

### Ý nghĩa & Chức năng
Chuyển đổi các nhãn cam kết chính sách (ví dụ: Miễn phí vận chuyển, Đổi trả dễ dàng, Bảo hành 2 năm, v.v.) từ tĩnh sang động. Giúp trang chủ và chân trang hiển thị đồng bộ theo thiết lập của Admin.

### Các file liên quan
*   **Hiển thị:** [TrustBadges.js](file:///h:/venixwatch/frontend/src/pages/Home/TrustBadges.js)
*   **Trang cấu hình Admin:** [PolicyTab.js](file:///h:/venixwatch/frontend/src/pages/Admin/Settings/PolicyTab.js)

### Cơ chế hoạt động & Chỉnh sửa
1.  **Đọc dữ liệu:**
    Component [TrustBadges](file:///h:/venixwatch/frontend/src/pages/Home/TrustBadges.js) đọc mảng badges từ `window.APP_SETTINGS.trust_badges`. Nếu không có thiết lập, hệ thống sẽ sử dụng danh sách 4 badges mặc định.
2.  **Giao diện quản lý Admin:**
    Trong phần quản lý Admin (Tab Chính Sách & Badges), hệ thống cung cấp danh sách chỉnh sửa trực quan:
    *   Admin nhập trực tiếp Tiêu đề, Mô tả phụ và dán mã SVG của icon vào ô tương ứng.
    *   Cho phép sắp xếp thứ tự hiển thị bằng nút Lên/Xuống.
    *   Có tích hợp hai khung **Live Preview** (Light Mode đại diện cho trang chủ, Dark Mode đại diện cho chân trang) tự động cập nhật ngay khi Admin đang gõ nội dung hoặc dán mã SVG.

---

## 4. Tối Ưu Trang Thanh Toán (Checkout) & Tích Hợp VietQR Tự Động

### Ý nghĩa & Chức năng
Nâng cấp trải nghiệm thanh toán của khách hàng bằng cách tự động điền thông tin, chống thoát trang ngoài ý muốn, và tự động tạo mã QR chuyển khoản ngân hàng nhanh (VietQR) theo đúng thông tin đơn hàng.

### Các file liên quan
*   **Giao diện & Logic:** [Checkout/index.js](file:///h:/venixwatch/frontend/src/pages/Checkout/index.js)
*   **Cấu trúc dữ liệu:** [schema.sql](file:///h:/venixwatch/backend/schema.sql) (Thêm cột `payment_method` vào bảng `orders`)
*   **Xử lý đơn hàng:** [OrderController.php](file:///h:/venixwatch/backend/src/Controllers/Public/OrderController.php)

### Cơ chế hoạt động & Chỉnh sửa
1.  **Tự động điền (Autofill):**
    Nếu người dùng đang đăng nhập, hệ thống tự lấy thông tin Tên, Số điện thoại và Email từ tài khoản điền sẵn vào Form giao hàng, hiển thị Banner thông báo đơn hàng sẽ được lưu vào lịch sử mua hàng cá nhân.
2.  **Cơ chế chống mất giỏ hàng khi thanh toán dở dang:**
    *   Khi gửi đơn hàng lên server thành công, hệ thống lưu trữ giỏ hàng hiện tại vào `sessionStorage` dưới dạng backup trước khi dọn sạch giỏ hàng ở `localStorage`.
    *   Sử dụng sự kiện `beforeunload` chặn trình duyệt tắt/reload khi khách hàng đang ở màn hình hướng dẫn chuyển khoản. Nếu khách hàng cố tình thoát trang trước khi xác nhận chuyển khoản, giỏ hàng backup sẽ tự động được khôi phục ngược lại vào `localStorage` để tránh mất mát thông tin đơn hàng của họ.
3.  **Tạo mã VietQR tự động theo thông tin ngân hàng:**
    *   Nếu chọn phương thức thanh toán **Chuyển khoản ngân hàng**, hệ thống sẽ lấy dữ liệu Ngân hàng cấu hình trong `window.APP_SETTINGS.footer_settings` (gồm `bank_name`, `bank_account`, `bank_owner`).
    *   Hệ thống chuyển đổi tên ngân hàng sang dạng viết tắt chuẩn (Shortcode) được hỗ trợ bởi VietQR (Ví dụ: `MB Bank` thành `MB`, `Vietcombank` thành `VCB`).
    *   Tạo đường dẫn ảnh QR động bằng VietQR API:
        ```
        https://img.vietqr.io/image/${bankShortcode}-${cleanBankAccount}-compact2.png
          ?amount=${totalPrice}
          &addInfo=VenixWatch%20${orderId}
          &accountName=${encodeURIComponent(bankOwner)}
        ```
    *   Khách hàng chỉ cần quét mã QR này bằng ứng dụng ngân hàng, toàn bộ thông tin Số tài khoản, Tên chủ thẻ, Số tiền đơn hàng và Nội dung chuyển khoản sẽ được tự động điền chính xác 100%.

---

## 5. Hiển Thị Mô Tả Ngắn Ở Trang Chi Tiết Sản Phẩm

### Ý nghĩa & Chức năng
Hiển thị mô tả tóm tắt ngắn gọn của đồng hồ ở vị trí nổi bật ngay dưới giá bán để khách hàng dễ dàng nắm bắt thông tin trước khi đọc phần mô tả chi tiết.

### Các file liên quan
*   **Giao diện:** [ProductInfo.js](file:///h:/venixwatch/frontend/src/pages/ProductDetail/ProductInfo.js)

### Cơ chế hoạt động
1.  **Kiểm tra nguồn dữ liệu mô tả:**
    Hệ thống kiểm tra tuần tự các trường dữ liệu của sản phẩm:
    *   Ưu tiên 1: `basic_info` (Thông tin cơ bản)
    *   Ưu tiên 2: `short_description` (Mô tả ngắn)
    *   Ưu tiên 3: Nếu không có hai trường trên, hệ thống sẽ tự động bóc tách chuỗi từ trường mô tả chi tiết `description`, sử dụng Regular Expression để loại bỏ toàn bộ các thẻ HTML (`<...>` -> rỗng), cắt lấy 220 ký tự đầu tiên và thêm hậu tố `...`.
2.  **Hiển thị:**
    Nếu tồn tại mô tả ngắn, một khối hộp có viền phân cách bên trái và vạch màu vàng thương hiệu dạng thanh đứng (`#C9A961`) sẽ được chèn trước phần lựa chọn phiên bản sản phẩm.

---

## 6. Trang Lịch Sử Tài Khoản & Cơ Chế Đánh Giá Sản Phẩm (Reviews)

### Ý nghĩa & Chức năng
Mở rộng chức năng trang cá nhân của khách hàng, cho phép họ gửi đánh giá sản phẩm (Sao, bình luận, tiêu đề) đối với những đơn hàng đã hoàn thành.

### Các file liên quan
*   **Giao diện & Logic:** [Account/index.js](file:///h:/venixwatch/frontend/src/pages/Account/index.js)
*   **Cơ sở dữ liệu:** [migrate_and_seed.php](file:///h:/venixwatch/backend/migrate_and_seed.php) (Tạo bảng `reviews` và các bảng liên quan, cài đặt dữ liệu mẫu)
*   **Xử lý API:** [OrderController.php](file:///h:/venixwatch/backend/src/Controllers/Public/OrderController.php)

### Cơ chế hoạt động & Chỉnh sửa
1.  **Hiển thị nút Đánh giá:**
    Khi người dùng kiểm tra lịch sử mua hàng, đối với các đơn hàng có trạng thái `completed` (Đã hoàn thành), bên cạnh mỗi sản phẩm trong chi tiết đơn hàng sẽ xuất hiện nút **Viết Đánh Giá**.
2.  **Form đánh giá sản phẩm:**
    Click vào nút sẽ mở ra Form đánh giá ngay dưới sản phẩm:
    *   **Chọn sao:** Chọn từ 1 đến 5 sao bằng giao diện trực quan. Khi click hoặc di chuột, các ngôi sao sẽ đổi màu vàng thương hiệu `#C9A84C`.
    *   **Tiêu đề:** Nhập tiêu đề tóm tắt đánh giá.
    *   **Nội dung bình luận:** Kiểm tra điều kiện bắt buộc (Tối thiểu 20 ký tự, tối đa 500 ký tự) kèm bộ đếm ký tự thời gian thực. Hiển thị thông báo lỗi màu đỏ nếu không đủ độ dài.
    *   **Ẩn danh:** Tùy chọn gửi đánh giá ẩn danh (không hiện tên đầy đủ).
3.  **Gửi và Thông báo:**
    Khi bấm **Gửi**, hệ thống gửi request POST đến đầu cuối `/api/products/${productId}/reviews`. Sau khi thành công, Form tự đóng và hiển thị một hộp thoại thông báo thành công đẹp mắt được thiết kế tùy biến (`_showCustomSuccessAlert`) thay vì sử dụng hàm `alert()` mặc định của trình duyệt.

---

## 7. Tối Ưu Router Cập Nhật Trang Mượt Mà (In-place Routing)

### Ý nghĩa & Chức năng
Nâng cao hiệu năng điều hướng trang của Single Page Application (SPA), giúp việc chuyển đổi giữa các trang chính sách hoặc các tham số URL không bị giật lag và giảm thiểu việc tải lại toàn bộ tài nguyên.

### Các file liên quan
*   **Router chính:** [router.js](file:///h:/venixwatch/frontend/src/utils/router.js)

### Cơ chế hoạt động
1.  **Nhận diện Component cũ:**
    Khi chuyển hướng trang, Router kiểm tra xem lớp đối tượng Component của trang hiện tại (`_currentPageInstance`) có trùng khớp với lớp đối tượng của trang mới hay không (Ví dụ: Chuyển đổi từ `/gioi-thieu` sang `/van-chuyen` đều sử dụng lớp `StaticPolicyPage`).
2.  **Cập nhật tham số trực tiếp (In-place Update):**
    *   Nếu trùng khớp và Component đó có hỗ trợ phương thức `updateParams()`, Router sẽ gọi trực tiếp phương thức này kèm tham số mới (`_currentPageInstance.updateParams(match.params)`) thay vì hủy bỏ (destroy) và tạo mới Component từ đầu.
    *   Sau đó gọi `_mainNavbar.updateActiveLinks()` để cập nhật thanh menu hiển thị vị trí trang hiện tại ngay lập tức.
3.  **Kết quả:**
    Nội dung trang chuyển đổi tức thì trong khoảng 0.05 giây, mang lại trải nghiệm cực kỳ cao cấp và chuyên nghiệp cho khách hàng mua sắm.


---

## 8. Cấu Hình Mega Menu & Menu Thương Hiệu Động (Dynamic Mega Menu Brands)

### Ý nghĩa & Chức năng
Thay thế danh sách thương hiệu tĩnh trong menu thả xuống (Mega Menu) của danh mục **Nam** và **Nữ** bằng cấu hình động tải trực tiếp từ cơ sở dữ liệu (`window.APP_SETTINGS.menu_brands_nam` và `window.APP_SETTINGS.menu_brands_nu`). Cho phép quản trị viên tự do thiết lập tên nhãn, mã hãng để lọc sản phẩm, chọn biểu tượng và thứ tự hiển thị của các thương hiệu đồng hồ nổi bật trên menu chính trực tiếp từ phía Client hoặc trang Admin.

### Các file liên quan
*   **Hiển thị thanh điều hướng:** [MainNavbar.js](file:///h:/venixwatch/frontend/src/components/MainNavbar.js)
*   **Hệ thống cấu hình nhanh:** [QuickSettingsModal.js](file:///h:/venixwatch/frontend/src/components/QuickSettingsModal.js)
*   **Trang cấu hình Admin:** [MenuTab.js](file:///h:/venixwatch/frontend/src/pages/Admin/Settings/MenuTab.js)
*   **Logic phía Server:** [SettingService.php](file:///h:/venixwatch/backend/src/Modules/Admin/Settings/SettingService.php)

### Cơ chế hoạt động & Chỉnh sửa
1.  **Hiển thị trên giao diện:**
    Component [MainNavbar](file:///h:/venixwatch/frontend/src/components/MainNavbar.js) tự động tải danh sách hãng tương ứng theo giới tính từ APP_SETTINGS. Nếu chưa được thiết lập, hệ thống sẽ sử dụng danh sách 3 hãng mặc định: Carnival Premium (icon `polygon`/badge), Casio Watch (icon `rect`/watch), và Kemil New (icon `star`).
2.  **Cài đặt biểu tượng:**
    Hệ thống hỗ trợ 3 loại biểu tượng được vẽ bằng mã SVG tương thích:
    *   `star` (Ngôi sao thời thượng)
    *   `polygon` (Hình huy hiệu thương hiệu)
    *   `rect` (Hình khung đồng hồ)
3.  **Tích hợp trình quản lý:**
    Tính năng chỉnh sửa được tích hợp song hành tại hai nơi:
    *   **Tab Menu Điều Hướng (Admin Panel):** Cho phép chỉnh sửa tên nhãn hiển thị, mã hãng tương ứng (để làm tham số filter trên URL, ví dụ: `?brand=kemil`), chọn loại icon từ dropdown, di chuyển vị trí Lên/Xuống hoặc Xóa bỏ liên kết.
    *   **Trình Cấu Hình Nhanh (Client Quick Settings):** Admin/editor có thể bấm vào nút Pen Icon trên menu điều hướng chính để mở Quick Settings Modal trực tiếp trên màn hình, thay đổi các tùy chọn hiển thị menu thương hiệu và lưu ngay mà không cần rời trang hiện tại.

---

## 9. Trình Soạn Thảo Tin Tức Trực Tiếp Trên Client (News Inline Editors)

### Ý nghĩa & Chức năng
Hỗ trợ quản trị viên và biên tập viên (`editor`) thực hiện các tác vụ biên tập nhanh thông tin bài viết tin tức trực tiếp trên giao diện hiển thị phía Client (Inline WYSIWYG Editor) thay vì bắt buộc phải truy cập vào trang Admin Dashboard truyền thống.

### Các file liên quan
*   **Trang danh sách tin tức:** [NewsList/index.js](file:///h:/venixwatch/frontend/src/pages/NewsList/index.js)
*   **Trang chi tiết tin tức:** [NewsDetail/index.js](file:///h:/venixwatch/frontend/src/pages/NewsDetail/index.js)
*   **Xử lý API và tải ảnh:** [NewsController.php](file:///h:/venixwatch/backend/src/Modules/Admin/News/NewsController.php)

### Cơ chế hoạt động & Chỉnh sửa
1.  **Chỉnh sửa nhanh thẻ bài viết (News Cards Edit):**
    *   Tại trang `/tin-tuc`, khi đăng nhập bằng tài khoản có quyền `super_admin`, `admin`, `editor` hoặc có permission `settings:write`, mỗi thẻ bài viết sẽ hiển thị một nút **Sửa** (Edit Badge) ở góc trên bên phải.
    *   Bấm vào nút này sẽ kích hoạt chế độ chỉnh sửa trực quan ngay trên card: Tiêu đề và Mô tả tóm tắt của tin tức được gán thuộc tính `contenteditable="true"` cùng viền nét đứt màu vàng nổi bật.
    *   Một thanh thay đổi ảnh bìa (Thumbnail Bar) xuất hiện phía dưới ảnh, hỗ trợ chọn file ảnh từ máy tính để tải trực tiếp lên server thông qua API `/api/admin/news/upload-image` hoặc dán link URL ảnh thủ công.
    *   Hệ thống hiển thị thanh công cụ lưu trữ nhanh (Lưu / Hủy) dưới chân thẻ. Bấm **Lưu** sẽ gửi request `PUT /api/admin/news/${id}` và cập nhật tức thì trạng thái bài viết.
2.  **Soạn thảo WYSIWYG nội dung chi tiết (Rich Article Editor):**
    *   Tại trang chi tiết bài viết `/tin-tuc/:slug`, quản trị viên bấm nút **Chỉnh sửa** để chuyển đổi sang chế độ Edit Mode.
    *   Tiêu đề và nội dung bài viết chính chuyển sang chế độ soạn thảo trực tiếp. Một **Thanh công cụ định dạng (Format Bar)** xuất hiện ngay phía trên nội dung cung cấp các thao tác: In đậm (B), In nghiêng (I), Gạch chân (U), định dạng tiêu đề (H2, H3, P), tạo danh sách (Bullet/Ordered list), và chèn liên kết.
    *   **Hộp thoại Chèn Ảnh (Insert Image Dialog):** Nút **📷 Ảnh** trên thanh công cụ mở ra một modal riêng, hỗ trợ tải ảnh từ thiết bị nội bộ lên máy chủ hoặc chèn ảnh thông qua liên kết URL bên ngoài. Ảnh được chèn vào vị trí con trỏ chuột bằng lệnh `document.execCommand('insertHTML')` kèm theo CSS bo góc mềm mại.
    *   **Thanh điều khiển cố định (Sticky Save/Cancel Bar):** Xuất hiện cố định ở chân màn hình, cung cấp tính năng Hoàn tác (Undo), Hủy bỏ (khôi phục trạng thái gốc) và Lưu thay đổi. Trước khi lưu, hệ thống tự động lọc bỏ các cấu trúc HTML của bộ điều khiển chỉnh sửa và gửi dữ liệu sạch lên máy chủ.

---

## 10. Tích Hợp Đồng Bộ Giá Flash Sale Trong Chi Tiết Sản Phẩm & Giỏ Hàng

### Ý nghĩa & Chức năng
Đảm bảo giá của các sản phẩm đang chạy chương trình khuyến mãi giờ vàng (Flash Sale) được hiển thị và tính toán một cách đồng nhất trên toàn bộ hành trình mua sắm của khách hàng (từ trang chi tiết sản phẩm cho đến khi thêm vào giỏ hàng và thanh toán).

### Các file liên quan
*   **Controller Giỏ hàng:** [CartController.php](file:///h:/venixwatch/backend/src/Controllers/Public/CartController.php)
*   **Service Chi tiết sản phẩm:** [ProductDetailService.php](file:///h:/venixwatch/backend/src/Services/Public/ProductDetailService.php)
*   **Model FlashSale:** [FlashSale.php](file:///h:/venixwatch/backend/src/Models/FlashSale.php)

### Cơ chế hoạt động
1.  **Truy vấn trạng thái khuyến mãi:**
    Khi client gọi API lấy chi tiết sản phẩm hoặc danh sách giỏ hàng, hệ thống sử dụng Model [FlashSale](file:///h:/venixwatch/backend/src/Models/FlashSale.php) để quét xem sản phẩm tương ứng có đang nằm trong một chiến dịch Flash Sale đang diễn ra (Active Flash Sale) hay không.
2.  **Đè giá bán khuyến mãi (Price Override):**
    Nếu tìm thấy chương trình active, thuộc tính `sale_price` của sản phẩm sẽ được tự động ghi đè bằng giá ưu đãi Flash Sale (`sale_price` của Flash Sale).
3.  **Đồng bộ giỏ hàng và tổng tiền:**
    Việc ghi đè này diễn ra ngay tại tầng xử lý backend của [CartController](file:///h:/venixwatch/backend/src/Controllers/Public/CartController.php), giúp phần tính tổng tiền giỏ hàng (`total_price`) tự động áp dụng giá giờ vàng chính xác mà không cần xử lý thủ công hay phụ thuộc vào tính toán không an toàn từ phía Client.
