import ftplib
import io

FTP_HOST = "203.171.31.7"
FTP_USER = "u9837c42a"
FTP_PASS = "wvXgFAlpdzkNPUA@1"

def test_mode(pasv):
    print(f"\n--- Testing Mode: {'PASSIVE' if pasv else 'ACTIVE'} ---")
    try:
        ftp = ftplib.FTP()
        ftp.connect(FTP_HOST, 21, timeout=10)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.set_pasv(pasv)
        print("Logged in successfully.")
        
        print("Listing directory...")
        print(ftp.nlst("/httpdocs")[:5])
        
        print("Trying to upload a test file...")
        data = b"FTP TEST"
        ftp.storbinary("STOR /httpdocs/ftp_test.txt", io.BytesIO(data))
        print("Uploaded successfully!")
        
        # clean up
        ftp.delete("/httpdocs/ftp_test.txt")
        print("Cleaned up test file.")
        
        ftp.quit()
        return True
    except Exception as e:
        print("Failed with error:", e)
        return False

def main():
    print("Starting FTP mode tests...")
    pasv_ok = test_mode(True)
    active_ok = test_mode(False)
    print("\nResults:")
    print("Passive mode:", "OK" if pasv_ok else "FAILED")
    print("Active mode:", "OK" if active_ok else "FAILED")

if __name__ == "__main__":
    main()
