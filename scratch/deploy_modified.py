import os
import ftplib

FTP_HOST = "203.171.31.7"
FTP_USER = "u9837c42a"
FTP_PASS = "wvXgFAlpdzkNPUA@1"
FTP_PORT = 21
REMOTE_BASE = "/httpdocs"

FILES_TO_DEPLOY = [
    "backend/public/seed_kemil_products.php",
    "backend/public/list_brands.php",
    "backend/public/fix_admin_brands.php",
    "backend/src/Modules/Admin/Settings/SettingService.php",
    "kemil_products.json",
    "frontend/src/pages/Admin/Products/ProductForm.js",
    "frontend/src/pages/ProductDetail/ProductDetailPage.js",
    "frontend/src/pages/ProductDetail/ProductInfo.js",
    "frontend/src/pages/ProductDetail/ProductTabs.js",
    "frontend/src/services/adminService.js",
    "frontend/src/services/productService.js",
    "frontend/src/components/MainNavbar.js",
    "frontend/src/pages/Admin/Settings/MenuTab.js",
    "frontend/src/components/QuickSettingsModal.js",
    "frontend/src/pages/ProductList/ProductListFilterPanel.js",
    "frontend/src/pages/ProductList/ProductListPage.js",
    "frontend/src/services/brandService.js"
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
