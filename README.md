# 📖 Fanfiction Manager

A comprehensive, long-term fanfiction writing and management tool with advanced features including grammar checking, character tracking, plot management, and AI-powered story suggestions.

## ✨ Features

### 📝 Writing & Editing
- Clean, distraction-free editor with autosave
- Chapter organization and management
- Real-time word, character, and paragraph count
- Grammar and syntax error highlighting
- Import/export functionality

### 👥 Character Management
- Detailed character profiles
- Character arc tracking
- Relationship mapping
- Traits and development notes
- Visual organization by role (Protagonist, Antagonist, Supporting, Minor)

### 🧵 Plot Line Tracking
- Multiple plot thread management
- Status tracking (Planned, In Progress, Resolved)
- Plot types (Main Plot, Subplot, Character Arc, Mystery)
- Notes and foreshadowing tracking
- Visual organization of story threads

### 🤖 AI Story Assistant
- Plot development suggestions
- Character development ideas
- Dialogue improvement tips
- Writing style recommendations
- Context-aware suggestions

### ✓ Grammar & Syntax Checking
- Powered by LanguageTool for comprehensive grammar checking
- Fallback to built-in pattern matching
- Common error detection (capitalization, spacing, punctuation)
- Word usage suggestions (their/there/they're, your/you're, its/it's)
- Click-to-highlight errors in editor

## 🚀 Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Setup Steps

1. **Navigate to the project directory:**
```bash
cd fanfiction-manager
```

2. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

3. **Start the backend server:**
```bash
cd backend
python app.py
```

The server will start on `http://localhost:5000`

4. **Access the application:**
Open your web browser and navigate to:
```
http://localhost:5000
```

## 📁 Project Structure

```
fanfiction-manager/
├── backend/
│   └── app.py              # Flask backend server
├── frontend/
│   ├── index.html          # Main HTML structure
│   ├── styles.css          # Modern, responsive styles
│   └── app.js              # Frontend application logic
├── data/
│   ├── projects.json       # Project and chapter data
│   ├── characters.json     # Character profiles
│   └── plots.json          # Plot thread information
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## 💡 Usage Guide

### Creating a New Project

1. Click on "Projects" in the sidebar
2. Click the "+ New Project" button
3. Enter a title and description
4. Click "Create"

### Writing Your Story

1. Click on "Editor" in the sidebar
2. Select your project from the dropdown
3. Click "+ New Chapter" to add a chapter
4. Start writing in the editor
5. Changes are automatically saved after 2 seconds of inactivity
6. Click "💾 Save" to save immediately
7. Click "✓ Check Grammar" to scan for errors

### Managing Characters

1. Click on "Characters" in the sidebar
2. Select your project
3. Click "+ New Character" to add a character
4. Fill in details:
   - Name and role
   - Physical description and personality
   - Character arc and development
   - Key traits
5. Click "Save"

### Tracking Plot Lines

1. Click on "Plot Lines" in the sidebar
2. Select your project
3. Click "+ New Plot Thread"
4. Define the plot:
   - Title and type (Main, Subplot, Character, Mystery)
   - Current status (Planned, In Progress, Resolved)
   - Description and notes
5. Click "Save"

### Getting AI Suggestions

1. Click on "AI Assistant" in the sidebar
2. Choose a suggestion type:
   - 📈 Plot Ideas
   - 👤 Character Development
   - 💬 Dialogue Tips
   - ✨ Writing Tips
3. Optionally provide context about your story
4. Review the generated suggestions

## 🎨 Features in Detail

### Grammar Checking

The grammar checker uses two methods:

1. **LanguageTool** (Primary): Advanced grammar checking with detailed suggestions
2. **Pattern Matching** (Fallback): Basic error detection for common issues

Detected issues include:
- Capitalization errors
- Spacing problems
- Punctuation mistakes
- Common word confusions
- And many more...

### Character Arc Tracking

Keep detailed notes on how your characters evolve:
- Initial state and motivations
- Key development points
- Relationship changes
- Growth and transformation
- Final resolution

### Plot Thread Management

Organize complex storylines:
- **Main Plot**: Primary story arc
- **Subplot**: Secondary storylines
- **Character Arc**: Individual character journeys
- **Mystery**: Questions and revelations

Track status:
- **Planned**: Not yet introduced
- **In Progress**: Currently developing
- **Resolved**: Completed

### Data Storage

All data is stored locally in JSON files in the `data/` directory:
- Easy to backup
- Version control friendly
- Portable between systems
- No database setup required

## 🔧 Customization

### Adding AI Integration

The current AI suggestions are template-based. To integrate with real AI services:

1. Open `backend/app.py`
2. Find the `generate_suggestions()` function
3. Replace with your AI API calls (OpenAI, Anthropic, etc.)

Example with OpenAI:
```python
import openai

def generate_suggestions(context, suggestion_type):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a creative writing assistant."},
            {"role": "user", "content": f"Provide {suggestion_type} suggestions for: {context}"}
        ]
    )
    # Parse and return suggestions
```

### Styling

All styles are in `frontend/styles.css` using CSS custom properties (variables) for easy theming:
- Colors: `--primary-color`, `--secondary-color`, etc.
- Spacing: `--sidebar-width`, padding values
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`

## 🛠️ Technical Details

### Backend (Python/Flask)
- RESTful API architecture
- CORS enabled for development
- JSON-based data storage
- Modular route structure

### Frontend (HTML/CSS/JavaScript)
- Single-page application (SPA)
- Vanilla JavaScript (no framework dependencies)
- Responsive design
- Modern CSS with Grid and Flexbox

### API Endpoints

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/<id>` - Update project
- `DELETE /api/projects/<id>` - Delete project
- `POST /api/projects/<id>/chapters` - Add chapter
- `PUT /api/projects/<id>/chapters/<id>` - Update chapter
- `DELETE /api/projects/<id>/chapters/<id>` - Delete chapter
- `POST /api/check-grammar` - Check grammar
- `GET /api/projects/<id>/characters` - List characters
- `POST /api/projects/<id>/characters` - Add character
- `PUT /api/projects/<id>/characters/<id>` - Update character
- `DELETE /api/projects/<id>/characters/<id>` - Delete character
- `GET /api/projects/<id>/plots` - List plot threads
- `POST /api/projects/<id>/plots` - Add plot thread
- `PUT /api/projects/<id>/plots/<id>` - Update plot thread
- `DELETE /api/projects/<id>/plots/<id>` - Delete plot thread
- `POST /api/ai-suggest` - Get AI suggestions

## 🐛 Troubleshooting

### Port Already in Use
If port 5000 is already in use, modify `backend/app.py`:
```python
app.run(debug=True, port=5001)  # Change to different port
```

And update the API URL in `frontend/app.js`:
```javascript
const API_URL = 'http://localhost:5001/api';
```

### Grammar Checker Not Working
If LanguageTool fails to install or run:
1. The app will fall back to basic pattern matching
2. For full functionality, ensure Java is installed (required by LanguageTool)
3. Alternative: Use the built-in checks which cover common issues

### Data Loss Prevention
Regular backups are recommended:
```bash
# Backup data directory
cp -r data/ data_backup_$(date +%Y%m%d)/
```

## 🚧 Future Enhancements

Potential features for future development:
- [ ] Cloud synchronization
- [ ] Export to various formats (PDF, EPUB, DOCX)
- [ ] Timeline visualization
- [ ] Chapter dependency graphs
- [ ] Collaborative editing
- [ ] Version control/revision history
- [ ] Advanced search and filtering
- [ ] Writing goals and progress tracking
- [ ] Integration with popular fanfiction platforms
- [ ] Mobile-responsive PWA version
- [ ] Dark mode toggle
- [ ] Custom themes

## 📝 License

This project is open source and available for personal use. Feel free to modify and extend it for your needs.

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 💬 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the Usage Guide
3. Examine the code comments for implementation details

---

Happy writing! 📖✨

May your stories flourish and your characters come alive!
