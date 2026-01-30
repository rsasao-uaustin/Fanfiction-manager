from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime
import re

# Try to import Google API libraries, but make them optional
try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False
    print("Note: Google API libraries not available. Google Docs import will be disabled.")

# Try to import language_tool_python, but make it optional
try:
    import language_tool_python
    LANGUAGE_TOOL_AVAILABLE = True
except ImportError:
    LANGUAGE_TOOL_AVAILABLE = False
    print("Note: language_tool_python not available. Using basic grammar checking.")

# Try to import OpenAI, but make it optional
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("Note: OpenAI library not available. AI suggestions will use template-based system.")

app = Flask(__name__)
CORS(app)

# Initialize grammar checker
tool = None

def get_grammar_tool():
    global tool
    if tool is None:
        if LANGUAGE_TOOL_AVAILABLE:
            try:
                tool = language_tool_python.LanguageTool('en-US')
            except Exception as e:
                print(f"Warning: LanguageTool not available ({e}). Grammar checking will be limited.")
                tool = None
        else:
            tool = None
    return tool

# Data paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
PROJECTS_FILE = os.path.join(DATA_DIR, 'projects.json')
CHARACTERS_FILE = os.path.join(DATA_DIR, 'characters.json')
PLOTS_FILE = os.path.join(DATA_DIR, 'plots.json')

def ensure_data_files():
    """Ensure all data files exist"""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    if not os.path.exists(PROJECTS_FILE):
        with open(PROJECTS_FILE, 'w') as f:
            json.dump([], f)
    
    if not os.path.exists(CHARACTERS_FILE):
        with open(CHARACTERS_FILE, 'w') as f:
            json.dump({}, f)
    
    if not os.path.exists(PLOTS_FILE):
        with open(PLOTS_FILE, 'w') as f:
            json.dump({}, f)

ensure_data_files()

# Helper functions
def load_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {} if filepath != PROJECTS_FILE else []

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Basic grammar checking without external tool
def basic_grammar_check(text):
    errors = []
    
    if not text:
        return errors
    
    # Common grammar issues
    patterns = [
        (r'\bi\b', 'Should "i" be capitalized to "I"?', 'capitalization'),
        (r'\s{2,}', 'Multiple spaces detected', 'spacing'),
        (r'[.!?]([A-Z])', 'Missing space after punctuation', 'spacing'),
        (r'\b(their|there|they\'re)\b', 'Check their/there/they\'re usage', 'word_choice'),
        (r'\b(your|you\'re)\b', 'Check your/you\'re usage', 'word_choice'),
        (r'\b(its|it\'s)\b', 'Check its/it\'s usage', 'word_choice'),
        (r'\.\.\.\.+', 'Too many periods - use three for ellipsis', 'punctuation'),
        (r'!!+', 'Excessive exclamation marks', 'punctuation'),
        (r'\?\?+', 'Excessive question marks', 'punctuation'),
    ]
    
    try:
        for pattern, message, error_type in patterns:
            for match in re.finditer(pattern, text):
                start = match.start()
                end = match.end()
                context_start = max(0, start - 20)
                context_end = min(len(text), end + 20)
                
                errors.append({
                    'offset': start,
                    'length': end - start,
                    'message': message,
                    'type': error_type,
                    'context': text[context_start:context_end],
                    'replacements': []
                })
    except Exception as e:
        print(f"Error in basic_grammar_check: {e}")
        return []
    
    return errors

# Routes
@app.route('/')
def index():
    return send_from_directory(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend'), 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend'), path)

# Project management
@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = load_json(PROJECTS_FILE)
    return jsonify(projects)

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.json
    projects = load_json(PROJECTS_FILE)
    
    new_project = {
        'id': str(datetime.now().timestamp()),
        'title': data.get('title', 'Untitled'),
        'description': data.get('description', ''),
        'chapters': [],
        'created': datetime.now().isoformat(),
        'modified': datetime.now().isoformat()
    }
    
    projects.append(new_project)
    save_json(PROJECTS_FILE, projects)
    
    return jsonify(new_project)

@app.route('/api/projects/<project_id>', methods=['PUT'])
def update_project(project_id):
    data = request.json
    projects = load_json(PROJECTS_FILE)
    
    for project in projects:
        if project['id'] == project_id:
            project.update(data)
            project['modified'] = datetime.now().isoformat()
            save_json(PROJECTS_FILE, projects)
            return jsonify(project)
    
    return jsonify({'error': 'Project not found'}), 404

@app.route('/api/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    projects = load_json(PROJECTS_FILE)
    projects = [p for p in projects if p['id'] != project_id]
    save_json(PROJECTS_FILE, projects)
    
    # Clean up related data
    characters = load_json(CHARACTERS_FILE)
    if project_id in characters:
        del characters[project_id]
        save_json(CHARACTERS_FILE, characters)
    
    plots = load_json(PLOTS_FILE)
    if project_id in plots:
        del plots[project_id]
        save_json(PLOTS_FILE, plots)
    
    return jsonify({'success': True})

# Chapter management
@app.route('/api/projects/<project_id>/chapters', methods=['POST'])
def add_chapter(project_id):
    data = request.json
    projects = load_json(PROJECTS_FILE)
    
    for project in projects:
        if project['id'] == project_id:
            new_chapter = {
                'id': str(datetime.now().timestamp()),
                'title': data.get('title', 'Untitled Chapter'),
                'content': data.get('content', ''),
                'created': datetime.now().isoformat(),
                'modified': datetime.now().isoformat()
            }
            project['chapters'].append(new_chapter)
            project['modified'] = datetime.now().isoformat()
            save_json(PROJECTS_FILE, projects)
            return jsonify(new_chapter)
    
    return jsonify({'error': 'Project not found'}), 404

@app.route('/api/projects/<project_id>/chapters/<chapter_id>', methods=['PUT'])
def update_chapter(project_id, chapter_id):
    data = request.json
    projects = load_json(PROJECTS_FILE)
    
    for project in projects:
        if project['id'] == project_id:
            for chapter in project['chapters']:
                if chapter['id'] == chapter_id:
                    chapter.update(data)
                    chapter['modified'] = datetime.now().isoformat()
                    project['modified'] = datetime.now().isoformat()
                    save_json(PROJECTS_FILE, projects)
                    return jsonify(chapter)
    
    return jsonify({'error': 'Chapter not found'}), 404

@app.route('/api/projects/<project_id>/chapters/<chapter_id>', methods=['DELETE'])
def delete_chapter(project_id, chapter_id):
    projects = load_json(PROJECTS_FILE)
    
    for project in projects:
        if project['id'] == project_id:
            project['chapters'] = [c for c in project['chapters'] if c['id'] != chapter_id]
            project['modified'] = datetime.now().isoformat()
            save_json(PROJECTS_FILE, projects)
            return jsonify({'success': True})
    
    return jsonify({'error': 'Project not found'}), 404

@app.route('/api/projects/<project_id>/chapters/reorder', methods=['PUT'])
def reorder_chapters(project_id):
    """
    Reorder chapters for a project.
    Body:
      { "order": ["chapterId1", "chapterId2", ...] }
    """
    data = request.json or {}
    order = data.get('order', [])

    if not isinstance(order, list) or not all(isinstance(x, str) for x in order):
        return jsonify({'error': 'order must be a list of chapter id strings'}), 400

    projects = load_json(PROJECTS_FILE)
    for project in projects:
        if project['id'] != project_id:
            continue

        chapters = project.get('chapters', [])
        chapters_by_id = {c.get('id'): c for c in chapters if isinstance(c, dict) and c.get('id')}

        # Validate: provided IDs must exist
        missing = [cid for cid in order if cid not in chapters_by_id]
        if missing:
            return jsonify({'error': 'Some chapter IDs were not found in this project', 'missing': missing}), 400

        # Keep any chapters not mentioned at the end (shouldn't happen, but safe)
        remaining = [c for c in chapters if c.get('id') not in order]
        new_chapters = [chapters_by_id[cid] for cid in order] + remaining

        project['chapters'] = new_chapters
        project['modified'] = datetime.now().isoformat()
        save_json(PROJECTS_FILE, projects)

        return jsonify({'success': True, 'chapter_count': len(new_chapters)})

    return jsonify({'error': 'Project not found'}), 404

# Grammar checking
@app.route('/api/check-grammar', methods=['POST'])
def check_grammar():
    try:
        if not request.json:
            return jsonify({'error': 'No data provided', 'errors': []}), 400
        
        data = request.json
        text = data.get('text', '')
        
        if not isinstance(text, str):
            return jsonify({'error': 'Text must be a string', 'errors': []}), 400
        
        errors = []
        
        # Try to use LanguageTool if available
        grammar_tool = get_grammar_tool()
        if grammar_tool:
            try:
                matches = grammar_tool.check(text)
                for match in matches:
                    try:
                        errors.append({
                            'offset': match.offset,
                            'length': match.errorLength,
                            'message': match.message,
                            'replacements': match.replacements[:3] if hasattr(match, 'replacements') else [],
                            'type': match.ruleId if hasattr(match, 'ruleId') else 'unknown',
                            'context': match.context if hasattr(match, 'context') else ''
                        })
                    except Exception as e:
                        print(f"Error processing match: {e}")
                        continue
            except Exception as e:
                print(f"LanguageTool error, falling back to basic check: {e}")
                # Fall back to basic checking
                errors = basic_grammar_check(text)
        else:
            # Use basic checking
            errors = basic_grammar_check(text)
        
        return jsonify({'errors': errors})
    
    except Exception as e:
        print(f"Error in check_grammar endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'errors': []}), 500

# Character management
@app.route('/api/projects/<project_id>/characters', methods=['GET'])
def get_characters(project_id):
    characters = load_json(CHARACTERS_FILE)
    return jsonify(characters.get(project_id, []))

@app.route('/api/projects/<project_id>/characters', methods=['POST'])
def add_character(project_id):
    data = request.json
    characters = load_json(CHARACTERS_FILE)
    
    if project_id not in characters:
        characters[project_id] = []
    
    new_character = {
        'id': str(datetime.now().timestamp()),
        'name': data.get('name', 'Unnamed Character'),
        'description': data.get('description', ''),
        'role': data.get('role', 'Supporting'),
        'arc': data.get('arc', ''),
        'traits': data.get('traits', []),
        'relationships': data.get('relationships', []),
        'development': data.get('development', []),
        'created': datetime.now().isoformat()
    }
    
    characters[project_id].append(new_character)
    save_json(CHARACTERS_FILE, characters)
    
    return jsonify(new_character)

@app.route('/api/projects/<project_id>/characters/<character_id>', methods=['PUT'])
def update_character(project_id, character_id):
    data = request.json
    characters = load_json(CHARACTERS_FILE)
    
    if project_id in characters:
        for character in characters[project_id]:
            if character['id'] == character_id:
                character.update(data)
                save_json(CHARACTERS_FILE, characters)
                return jsonify(character)
    
    return jsonify({'error': 'Character not found'}), 404

@app.route('/api/projects/<project_id>/characters/<character_id>', methods=['DELETE'])
def delete_character(project_id, character_id):
    characters = load_json(CHARACTERS_FILE)
    
    if project_id in characters:
        characters[project_id] = [c for c in characters[project_id] if c['id'] != character_id]
        save_json(CHARACTERS_FILE, characters)
        return jsonify({'success': True})
    
    return jsonify({'error': 'Project not found'}), 404

# Plot management
@app.route('/api/projects/<project_id>/plots', methods=['GET'])
def get_plots(project_id):
    plots = load_json(PLOTS_FILE)
    return jsonify(plots.get(project_id, []))

@app.route('/api/projects/<project_id>/plots', methods=['POST'])
def add_plot(project_id):
    data = request.json
    plots = load_json(PLOTS_FILE)
    
    if project_id not in plots:
        plots[project_id] = []
    
    new_plot = {
        'id': str(datetime.now().timestamp()),
        'title': data.get('title', 'Untitled Plot Thread'),
        'description': data.get('description', ''),
        'status': data.get('status', 'planned'),
        'type': data.get('type', 'main'),
        'chapters': data.get('chapters', []),
        'characters': data.get('characters', []),
        'notes': data.get('notes', ''),
        'created': datetime.now().isoformat()
    }
    
    plots[project_id].append(new_plot)
    save_json(PLOTS_FILE, plots)
    
    return jsonify(new_plot)

@app.route('/api/projects/<project_id>/plots/<plot_id>', methods=['PUT'])
def update_plot(project_id, plot_id):
    data = request.json
    plots = load_json(PLOTS_FILE)
    
    if project_id in plots:
        for plot in plots[project_id]:
            if plot['id'] == plot_id:
                plot.update(data)
                save_json(PLOTS_FILE, plots)
                return jsonify(plot)
    
    return jsonify({'error': 'Plot not found'}), 404

@app.route('/api/projects/<project_id>/plots/<plot_id>', methods=['DELETE'])
def delete_plot(project_id, plot_id):
    plots = load_json(PLOTS_FILE)
    
    if project_id in plots:
        plots[project_id] = [p for p in plots[project_id] if p['id'] != plot_id]
        save_json(PLOTS_FILE, plots)
        return jsonify({'success': True})
    
    return jsonify({'error': 'Project not found'}), 404

# Get full project context (all chapters)
@app.route('/api/projects/<project_id>/full-context', methods=['GET'])
def get_project_full_context(project_id):
    """Get full project context including all chapters"""
    try:
        projects = load_json(PROJECTS_FILE)
        project = None
        for p in projects:
            if p['id'] == project_id:
                project = p
                break
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get characters and plots for additional context
        characters = load_json(CHARACTERS_FILE).get(project_id, [])
        plots = load_json(PLOTS_FILE).get(project_id, [])
        
        # Build full context
        context = {
            'project': {
                'title': project.get('title', ''),
                'description': project.get('description', ''),
                'chapters': []
            },
            'characters': characters,
            'plots': plots
        }
        
        # Add all chapters
        for chapter in project.get('chapters', []):
            context['project']['chapters'].append({
                'title': chapter.get('title', ''),
                'content': chapter.get('content', '')
            })
        
        return jsonify(context)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# AI Suggestions
@app.route('/api/ai-suggest', methods=['POST'])
def ai_suggest():
    data = request.json
    context = data.get('context', '')
    suggestion_type = data.get('type', 'general')
    project_id = data.get('project_id', None)
    use_full_story = data.get('use_full_story', False)
    
    # If use_full_story is True and project_id is provided, load full project context
    full_story_context = ''
    if use_full_story and project_id:
        try:
            projects = load_json(PROJECTS_FILE)
            project = None
            for p in projects:
                if p['id'] == project_id:
                    project = p
                    break
            
            if project:
                # Build full story text from all chapters IN SERIALIZATION ORDER
                # Chapters are stored in the order they appear in the array (maintained by reorder function)
                story_parts = []
                story_parts.append(f"Story Title: {project.get('title', 'Untitled')}\n")
                if project.get('description'):
                    story_parts.append(f"Description: {project.get('description', '')}\n\n")
                
                # Read chapters in the exact order they appear in the array (serialization order)
                chapters = project.get('chapters', [])
                story_parts.append(f"Total Chapters: {len(chapters)}\n")
                story_parts.append("=" * 80 + "\n")
                story_parts.append("READ ALL CHAPTERS IN THE ORDER PRESENTED BELOW (SERIALIZATION ORDER):\n")
                story_parts.append("=" * 80 + "\n\n")
                
                for i, chapter in enumerate(chapters, 1):
                    chapter_title = chapter.get('title', 'Untitled')
                    chapter_content = chapter.get('content', '')
                    story_parts.append(f"{'=' * 80}\n")
                    story_parts.append(f"CHAPTER {i} of {len(chapters)}: {chapter_title}\n")
                    story_parts.append(f"{'=' * 80}\n\n")
                    story_parts.append(chapter_content)
                    story_parts.append(f"\n\n[END OF CHAPTER {i}]\n\n")
                
                full_story_context = ''.join(story_parts)
        except Exception as e:
            print(f"Error loading full story context: {e}")
    
    # Combine context
    combined_context = full_story_context + ('\n\nAdditional context: ' + context if context else '')
    
    # Try to use OpenAI if available and API key is set
    openai_api_key = os.environ.get('OPENAI_API_KEY') or data.get('api_key')
    
    if OPENAI_AVAILABLE and openai_api_key:
        try:
            suggestions = get_openai_suggestions(combined_context, suggestion_type, openai_api_key)
            return jsonify({'suggestions': suggestions, 'source': 'openai'})
        except Exception as e:
            print(f"OpenAI error: {e}")
            # Fall back to template suggestions
            suggestions = generate_suggestions(context, suggestion_type)
            return jsonify({'suggestions': suggestions, 'source': 'template', 'error': str(e)})
    else:
        # Use template-based suggestions
        suggestions = generate_suggestions(context, suggestion_type)
        return jsonify({'suggestions': suggestions, 'source': 'template'})

# AI Chat endpoint
@app.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    """Handle chat conversations with AI"""
    data = request.json
    message = data.get('message', '')
    project_id = data.get('project_id', None)
    use_full_story = data.get('use_full_story', False)
    conversation_history = data.get('conversation_history', [])
    openai_api_key = os.environ.get('OPENAI_API_KEY') or data.get('api_key')
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    # Get story context if needed
    full_story_context = ''
    if use_full_story and project_id:
        try:
            projects = load_json(PROJECTS_FILE)
            project = None
            for p in projects:
                if p['id'] == project_id:
                    project = p
                    break
            
            if project:
                # Build full story text from all chapters IN SERIALIZATION ORDER
                story_parts = []
                story_parts.append(f"Story Title: {project.get('title', 'Untitled')}\n")
                if project.get('description'):
                    story_parts.append(f"Description: {project.get('description', '')}\n\n")
                
                chapters = project.get('chapters', [])
                story_parts.append(f"Total Chapters: {len(chapters)}\n")
                story_parts.append("=" * 80 + "\n")
                story_parts.append("READ ALL CHAPTERS IN THE ORDER PRESENTED BELOW (SERIALIZATION ORDER):\n")
                story_parts.append("=" * 80 + "\n\n")
                
                for i, chapter in enumerate(chapters, 1):
                    chapter_title = chapter.get('title', 'Untitled')
                    chapter_content = chapter.get('content', '')
                    story_parts.append(f"{'=' * 80}\n")
                    story_parts.append(f"CHAPTER {i} of {len(chapters)}: {chapter_title}\n")
                    story_parts.append(f"{'=' * 80}\n\n")
                    story_parts.append(chapter_content)
                    story_parts.append(f"\n\n[END OF CHAPTER {i}]\n\n")
                
                full_story_context = ''.join(story_parts)
        except Exception as e:
            print(f"Error loading full story context: {e}")
    
    # Try to use OpenAI if available
    if OPENAI_AVAILABLE and openai_api_key:
        try:
            response = get_openai_chat_response(message, full_story_context, conversation_history, openai_api_key)
            return jsonify({'response': response})
        except Exception as e:
            print(f"OpenAI chat error: {e}")
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'OpenAI API key is required for chat. Please add your API key.'}), 400

def get_openai_chat_response(message, story_context, conversation_history, api_key):
    """Get chat response from OpenAI with conversation history"""
    if not OPENAI_AVAILABLE:
        raise Exception("OpenAI library not available")
    
    client = OpenAI(api_key=api_key)
    
    # Build system prompt
    system_prompt = """You are a creative writing assistant helping an author with their story. 
You have access to their complete story (all chapters in serialization order).
Be helpful, constructive, and specific. Reference specific chapters, characters, and plot points when relevant.
If the story context is provided, use it to give context-aware responses."""
    
    # Build messages array
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add story context as a system message if available
    if story_context:
        messages.append({
            "role": "system", 
            "content": f"STORY CONTEXT (read all chapters in order):\n\n{story_context[:40000]}"
        })
    
    # Add conversation history (limit to last 10 messages to avoid token limits)
    for hist_msg in conversation_history[-10:]:
        messages.append(hist_msg)
    
    # Add current user message
    messages.append({"role": "user", "content": message})
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=1500
        )
        
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"OpenAI API error: {str(e)}")

def get_openai_suggestions(context, suggestion_type, api_key):
    """Get AI suggestions from OpenAI"""
    if not OPENAI_AVAILABLE:
        raise Exception("OpenAI library not available")
    
    client = OpenAI(api_key=api_key)
    
    # Build prompt based on suggestion type
    prompts = {
        'plot': """You are a creative writing assistant helping with plot development. 
Analyze the following story (read all chapters in order) and provide ONE comprehensive, detailed analysis with specific, actionable suggestions for plot development.
Focus on: conflicts, pacing, plot twists, subplot development, and narrative structure.
Be specific and reference elements from the story when possible. Reference specific chapters, characters, and plot points.""",
        'character': """You are a creative writing assistant helping with character development.
Analyze the following story (read all chapters in order) and provide ONE comprehensive, detailed analysis with specific, actionable suggestions for character development.
Focus on: character growth, relationships, motivations, consistency, and depth.
Reference specific characters, situations, and chapters from the story.""",
        'dialogue': """You are a creative writing assistant helping with dialogue improvement.
Analyze the following story (read all chapters in order) and provide ONE comprehensive, detailed analysis with specific, actionable suggestions for improving dialogue.
Focus on: natural speech patterns, subtext, character voice, conflict in dialogue, and showing emotion.
Reference specific dialogue examples and chapters from the story when possible.""",
        'general': """You are a creative writing assistant providing general writing advice.
Analyze the following story (read all chapters in order) and provide ONE comprehensive, detailed analysis with specific, actionable writing suggestions.
Focus on: style, pacing, description, show vs tell, and overall narrative quality.
Be constructive and reference specific parts of the story, including chapter numbers."""
    }
    
    system_prompt = prompts.get(suggestion_type, prompts['general'])
    
    user_prompt = f"""Please carefully read and analyze this complete story (all chapters are provided in serialization order):

{context[:50000]}  # Increased limit to allow more context

IMPORTANT: Read all chapters in the order they are presented. The chapters are numbered and appear in serialization order.

Provide ONE comprehensive, detailed analysis with:
- A clear, descriptive title summarizing your main insight
- A detailed description explaining your analysis and suggestions
- Specific references to chapters, characters, and plot points from the story
- Actionable recommendations for improvement

Format your response as a single, cohesive analysis (not a list of separate suggestions)."""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Using cost-effective model, can be changed to gpt-4
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000  # Increased for comprehensive single response
        )
        
        # Parse the response
        ai_response = response.choices[0].message.content
        
        # Try to parse structured suggestions, or create from text
        suggestions = parse_ai_suggestions(ai_response, suggestion_type)
        
        return suggestions
    except Exception as e:
        raise Exception(f"OpenAI API error: {str(e)}")

def parse_ai_suggestions(ai_text, category):
    """Parse AI response into a single structured suggestion"""
    # Extract title (first line or first sentence)
    lines = [l.strip() for l in ai_text.split('\n') if l.strip()]
    
    title = None
    description = ai_text
    
    # Try to find a title (first line that looks like a title)
    if lines:
        first_line = lines[0]
        # If first line is short and looks like a title (ends with colon or is short)
        if len(first_line) < 150 and (first_line.endswith(':') or not first_line.endswith('.')):
            title = first_line.rstrip(':').strip()
            # Use rest as description
            description = '\n'.join(lines[1:]) if len(lines) > 1 else first_line
        else:
            # Extract first sentence as title
            title_match = re.match(r'^([^.!?]+[.!?])', first_line)
            if title_match:
                title = title_match.group(1).strip()
                description = ai_text[len(title):].strip()
            else:
                # Use first 80 chars as title
                title = first_line[:80] + '...' if len(first_line) > 80 else first_line
                description = ai_text
    
    # If no good title found, create one from first sentence
    if not title or len(title) > 150:
        title_match = re.match(r'^([^.!?]+[.!?])', ai_text)
        if title_match:
            title = title_match.group(1).strip()
        else:
            title = ai_text[:80].strip() + '...' if len(ai_text) > 80 else ai_text.strip()
    
    # Return single suggestion object
    return [{
        'title': title[:200],  # Limit title length
        'description': description.strip(),
        'category': category
    }]

def generate_suggestions(context, suggestion_type):
    """Generate template story suggestions (fallback when OpenAI unavailable) - returns single suggestion"""
    # Return single template suggestion instead of multiple
    if suggestion_type == 'plot':
        return [{
            'title': 'Plot Development Suggestions',
            'description': 'Consider introducing a new obstacle or conflict that challenges your protagonist\'s goals. Create a secondary storyline that complements the main plot and adds depth to your narrative. Reveal something unexpected that changes the reader\'s understanding of the story.',
            'category': 'plot'
        }]
    elif suggestion_type == 'character':
        return [{
            'title': 'Character Development Suggestions',
            'description': 'Demonstrate how recent events have changed your character\'s perspective or behavior. Develop the dynamics between characters through dialogue or shared experiences. Share a relevant piece of your character\'s past that adds depth to their current situation.',
            'category': 'character'
        }]
    elif suggestion_type == 'dialogue':
        return [{
            'title': 'Dialogue Improvement Suggestions',
            'description': 'Make dialogue more interesting by having characters imply things rather than stating them directly. Use dialogue tags and body language to convey how characters feel during the conversation. Add tension through disagreement or misunderstanding between characters.',
            'category': 'dialogue'
        }]
    else:
        return [{
            'title': 'General Writing Suggestions',
            'description': 'Mix short, punchy sentences with longer, more complex ones for better rhythm. Instead of stating emotions directly, show them through actions and reactions. Engage multiple senses to make scenes more vivid and immersive.',
            'category': 'style'
        }]

# Google Docs Import
@app.route('/api/google/auth-url', methods=['GET'])
def get_google_auth_url():
    """Get Google OAuth authorization URL"""
    if not GOOGLE_API_AVAILABLE:
        return jsonify({'error': 'Google API libraries not available'}), 503
    
    try:
        # Note: This requires OAuth credentials file
        # For now, return instructions
        return jsonify({
            'error': 'OAuth setup required',
            'message': 'Please configure Google OAuth credentials. See README for instructions.',
            'setup_required': True
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/google/import', methods=['POST'])
def import_google_doc():
    """Import a Google Document"""
    if not GOOGLE_API_AVAILABLE:
        return jsonify({'error': 'Google API libraries not available'}), 503
    
    data = request.json
    doc_url = data.get('url', '')
    project_id = data.get('project_id', '')
    
    if not doc_url or not project_id:
        return jsonify({'error': 'Document URL and project ID are required'}), 400
    
    try:
        # Extract document ID from URL
        # Format: https://docs.google.com/document/d/DOCUMENT_ID/edit
        doc_id_match = re.search(r'/document/d/([a-zA-Z0-9-_]+)', doc_url)
        if not doc_id_match:
            return jsonify({'error': 'Invalid Google Docs URL format'}), 400
        
        doc_id = doc_id_match.group(1)
        
        # For now, return a message that manual setup is needed
        # In production, you would:
        # 1. Authenticate with Google OAuth
        # 2. Use the Google Docs API to fetch the document
        # 3. Parse the content
        # 4. Create chapters in the project
        
        return jsonify({
            'message': 'Google Docs import requires OAuth setup',
            'doc_id': doc_id,
            'instructions': 'Please see README for Google OAuth configuration'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/google/import-simple', methods=['POST'])
def import_google_doc_simple():
    """Import Google Document using document ID and access token (simplified)"""
    if not GOOGLE_API_AVAILABLE:
        return jsonify({'error': 'Google API libraries not available'}), 503
    
    data = request.json
    doc_id = data.get('doc_id', '')
    access_token = data.get('access_token', '')
    project_id = data.get('project_id', '')
    
    if not doc_id or not project_id:
        return jsonify({'error': 'Document ID and project ID are required'}), 400
    
    try:
        if not access_token:
            return jsonify({
                'error': 'Access token required',
                'message': 'Please authenticate with Google first',
                'auth_required': True
            }), 401
        
        # Create credentials from token
        creds = Credentials(token=access_token)
        
        # Build the Docs API service
        service = build('docs', 'v1', credentials=creds)
        
        # Get the document
        doc = service.documents().get(documentId=doc_id).execute()
        
        # Extract text content
        content = doc.get('body', {}).get('content', [])
        text_content = extract_text_from_doc(content)
        
        # Load projects
        projects = load_json(PROJECTS_FILE)
        project = None
        for p in projects:
            if p['id'] == project_id:
                project = p
                break
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Create a chapter from the imported document
        chapter_title = doc.get('title', 'Imported from Google Docs')
        new_chapter = {
            'id': str(datetime.now().timestamp()),
            'title': chapter_title,
            'content': text_content,
            'created': datetime.now().isoformat(),
            'modified': datetime.now().isoformat(),
            'imported_from': f'google_docs:{doc_id}'
        }
        
        project['chapters'].append(new_chapter)
        project['modified'] = datetime.now().isoformat()
        save_json(PROJECTS_FILE, projects)
        
        return jsonify({
            'success': True,
            'chapter': new_chapter,
            'message': f'Successfully imported "{chapter_title}"'
        }), 200
        
    except HttpError as e:
        return jsonify({'error': f'Google API error: {e}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def extract_text_from_doc(content_elements):
    """Extract plain text from Google Docs content structure"""
    text_parts = []
    
    for element in content_elements:
        if 'paragraph' in element:
            para = element['paragraph']
            if 'elements' in para:
                for elem in para['elements']:
                    if 'textRun' in elem:
                        text_parts.append(elem['textRun'].get('content', ''))
        elif 'table' in element:
            # Handle tables - extract text from cells
            table = element['table']
            if 'tableRows' in table:
                for row in table['tableRows']:
                    if 'tableCells' in row:
                        for cell in row['tableCells']:
                            if 'content' in cell:
                                text_parts.append(extract_text_from_doc(cell['content']))
    
    return ''.join(text_parts)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
