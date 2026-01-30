# 🚀 Quick Start Guide

Get your Fanfiction Manager up and running in minutes!

## Installation (First Time Only)

### Windows

1. **Open Command Prompt or PowerShell** in the `fanfiction-manager` folder

2. **Install dependencies:**
```powershell
pip install -r requirements.txt
```

3. **Run the application:**
```powershell
.\start.bat
```

Or manually:
```powershell
cd backend
python app.py
```

Then open your browser to: `http://localhost:5000`

### Mac/Linux

1. **Open Terminal** in the `fanfiction-manager` folder

2. **Make the start script executable:**
```bash
chmod +x start.sh
```

3. **Install dependencies:**
```bash
pip3 install -r requirements.txt
```

4. **Run the application:**
```bash
./start.sh
```

Or manually:
```bash
cd backend
python3 app.py
```

Then open your browser to: `http://localhost:5000`

## First Steps

### 1. Create Your First Project

1. Click "Projects" in the sidebar (or it's already selected)
2. Click the "+ New Project" button
3. Enter:
   - **Title**: e.g., "My Awesome Fanfic"
   - **Description**: Brief summary of your story
4. Click "Create"

### 2. Start Writing

1. Click "Editor" in the sidebar
2. Select your project from the dropdown
3. Click "+ New Chapter"
4. Give your chapter a title
5. Start writing in the large text area
6. Your work is automatically saved every 2 seconds!

### 3. Check Your Grammar

1. Write some content in the editor
2. Click the "✓ Check Grammar" button
3. Review issues in the sidebar
4. Click on any issue to jump to it in your text

### 4. Add Characters

1. Click "Characters" in the sidebar
2. Select your project
3. Click "+ New Character"
4. Fill in:
   - **Name**: Character name
   - **Role**: Protagonist, Antagonist, Supporting, or Minor
   - **Description**: Appearance, personality, background
   - **Character Arc**: How they develop through the story
   - **Traits**: Comma-separated (e.g., "brave, impulsive, loyal")
5. Click "Save"

### 5. Track Plot Lines

1. Click "Plot Lines" in the sidebar
2. Select your project
3. Click "+ New Plot Thread"
4. Define:
   - **Title**: Name of the plot thread
   - **Type**: Main Plot, Subplot, Character Arc, or Mystery
   - **Status**: Planned, In Progress, or Resolved
   - **Description**: What this plot line is about
   - **Notes**: Foreshadowing, resolution ideas, etc.
5. Click "Save"

### 6. Get AI Suggestions

1. Click "AI Assistant" in the sidebar
2. Choose what you need help with:
   - **📈 Plot Ideas**: Get suggestions for story direction
   - **👤 Character Development**: Ideas for character growth
   - **💬 Dialogue Tips**: Improve your conversations
   - **✨ Writing Tips**: General writing advice
3. (Optional) Add context about your story in the text area
4. Review the suggestions that appear

## Tips & Tricks

### 💾 Saving
- Your work **auto-saves** after 2 seconds of inactivity
- Click "💾 Save" button to save immediately
- All data is stored locally in the `data/` folder

### 📊 Writing Stats
- See real-time word, character, and paragraph counts
- Located in the left sidebar when editing

### 🔍 Grammar Highlighting
- Click on any grammar issue to highlight it in your text
- Issues are color-coded by severity

### 🗂️ Organization
- Create multiple projects for different stories
- Each project can have unlimited chapters
- Characters and plots are project-specific

### 📱 Responsive Design
- Works on desktop, tablet, and mobile
- Sidebar collapses on smaller screens

## Common Questions

### Where is my data stored?
All your stories, characters, and plots are saved in the `data/` folder as JSON files:
- `projects.json` - Your stories and chapters
- `characters.json` - Character profiles
- `plots.json` - Plot threads

### Can I backup my work?
Yes! Simply copy the entire `data/` folder. You can:
- Copy it to cloud storage (Dropbox, Google Drive, etc.)
- Add it to version control (Git)
- Keep multiple dated backups

### Can I export my stories?
Currently, your stories are stored in JSON format. You can:
1. Copy/paste content from the editor to any word processor
2. Access the JSON files directly in the `data/` folder
3. Future versions may include export features (PDF, EPUB, DOCX)

### What if I close the browser?
No problem! Your data is saved on your computer. Just:
1. Restart the backend server
2. Open `http://localhost:5000` again
3. All your work will be there

### Can I use this offline?
Yes! Once installed, the app runs entirely on your computer. No internet connection needed (except for initial package installation).

### Grammar checker not working?
The app tries to use LanguageTool for advanced grammar checking. If it's not available:
- It falls back to basic pattern matching
- You'll still get common error detection
- For full features, ensure Java is installed (LanguageTool requirement)

## Keyboard Shortcuts

While in the editor:
- `Ctrl+S` (Mac: `Cmd+S`) - Save (browser default, triggers auto-save)
- Use your browser's Find function to search within your text

## Need More Help?

See the main README.md for:
- Detailed feature documentation
- API endpoints
- Customization options
- Troubleshooting
- Technical details

---

Happy writing! Start crafting your next masterpiece! ✨📖
