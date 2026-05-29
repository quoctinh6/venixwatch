import os
import ftplib

FTP_HOST = "203.171.31.7"
FTP_USER = "u9837c42a"
FTP_PASS = "wvXgFAlpdzkNPUA@1"
FTP_PORT = 21
REMOTE_BASE = "/httpdocs"
LOCAL_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_ftp_connection():
    print(f"Connecting to FTP {FTP_HOST}:{FTP_PORT}...")
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, FTP_PORT)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.encoding = "utf-8"
    print("Login successful.")
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
            # Already exists or permission denied
            pass

def upload_file(ftp, local_path, remote_path):
    # Ensure remote directory exists
    remote_dir = os.path.dirname(remote_path).replace("\\", "/")
    create_remote_dir_recursive(ftp, remote_dir)
    
    print(f"Uploading: {local_path} -> {remote_path}")
    with open(local_path, "rb") as f:
        ftp.storbinary(f"STOR {remote_path}", f)

def main():
    ftp = get_ftp_connection()
    
    # Files to upload
    files_to_upload = [
        "backend/public/.htaccess",
        "backend/public/index.php",
        "backend/src/Modules/Admin/Settings/SettingController.php",
        "backend/src/Modules/Admin/Settings/SettingService.php",
        "backend/src/Modules/Admin/Analytics/AnalyticsService.php",
        "backend/src/Modules/Admin/Analytics/AnalyticsController.php",
        "frontend/src/pages/Admin/Analytics/index.js",
        "frontend/src/services/adminService.js",
        "frontend/src/pages/Admin/shared/ui.js",
        "frontend/src/pages/Admin/Categories/index.js",
        "frontend/src/pages/Admin/Categories/CategoryForm.js",
        "frontend/admin.html",
        "frontend/index.html",
        "frontend/src/components/ContactFloater.js",
        "frontend/src/components/CartDrawer.js",
        "frontend/src/components/MainFooter.js",
        "frontend/src/components/MainNavbar.js",
        "frontend/src/components/QuickSettingsModal.js",
        "frontend/src/main.js",
        "frontend/src/utils/router.js",
        "frontend/src/pages/Admin/index.js",
        "frontend/src/pages/Admin/shared/AdminSidebar.js",
        "frontend/src/pages/Admin/News/index.js",
        "frontend/src/pages/Admin/Products/ProductForm.js",
        "frontend/src/pages/Admin/Settings/index.js",
        "frontend/src/pages/NewsList/index.js",
        "frontend/src/pages/NewsDetail/index.js",
        "frontend/src/pages/Home/AnnouncementBar.js",
        "frontend/src/pages/Home/PromoBanner.js",
        "frontend/src/pages/Home/BrandStory.js",
        "frontend/src/pages/Home/Newsletter.js",
        "frontend/src/pages/Home/CategoryBanners.js",
        "frontend/src/pages/ProductDetail/RelatedProducts.js",
        "backend/public/image/settings/logo_icon.png",
        "frontend/src/assets/logo_icon.png",
    ]
    
    for rel_path in files_to_upload:
        local_path = os.path.join(LOCAL_BASE, rel_path)
        if not os.path.exists(local_path):
            print(f"Warning: Local file {local_path} does not exist. Skipping.")
            continue
        remote_path = f"{REMOTE_BASE}/{rel_path}"
        upload_file(ftp, local_path, remote_path)
        
    ftp.quit()
    print("Frontend deployment finished successfully!")

if __name__ == "__main__":
    main()
