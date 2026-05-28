# Tesseract OCR Installation Instructions

## Windows Installation

1. Download Tesseract installer from:
   https://github.com/UB-Mannheim/tesseract/wiki

2. Run the installer (tesseract-ocr-w64-setup-*.exe)

3. During installation, note the installation path (default: C:\Program Files\Tesseract-OCR)

4. Add Tesseract to your system PATH:
   - Open System Properties > Environment Variables
   - Edit the "Path" variable under System Variables
   - Add: C:\Program Files\Tesseract-OCR
   - Click OK

5. Restart your terminal/command prompt

6. Verify installation:
   ```bash
   tesseract --version
   ```

## Alternative: Set Tesseract Path in Code

If you don't want to modify PATH, you can set it in the code by adding this to your .env:
```
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

Then update the OCR service to use this path.
