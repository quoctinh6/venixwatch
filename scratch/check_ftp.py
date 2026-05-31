import ftplib

FTP_HOST = "203.171.31.7"
FTP_USER = "u9837c42a"
FTP_PASS = "wvXgFAlpdzkNPUA@1"

def main():
    print("Connecting to FTP...")
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, 21)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.encoding = "utf-8"
    print("Logged in. Listing /httpdocs/backend:")
    try:
        ftp.cwd("/httpdocs")
        files = ftp.nlst()
        print("Files in /httpdocs:")
        for f in files:
            print(" -", f)
        
        # Download .env if exists
        if ".env" in files:
            print("Downloading .env...")
            with open("scratch/remote_env.txt", "wb") as local_f:
                ftp.retrbinary("RETR .env", local_f.write)
            print("Downloaded remote .env to scratch/remote_env.txt")
    except Exception as e:
        print("Error:", e)
    finally:
        ftp.quit()

if __name__ == "__main__":
    main()
