package com.qlskdd.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.qlskdd.exception.BusinessException;
import org.springframework.http.HttpStatus;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

// B4.5-T2: sinh ảnh QR (PNG) từ mã đăng ký — nội dung QR chính là Registration.code,
// quét ra chuỗi này rồi gọi thẳng POST /api/v1/check-in/scan (B4.5-T3), không cần payload
// JSON phức tạp trong QR.
public final class QrCodeUtil {

    private static final int DEFAULT_SIZE = 300;

    private QrCodeUtil() {
    }

    public static byte[] generatePng(String content) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, DEFAULT_SIZE, DEFAULT_SIZE);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return out.toByteArray();
        } catch (WriterException | IOException ex) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể sinh mã QR");
        }
    }
}
