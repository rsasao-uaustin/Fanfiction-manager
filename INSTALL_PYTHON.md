# 🐍 Python Installation Guide for Windows

Python is required to run the Fanfiction Manager. Follow these steps to install it.

## Quick Installation (Recommended)

### Option 1: Microsoft Store (Easiest)

1. **Open Microsoft Store** on your Windows computer
2. **Search for "Python 3.12"** or "Python 3.11"
3. **Click "Install"** on the official Python app
4. **Wait for installation** to complete
5. **Restart your terminal/PowerShell** after installation

### Option 2: Official Python Website (Recommended for Developers)

1. **Visit**: https://www.python.org/downloads/
2. **Click "Download Python 3.x.x"** (latest version)
3. **Run the installer**
4. **IMPORTANT**: Check the box that says **"Add Python to PATH"** ✅
5. **Click "Install Now"**
6. **Wait for installation** to complete
7. **Restart your terminal/PowerShell**

## Verify Installation

After installing Python, open a **new** PowerShell window and run:

```powershell
python --version
```

You should see something like:
```
Python 3.12.0
```

If you see this, Python is installed correctly!

## Install Dependencies

Once Python is installed, navigate to the fanfiction-manager folder and run:

```powershell
cd C:\Users\riosa\polaris_ideas_projects\fanfiction-manager
python -m pip install -r requirements.txt
```

**Note**: Use `python -m pip` instead of just `pip` - this works even if pip isn't in your PATH.

## Alternative: Using Python Launcher

If `python` doesn't work, try:

```powershell
py -m pip install -r requirements.txt
```

## Troubleshooting

### "python is not recognized"
- Make sure you checked "Add Python to PATH" during installation
- Restart your terminal/PowerShell
- Try using `py` instead of `python`

### "pip is not recognized"
- Use `python -m pip` instead of just `pip`
- Or use `py -m pip` if you have the Python launcher

### Permission Errors
If you get permission errors, try:

```powershell
python -m pip install --user -r requirements.txt
```

This installs packages to your user directory instead of system-wide.

## After Installation

Once Python and dependencies are installed, you can start the app:

```powershell
cd backend
python app.py
```

Or use the start script:

```powershell
.\start.bat
```

## Need More Help?

- **Python Official Docs**: https://docs.python.org/3/
- **Python Installation Guide**: https://wiki.python.org/moin/BeginnersGuide/Download
- **Stack Overflow**: Search for "python not recognized windows"

---

**Once Python is installed, you're ready to start writing!** ✨
