import os
import ftplib
import subprocess

FTP_HOST = "203.171.31.7"
FTP_USER = "u9837c42a"
FTP_PASS = "wvXgFAlpdzkNPUA@1"
FTP_PORT = 21
REMOTE_BASE = "/httpdocs"

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

def get_tracked_files(local_base):
    try:
        # Run git ls-files to get all tracked files
        result = subprocess.run(
            ["git", "ls-files"],
            cwd=local_base,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        files = result.stdout.splitlines()
        return files
    except Exception as e:
        print(f"Error running git ls-files: {e}")
        return []

def main():
    local_base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print(f"Local project base: {local_base}")
    
    tracked_files = get_tracked_files(local_base)
    if not tracked_files:
        print("No tracked files found or not a git repository.")
        return
        
    ftp = get_ftp_connection()
    
    uploaded_count = 0
    skipped_count = 0
    
    for rel_path in tracked_files:
        # Normalize path separators
        rel_path = rel_path.replace("\\", "/")
        
        # Exclude deployment/utility scripts and settings to keep remote clean
        if rel_path.startswith("scratch/") or rel_path.startswith(".vscode/"):
            print(f"Skipping utility/setting file: {rel_path}")
            skipped_count += 1
            continue
            
        local_path = os.path.join(local_base, rel_path)
        
        # Verify if the file exists locally (in case it was deleted but still tracked)
        if not os.path.exists(local_path):
            print(f"Skipping deleted file: {rel_path}")
            skipped_count += 1
            continue
            
        remote_path = f"{REMOTE_BASE}/{rel_path}"
        upload_file(ftp, local_path, remote_path)
        uploaded_count += 1
        
    ftp.quit()
    print("\n=============================================")
    print("Deployment finished successfully!")
    print(f"Uploaded: {uploaded_count} files")
    print(f"Skipped/Excluded: {skipped_count} files")
    print("=============================================")

if __name__ == "__main__":
    main()
