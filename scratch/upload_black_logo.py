import ftplib

FTP_HOST = "203.171.31.7"
FTP_USER = "u9837c42a"
FTP_PASS = "wvXgFAlpdzkNPUA@1"

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
        except ftplib.error_perm:
            pass

def main():
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, 21)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.encoding = "utf-8"
    
    local_logo_path = r"c:\laragon\www\venixwatch\backend\public\image\settings\logo_icon.png"
    
    # Upload to /httpdocs/backend/public/image/settings/logo_icon.png
    remote_logo_path = "/httpdocs/backend/public/image/settings/logo_icon.png"
    create_remote_dir_recursive(ftp, "/httpdocs/backend/public/image/settings")
    print(f"Uploading logo to {remote_logo_path}...")
    with open(local_logo_path, "rb") as f:
        ftp.storbinary(f"STOR {remote_logo_path}", f)
        
    # Upload to /httpdocs/frontend/src/assets/logo_icon.png
    remote_frontend_path = "/httpdocs/frontend/src/assets/logo_icon.png"
    create_remote_dir_recursive(ftp, "/httpdocs/frontend/src/assets")
    print(f"Uploading logo to {remote_frontend_path}...")
    with open(local_logo_path, "rb") as f:
        ftp.storbinary(f"STOR {remote_frontend_path}", f)
        
    ftp.quit()
    print("Logo uploaded successfully with solid black background!")

if __name__ == "__main__":
    main()
