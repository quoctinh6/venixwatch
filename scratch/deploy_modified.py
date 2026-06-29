
import os
import ftplib

FTP_HOST = "203.171.31.7"
FTP_USER = "u9837c42a"
FTP_PASS = "wvXgFAlpdzkNPUA@1"
FTP_PORT = 21
REMOTE_BASE = "/httpdocs"

FILES_TO_DEPLOY = [
    "frontend/src/pages/StaticPolicy/index.js",
    "frontend/src/pages/NewsList/index.js",
    "frontend/src/pages/NewsDetail/index.js",
    "backend/public/check_products.php",
    "backend/src/Models/FlashSale.php",
    "backend/src/Models/Product.php",
    "backend/src/Modules/Admin/Product/ProductService.php",
    "backend/public/sync_flashsales.php",
    "backend/src/Modules/Admin/Settings/SettingService.php",
    "backend/src/Modules/Admin/News/NewsController.php",
    "backend/src/Controllers/Public/OrderController.php",
    "backend/src/Models/Order.php",
    "backend/public/run_migration.php",
    "backend/src/Services/Mailer.php",
    "backend/public/view_emails.php",
    "frontend/src/pages/ProductDetail/ProductInfo.js",
    "frontend/src/pages/Admin/Warranties/WarrantyForm.js",
    "frontend/src/pages/Admin/FlashSales/FlashSaleForm.js",
    "frontend/src/pages/Admin/Settings/FooterTab.js",
    "frontend/src/pages/Admin/Settings/PolicyTab.js",
    "frontend/src/pages/Admin/Settings/index.js",
    "frontend/src/components/MainFooter.js",
    "frontend/src/pages/Checkout/index.js",
    "frontend/src/components/MainNavbar.js",
    "frontend/src/pages/Admin/Settings/MenuTab.js",
    "frontend/src/components/QuickSettingsModal.js",
    "frontend/src/pages/Account/index.js",
    "frontend/src/utils/router.js",
    "backend/public/update_settings.php",
    "frontend/src/services/authService.js",
    "frontend/src/services/adminService.js",
    "frontend/src/pages/Cart/index.js",
    "backend/src/Services/Public/ProductDetailService.php",
    "backend/src/Controllers/Public/CartController.php",
    "frontend/src/pages/Admin/Orders/OrderTable.js",
    "frontend/src/pages/Admin/Products/ProductTable.js",
    "frontend/src/pages/Admin/Analytics/index.js",
    "frontend/index.html",
    "backend/migrate_and_seed.php",
    "backend/schema.sql",
    "serve.js",
    "robots.txt",
    "sitemap.xml",
    "backend/src/Modules/Admin/Order/OrderService.php",
    "frontend/src/pages/Admin/Orders/OrderDetail.js",
    "frontend/src/pages/Admin/Users/UserForm.js",
    ".htaccess",
    "frontend/src/pages/Home/TrustBadges.js",
    "backend/public/update_menu.php"
]

def get_ftp_connection():
    print(f"Connecting to FTP {FTP_HOST}:{FTP_PORT}...")
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, FTP_PORT)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.encoding = "utf-8"
    ftp.set_pasv(False)
    print("Login successful (Active Mode enabled).")
    return ftp

def create_remote_dir_recursive(ftp, remote_dir):
    parts = remote_dir.split('/')
    current = ""
    for part in parts:
        if not part:
            current += "/"
            continue
        if current and not current.endswith("/"):
            current += "/"
        current += part
        try:
            ftp.mkd(current)
            print(f"Created remote directory: {current}")
        except ftplib.error_perm:
            pass

def upload_file(ftp, local_path, remote_path):
    remote_dir = os.path.dirname(remote_path).replace("\\", "/")
    create_remote_dir_recursive(ftp, remote_dir)
    
    print(f"Uploading: {local_path} -> {remote_path}")
    with open(local_path, "rb") as f:
        ftp.storbinary(f"STOR {remote_path}", f)

def main():
    local_base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print(f"Local project base: {local_base}")
    
    ftp = get_ftp_connection()
    uploaded_count = 0
    
    for rel_path in FILES_TO_DEPLOY:
        rel_path = rel_path.replace("\\", "/")
        local_path = os.path.join(local_base, rel_path)
        
        if not os.path.exists(local_path):
            print(f"File does not exist locally: {local_path}")
            continue
            
        remote_path = f"{REMOTE_BASE}/{rel_path}"
        upload_file(ftp, local_path, remote_path)
        uploaded_count += 1
        
    ftp.quit()
    print("\n=============================================")
    print(f"Fast deployment finished! Uploaded {uploaded_count} files.")
    print("=============================================")

if __name__ == "__main__":
    main()
