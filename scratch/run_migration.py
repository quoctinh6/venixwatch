import ftplib
import urllib.request
import os

FTP_HOST = "203.171.31.7"
FTP_USER = "u9837c42a"
FTP_PASS = "wvXgFAlpdzkNPUA@1"

def main():
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, 21)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.encoding = "utf-8"
    
    local_php = r"c:\laragon\www\venixwatch\scratch\run_migration.php"
    remote_php = "/httpdocs/backend/public/run_migration.php"
    
    print(f"Uploading local {local_php} to remote {remote_php}...")
    with open(local_php, "rb") as f:
        ftp.storbinary(f"STOR {remote_php}", f)
        
    ftp.quit()
    
    direct_url = "https://venixwatchvn464.mbws.vn/backend/public/run_migration.php"
    print(f"Calling migration script via HTTP: {direct_url}")
    try:
        req = urllib.request.Request(direct_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            print("Response:")
            print(res_body)
    except Exception as e:
        print("Error calling URL:", e)
        
    # Clean up remote
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, 21)
    ftp.login(FTP_USER, FTP_PASS)
    try:
        ftp.delete(remote_php)
        print("Deleted temporary script from remote FTP.")
    except Exception as e:
        print("Failed to delete remote script:", e)
    ftp.quit()

if __name__ == "__main__":
    main()
