<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\Config;

class Mailer
{
    /**
     * Send an HTML email via SMTP or fallback to PHP mail()
     */
    public static function send(string $to, string $subject, string $message, string $fromName = 'Venix Watch', string $fromEmail = 'no-reply@donghoatuan.vn'): bool
    {
        $host = Config::get('SMTP_HOST');
        if (empty($host)) {
            // Fallback to PHP mail()
            $headers = "MIME-Version: 1.0" . "\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
            $headers .= "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>" . "\r\n";
            return mail($to, $subject, $message, $headers);
        }

        $port = (int)Config::get('SMTP_PORT', 587);
        $user = Config::get('SMTP_USER');
        $pass = Config::get('SMTP_PASS');
        $secure = Config::get('SMTP_SECURE'); // 'tls' or 'ssl' or empty

        if (!empty($user)) {
            $fromEmail = $user;
        }

        try {
            $remoteHost = $host;
            if (strtolower($secure) === 'ssl') {
                $remoteHost = 'ssl://' . $host;
            }
            
            $socket = fsockopen($remoteHost, $port, $errno, $errstr, 15);
            if (!$socket) {
                throw new \Exception("SMTP Connection failed: {$errstr} ({$errno})");
            }

            $read = function() use ($socket) {
                $response = '';
                while ($line = fgets($socket, 512)) {
                    $response .= $line;
                    if (isset($line[3]) && $line[3] === ' ') {
                        break;
                    }
                }
                return $response;
            };
            $write = fn($cmd) => fwrite($socket, $cmd . "\r\n");

            $read(); // Server welcome banner
            $write("EHLO localhost"); $read();
            
            // Handle STARTTLS
            if (strtolower($secure) === 'tls') {
                $write("STARTTLS");
                $response = $read();
                if (!str_starts_with($response, '220')) {
                    throw new \Exception("STARTTLS failed: " . $response);
                }
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                $write("EHLO localhost"); $read();
            }

            if (!empty($user) && !empty($pass)) {
                $write("AUTH LOGIN");
                $response = $read();
                if (!str_starts_with($response, '334')) {
                    throw new \Exception("AUTH LOGIN failed: " . $response);
                }
                $write(base64_encode($user));
                $response = $read();
                if (!str_starts_with($response, '334')) {
                    throw new \Exception("AUTH USER failed: " . $response);
                }
                $write(base64_encode($pass));
                $response = $read();
                if (!str_starts_with($response, '235')) {
                    throw new \Exception("AUTH PASS failed: " . $response);
                }
            }

            $write("MAIL FROM:<{$fromEmail}>"); $read();
            $write("RCPT TO:<{$to}>"); $read();
            $write("DATA"); $read();

            $headers = [
                "MIME-Version: 1.0",
                "Content-type: text/html; charset=UTF-8",
                "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>",
                "To: <{$to}>",
                "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=",
                "Date: " . date('r')
            ];

            $write(implode("\r\n", $headers));
            $write("");
            $write($message);
            $write("."); $read();
            $write("QUIT"); $read();
            fclose($socket);
            return true;
        } catch (\Throwable $t) {
            error_log("SMTP Mailer Error: " . $t->getMessage());
            // Last resort fallback to php mail()
            $headers = "MIME-Version: 1.0" . "\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
            $headers .= "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>" . "\r\n";
            return mail($to, $subject, $message, $headers);
        }
    }
}
