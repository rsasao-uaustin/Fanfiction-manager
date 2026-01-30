// API Base URL
const API_URL = 'http://localhost:5000/api';

// App State
const app = {
    currentProject: null,
    currentChapter: null,
    currentCharacter: null,
    currentPlot: null,
    chatHistory: [],  // Store conversation history for chat
    
    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.loadProjects();
        this.updateEditorStats();
    },
    
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Update active state
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Show corresponding view
                const view = item.dataset.view;
                this.showView(view);
            });
        });
    },
    
    setupEventListeners() {
        // Editor auto-save and stats update
        const editorContent = document.getElementById('editor-content');
        if (editorContent) {
            // Track quick triple-dash for header conversion
            this._dashTimes = [];
            editorContent.addEventListener('keydown', (e) => {
                // Keyboard shortcuts
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'b') {
                        e.preventDefault();
                        this.formatBold();
                        return;
                    }
                    if (e.key === 'i') {
                        e.preventDefault();
                        this.formatItalic();
                        return;
                    }
                }
                
                // Track dashes for header shortcut
                if (e.key === '-') {
                    const now = Date.now();
                    this._dashTimes.push(now);
                    if (this._dashTimes.length > 3) this._dashTimes.shift();
                } else {
                    // reset if user types something else
                    this._dashTimes = [];
                }
            });
            
            editorContent.addEventListener('input', () => {
                this.maybeConvertTripleDashToHeader();
                this.updateEditorStats();
                // Auto-save after 2 seconds of inactivity
                clearTimeout(this.saveTimeout);
                this.saveTimeout = setTimeout(() => this.saveChapter(true), 2000);
            });
            
            // Clean up pasted content (remove unwanted formatting)
            editorContent.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                document.execCommand('insertText', false, text);
            });
        }
        
        // Close modals on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    },

    // --- Rich Text Formatting Functions ---
    getEditor() {
        return document.getElementById('editor-content');
    },

    formatBold() {
        const editor = this.getEditor();
        if (!editor) return;
        editor.focus();
        
        // Use document.execCommand for bold formatting (actual HTML <strong> or <b>)
        document.execCommand('bold', false, null);
        this.updateEditorStats();
    },

    formatItalic() {
        const editor = this.getEditor();
        if (!editor) return;
        editor.focus();
        
        // Use document.execCommand for italic formatting (actual HTML <em> or <i>)
        document.execCommand('italic', false, null);
        this.updateEditorStats();
    },

    formatHorizontalLine() {
        const editor = this.getEditor();
        if (!editor) return;
        editor.focus();
        
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            // No selection, insert horizontal line at cursor
            const hr = document.createElement('hr');
            const range = document.createRange();
            range.setStart(editor, 0);
            range.collapse(true);
            range.insertNode(hr);
            // Add a line break after the hr for better editing
            const br = document.createElement('br');
            range.setStartAfter(hr);
            range.insertNode(br);
            range.setStartAfter(br);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            this.updateEditorStats();
            return;
        }
        
        const range = selection.getRangeAt(0);
        // Insert horizontal line at cursor position
        const hr = document.createElement('hr');
        range.insertNode(hr);
        // Add a line break after the hr
        const br = document.createElement('br');
        range.setStartAfter(hr);
        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        this.updateEditorStats();
    },

    maybeConvertTripleDashToHeader() {
        const editor = this.getEditor();
        if (!editor) return;
        const times = this._dashTimes || [];
        if (times.length < 3) return;

        const windowMs = times[times.length - 1] - times[0];
        if (windowMs > 1500) return;

        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        
        if (container.nodeType !== Node.TEXT_NODE) return;
        
        const text = container.textContent || '';
        const offset = range.startOffset;
        
        if (offset < 3) return;
        
        // Check if we just typed '---'
        if (text.slice(offset - 3, offset) !== '---') return;
        
        // Check if at start of line (only whitespace before)
        const beforeText = text.slice(0, offset - 3);
        if (beforeText.trim() !== '' && !beforeText.match(/\n\s*$/)) return;
        
        // Get text after the dashes
        const afterText = text.slice(offset);
        
        // Create horizontal line element
        const hr = document.createElement('hr');
        
        // Replace the text node content
        if (beforeText.trim() === '' || beforeText.endsWith('\n')) {
            // At start of line, replace the text node
            container.textContent = beforeText;
            container.parentNode.insertBefore(hr, container.nextSibling);
            // Add line break after hr for better editing
            const br = document.createElement('br');
            container.parentNode.insertBefore(br, hr.nextSibling);
            if (afterText) {
                const afterNode = document.createTextNode(afterText);
                container.parentNode.insertBefore(afterNode, br.nextSibling);
            }
        } else {
            // Split text node
            container.textContent = beforeText;
            container.parentNode.insertBefore(hr, container.nextSibling);
            const br = document.createElement('br');
            container.parentNode.insertBefore(br, hr.nextSibling);
            if (afterText) {
                const afterNode = document.createTextNode(afterText);
                container.parentNode.insertBefore(afterNode, br.nextSibling);
            }
        }
        
        // Move cursor after horizontal line
        const newRange = document.createRange();
        newRange.setStartAfter(hr.nextSibling || hr);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        this._dashTimes = [];
        this.updateEditorStats();

        // reset dash tracking so it doesn't re-trigger
        this._dashTimes = [];

        this.showNotification('Converted --- to header (# )', 'info');
    },
    
    showView(viewName) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });
        document.getElementById(`${viewName}-view`).classList.remove('hidden');
        
        // Load data for specific views
        if (viewName === 'editor') {
            this.populateProjectSelects();
        } else if (viewName === 'characters') {
            this.populateProjectSelects();
        } else if (viewName === 'plots') {
            this.populateProjectSelects();
        } else if (viewName === 'projects') {
            // Refresh projects list when switching to projects view
            this.loadProjects();
        } else if (viewName === 'ai-assistant') {
            this.populateProjectSelects();
            this.updateAIProjectInfo();
        }
    },
    
    // Projects
    async loadProjects() {
        try {
            const response = await fetch(`${API_URL}/projects`);
            const projects = await response.json();
            this.renderProjects(projects);
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showNotification('Error loading projects', 'error');
        }
    },
    
    renderProjects(projects) {
        const container = document.getElementById('projects-list');
        if (projects.length === 0) {
            container.innerHTML = '<p class="placeholder">No projects yet. Create your first project to get started!</p>';
            return;
        }
        
        container.innerHTML = projects.map(project => `
            <div class="project-card" onclick="app.openProject('${project.id}')">
                <h3>${this.escapeHtml(project.title)}</h3>
                <p>${this.escapeHtml(project.description || 'No description')}</p>
                <div class="project-meta">
                    <span>📝 ${project.chapters ? project.chapters.length : 0} chapters</span>
                    <span>🕒 ${this.formatDate(project.modified)}</span>
                </div>
                <div class="project-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-secondary" onclick="app.openProject('${project.id}')">
                        Open
                    </button>
                    <button class="btn btn-danger" onclick="app.deleteProject('${project.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    showNewProjectModal() {
        document.getElementById('project-title').value = '';
        document.getElementById('project-description').value = '';
        this.showModal('project-modal');
    },
    
    async createProject() {
        const title = document.getElementById('project-title').value;
        const description = document.getElementById('project-description').value;
        
        if (!title) {
            this.showNotification('Please enter a project title', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });
            
            if (response.ok) {
                this.closeModal('project-modal');
                this.loadProjects();
                this.showNotification('Project created successfully', 'success');
            }
        } catch (error) {
            console.error('Error creating project:', error);
            this.showNotification('Error creating project', 'error');
        }
    },
    
    openProject(projectId) {
        this.currentProject = projectId;
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector('[data-view="editor"]').classList.add('active');
        this.showView('editor');
        this.populateProjectSelects();
        document.getElementById('project-select').value = projectId;
        this.loadProjectChapters();
    },
    
    async deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/projects/${projectId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.loadProjects();
                this.showNotification('Project deleted', 'success');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            this.showNotification('Error deleting project', 'error');
        }
    },
    
    async populateProjectSelects() {
        try {
            const response = await fetch(`${API_URL}/projects`);
            const projects = await response.json();
            
            const selects = [
                'project-select',
                'characters-project-select',
                'plots-project-select',
                'ai-project-select'
            ];
            
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    const currentValue = select.value;
                    select.innerHTML = '<option value="">Select a project...</option>' +
                        projects.map(p => `<option value="${p.id}">${this.escapeHtml(p.title)}</option>`).join('');
                    if (currentValue) {
                        select.value = currentValue;
                    }
                }
            });
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    },
    
    async updateAIProjectInfo() {
        const projectId = document.getElementById('ai-project-select').value;
        const useFullStory = document.getElementById('use-full-story');
        
        if (!projectId) {
            if (useFullStory) {
                useFullStory.disabled = true;
                useFullStory.checked = false;
            }
            return;
        }
        
        if (useFullStory) {
            useFullStory.disabled = false;
        }
        
        // Show project info
        try {
            const response = await fetch(`${API_URL}/projects`);
            const projects = await response.json();
            const project = projects.find(p => p.id === projectId);
            
            if (project) {
                const chapterCount = project.chapters ? project.chapters.length : 0;
                console.log(`Selected project: ${project.title} with ${chapterCount} chapters`);
            }
        } catch (error) {
            console.error('Error loading project info:', error);
        }
    },
    
    toggleFullStory() {
        const useFullStory = document.getElementById('use-full-story');
        const projectId = document.getElementById('ai-project-select').value;
        
        if (useFullStory && useFullStory.checked && !projectId) {
            this.showNotification('Please select a project first to analyze the full story', 'warning');
            useFullStory.checked = false;
            return;
        }
    },
    
    // Chapters
    async loadProjectChapters() {
        const projectId = document.getElementById('project-select').value;
        if (!projectId) {
            document.getElementById('chapter-select').innerHTML = '<option value="">Select a chapter...</option>';
            const pos = document.getElementById('chapter-position');
            if (pos) pos.textContent = '';
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/projects`);
            const projects = await response.json();
            const project = projects.find(p => p.id === projectId);
            
            if (project) {
                const select = document.getElementById('chapter-select');
                const currentValue = select.value;
                const chapters = project.chapters || [];
                select.innerHTML = '<option value="">Select a chapter...</option>' +
                    chapters.map((c, idx) => {
                        const num = String(idx + 1).padStart(2, '0');
                        return `<option value="${c.id}">${num} — ${this.escapeHtml(c.title)}</option>`;
                    }).join('');
                if (currentValue) select.value = currentValue;
                this.updateChapterPositionLabel();
            }
        } catch (error) {
            console.error('Error loading chapters:', error);
        }
    },
    
    async loadChapter() {
        const projectId = document.getElementById('project-select').value;
        const chapterId = document.getElementById('chapter-select').value;
        
        if (!projectId || !chapterId) {
            document.getElementById('chapter-title').value = '';
            const editor = document.getElementById('editor-content');
            if (editor) {
                editor.innerHTML = '';
            }
            this.updateChapterPositionLabel();
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/projects`);
            const projects = await response.json();
            const project = projects.find(p => p.id === projectId);
            
            if (project) {
                const chapter = project.chapters.find(c => c.id === chapterId);
                if (chapter) {
                    this.currentChapter = chapter;
                    document.getElementById('chapter-title').value = chapter.title;
                    const editor = document.getElementById('editor-content');
                    if (editor) {
                        // Load HTML content (or plain text if it's old format)
                        editor.innerHTML = chapter.content || '';
                    }
                    this.updateEditorStats();
                    this.updateChapterPositionLabel(project);
                }
            }
        } catch (error) {
            console.error('Error loading chapter:', error);
        }
    },

    async updateChapterPositionLabel(projectOverride = null) {
        const pos = document.getElementById('chapter-position');
        if (!pos) return;

        const projectId = document.getElementById('project-select').value;
        const chapterId = document.getElementById('chapter-select').value;
        if (!projectId || !chapterId) {
            pos.textContent = '';
            return;
        }

        try {
            let project = projectOverride;
            if (!project) {
                const response = await fetch(`${API_URL}/projects`);
                const projects = await response.json();
                project = projects.find(p => p.id === projectId);
            }
            const chapters = project?.chapters || [];
            const idx = chapters.findIndex(c => c.id === chapterId);
            if (idx >= 0) {
                pos.textContent = `Chapter ${idx + 1} of ${chapters.length}`;
            } else {
                pos.textContent = '';
            }
        } catch {
            pos.textContent = '';
        }
    },

    async moveChapter(direction) {
        // direction: -1 (up) or +1 (down)
        const projectId = document.getElementById('project-select').value;
        const chapterId = document.getElementById('chapter-select').value;
        if (!projectId || !chapterId) {
            this.showNotification('Select a project and chapter first', 'warning');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/projects`);
            const projects = await response.json();
            const project = projects.find(p => p.id === projectId);
            if (!project) {
                this.showNotification('Project not found', 'error');
                return;
            }

            const chapters = project.chapters || [];
            const idx = chapters.findIndex(c => c.id === chapterId);
            if (idx < 0) return;

            const newIdx = idx + direction;
            if (newIdx < 0 || newIdx >= chapters.length) {
                return; // can't move
            }

            // Create new order of IDs
            const ids = chapters.map(c => c.id);
            const [moved] = ids.splice(idx, 1);
            ids.splice(newIdx, 0, moved);

            const reorderResp = await fetch(`${API_URL}/projects/${projectId}/chapters/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: ids })
            });

            const reorderData = await reorderResp.json().catch(() => ({}));
            if (!reorderResp.ok) {
                throw new Error(reorderData.error || `Reorder failed: ${reorderResp.status}`);
            }

            // Refresh chapter list and keep selection
            await this.loadProjectChapters();
            document.getElementById('chapter-select').value = chapterId;
            this.updateChapterPositionLabel();
            this.loadProjects(); // update project modified + counts
        } catch (error) {
            console.error('Error reordering chapters:', error);
            this.showNotification(`Error reordering chapters: ${error.message}`, 'error');
        }
    },
    
    showNewChapterModal() {
        const projectId = document.getElementById('project-select').value;
        if (!projectId) {
            this.showNotification('Please select a project first', 'warning');
            return;
        }
        
        document.getElementById('new-chapter-title').value = '';
        this.showModal('chapter-modal');
    },
    
    async createChapter() {
        const projectId = document.getElementById('project-select').value;
        const title = document.getElementById('new-chapter-title').value;
        
        if (!title) {
            this.showNotification('Please enter a chapter title', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/projects/${projectId}/chapters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content: '' })
            });
            
            if (response.ok) {
                const chapter = await response.json();
                this.closeModal('chapter-modal');
                await this.loadProjectChapters();
                document.getElementById('chapter-select').value = chapter.id;
                this.loadChapter();
                // Refresh projects list to update chapter count
                this.loadProjects();
                this.showNotification('Chapter created successfully', 'success');
            }
        } catch (error) {
            console.error('Error creating chapter:', error);
            this.showNotification('Error creating chapter', 'error');
        }
    },
    
    showImportGoogleDocModal() {
        const projectId = document.getElementById('project-select').value;
        if (!projectId) {
            this.showNotification('Please select a project first', 'warning');
            return;
        }
        
        document.getElementById('google-doc-url').value = '';
        document.getElementById('google-access-token').value = '';
        this.showModal('import-google-doc-modal');
    },
    
    async importGoogleDoc() {
        const projectId = document.getElementById('project-select').value;
        const docUrl = document.getElementById('google-doc-url').value.trim();
        const accessToken = document.getElementById('google-access-token').value.trim();
        
        if (!docUrl) {
            this.showNotification('Please enter a Google Docs URL', 'warning');
            return;
        }
        
        if (!projectId) {
            this.showNotification('Please select a project first', 'warning');
            return;
        }
        
        // Extract document ID from URL
        const docIdMatch = docUrl.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
        if (!docIdMatch) {
            this.showNotification('Invalid Google Docs URL format. Please use: https://docs.google.com/document/d/DOCUMENT_ID/edit', 'error');
            return;
        }
        
        const docId = docIdMatch[1];
        
        try {
            this.showNotification('Importing document...', 'info');
            
            const response = await fetch(`${API_URL}/google/import-simple`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doc_id: docId,
                    access_token: accessToken || null,
                    project_id: projectId
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.closeModal('import-google-doc-modal');
                await this.loadProjectChapters();
                document.getElementById('chapter-select').value = data.chapter.id;
                this.loadChapter();
                // Refresh projects list to update chapter count
                this.loadProjects();
                this.showNotification(data.message || 'Document imported successfully!', 'success');
            } else if (data.auth_required) {
                this.showNotification('Authentication required. Please provide an access token or make the document publicly accessible.', 'warning');
            } else {
                this.showNotification(data.error || 'Error importing document', 'error');
            }
        } catch (error) {
            console.error('Error importing Google Doc:', error);
            this.showNotification('Error importing document. Check console for details.', 'error');
        }
    },
    
    async updateChapterTitle() {
        if (!this.currentChapter) return;
        
        const projectId = document.getElementById('project-select').value;
        const chapterId = this.currentChapter.id;
        const title = document.getElementById('chapter-title').value;
        
        try {
            await fetch(`${API_URL}/projects/${projectId}/chapters/${chapterId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            
            this.loadProjectChapters();
        } catch (error) {
            console.error('Error updating chapter title:', error);
        }
    },
    
    stripHtmlTags(html) {
        // Create a temporary div to extract text content
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    },
    
    async saveChapter(silent = false) {
        const projectId = document.getElementById('project-select').value;
        const chapterId = document.getElementById('chapter-select').value;
        
        if (!projectId || !chapterId) {
            if (!silent) {
                this.showNotification('Please select a project and chapter', 'warning');
            }
            return;
        }
        
        const title = document.getElementById('chapter-title').value;
        const editor = document.getElementById('editor-content');
        const content = editor ? editor.innerHTML : '';
        
        try {
            await fetch(`${API_URL}/projects/${projectId}/chapters/${chapterId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content })
            });
            
            if (!silent) {
                this.showNotification('Chapter saved', 'success');
            }
        } catch (error) {
            console.error('Error saving chapter:', error);
            if (!silent) {
                this.showNotification('Error saving chapter', 'error');
            }
        }
    },
    
    updateEditorStats() {
        const editor = document.getElementById('editor-content');
        if (!editor) return;
        
        // Get HTML content and strip tags for counting
        const htmlContent = editor.innerHTML || '';
        const textContent = this.stripHtmlTags(htmlContent);
        
        const words = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
        const chars = textContent.length;
        // Count paragraphs by counting block elements or double line breaks
        const paragraphs = editor.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div').length || 
                         (textContent.trim() ? textContent.split(/\n\n+/).length : 0);
        
        document.getElementById('word-count').textContent = words;
        document.getElementById('char-count').textContent = chars;
        document.getElementById('para-count').textContent = paragraphs;
    },
    
    async checkGrammar() {
        const editor = document.getElementById('editor-content');
        if (!editor) return;
        
        // Strip HTML tags for grammar checking
        const htmlContent = editor.innerHTML || '';
        const content = this.stripHtmlTags(htmlContent);
        
        if (!content.trim()) {
            this.showNotification('Please write something first', 'warning');
            return;
        }
        
        const errorList = document.getElementById('error-list');
        errorList.innerHTML = '<p class="placeholder">Checking grammar...</p>';
        
        try {
            const response = await fetch(`${API_URL}/check-grammar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: content })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.errors && Array.isArray(data.errors)) {
                this.renderGrammarErrors(data.errors);
            } else {
                errorList.innerHTML = '<p class="placeholder">Unexpected response format</p>';
                console.error('Unexpected response:', data);
            }
        } catch (error) {
            console.error('Error checking grammar:', error);
            errorList.innerHTML = `
                <p class="placeholder" style="color: var(--error-color);">
                    Error checking grammar: ${this.escapeHtml(error.message || 'Unknown error')}
                </p>
            `;
            this.showNotification('Error checking grammar. See details in the error panel.', 'error');
        }
    },
    
    renderGrammarErrors(errors) {
        const errorList = document.getElementById('error-list');
        
        if (!errors || errors.length === 0) {
            errorList.innerHTML = '<p class="placeholder">✓ No grammar issues found!</p>';
            return;
        }
        
        errorList.innerHTML = errors.map((error, index) => {
            const offset = error.offset || 0;
            const length = error.length || 0;
            const message = error.message || 'Unknown error';
            const context = error.context || '';
            const errorType = error.type || 'unknown';
            
            return `
                <div class="error-item ${errorType === 'error' ? 'error' : ''}" 
                     onclick="app.highlightError(${offset}, ${length})">
                    <div class="error-message">${this.escapeHtml(message)}</div>
                    ${context ? `<div class="error-context">${this.escapeHtml(context)}</div>` : ''}
                </div>
            `;
        }).join('');
        
        this.showNotification(`Found ${errors.length} grammar issue${errors.length > 1 ? 's' : ''}`, 'info');
    },
    
    highlightError(offset, length) {
        const textarea = document.getElementById('editor-content');
        textarea.focus();
        textarea.setSelectionRange(offset, offset + length);
        textarea.scrollTop = textarea.scrollHeight * (offset / textarea.value.length);
    },
    
    // Characters
    async loadCharacters() {
        const projectId = document.getElementById('characters-project-select').value;
        if (!projectId) {
            document.getElementById('characters-list').innerHTML = '<p class="placeholder">Select a project to view characters</p>';
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/projects/${projectId}/characters`);
            const characters = await response.json();
            this.renderCharacters(characters);
        } catch (error) {
            console.error('Error loading characters:', error);
        }
    },
    
    renderCharacters(characters) {
        const container = document.getElementById('characters-list');
        
        if (characters.length === 0) {
            container.innerHTML = '<p class="placeholder">No characters yet. Add your first character!</p>';
            return;
        }
        
        container.innerHTML = characters.map(char => `
            <div class="character-card">
                <div class="character-header">
                    <div>
                        <div class="character-name">${this.escapeHtml(char.name)}</div>
                    </div>
                    <span class="character-role">${this.escapeHtml(char.role)}</span>
                </div>
                <div class="character-description">${this.escapeHtml(char.description || 'No description')}</div>
                ${char.traits && char.traits.length > 0 ? `
                    <div class="character-traits">
                        ${char.traits.map(trait => `<span class="trait-tag">${this.escapeHtml(trait)}</span>`).join('')}
                    </div>
                ` : ''}
                ${char.arc ? `
                    <div class="plot-notes">
                        <strong>Character Arc:</strong><br>
                        ${this.escapeHtml(char.arc)}
                    </div>
                ` : ''}
                <div class="character-actions">
                    <button class="btn btn-secondary" onclick="app.editCharacter('${char.id}')">
                        Edit
                    </button>
                    <button class="btn btn-danger" onclick="app.deleteCharacter('${char.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    showNewCharacterModal() {
        const projectId = document.getElementById('characters-project-select').value;
        if (!projectId) {
            this.showNotification('Please select a project first', 'warning');
            return;
        }
        
        this.currentCharacter = null;
        document.getElementById('character-modal-title').textContent = 'New Character';
        document.getElementById('character-name').value = '';
        document.getElementById('character-role').value = 'Supporting';
        document.getElementById('character-description').value = '';
        document.getElementById('character-arc').value = '';
        document.getElementById('character-traits').value = '';
        this.showModal('character-modal');
    },
    
    async editCharacter(characterId) {
        const projectId = document.getElementById('characters-project-select').value;
        
        try {
            const response = await fetch(`${API_URL}/projects/${projectId}/characters`);
            const characters = await response.json();
            const character = characters.find(c => c.id === characterId);
            
            if (character) {
                this.currentCharacter = character;
                document.getElementById('character-modal-title').textContent = 'Edit Character';
                document.getElementById('character-name').value = character.name;
                document.getElementById('character-role').value = character.role;
                document.getElementById('character-description').value = character.description || '';
                document.getElementById('character-arc').value = character.arc || '';
                document.getElementById('character-traits').value = (character.traits || []).join(', ');
                this.showModal('character-modal');
            }
        } catch (error) {
            console.error('Error loading character:', error);
        }
    },
    
    async saveCharacter() {
        const projectId = document.getElementById('characters-project-select').value;
        const name = document.getElementById('character-name').value;
        const role = document.getElementById('character-role').value;
        const description = document.getElementById('character-description').value;
        const arc = document.getElementById('character-arc').value;
        const traitsText = document.getElementById('character-traits').value;
        const traits = traitsText ? traitsText.split(',').map(t => t.trim()).filter(t => t) : [];
        
        if (!name) {
            this.showNotification('Please enter a character name', 'warning');
            return;
        }
        
        const characterData = { name, role, description, arc, traits };
        
        try {
            let response;
            if (this.currentCharacter) {
                // Update existing
                response = await fetch(`${API_URL}/projects/${projectId}/characters/${this.currentCharacter.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(characterData)
                });
            } else {
                // Create new
                response = await fetch(`${API_URL}/projects/${projectId}/characters`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(characterData)
                });
            }
            
            if (response.ok) {
                this.closeModal('character-modal');
                this.loadCharacters();
                this.showNotification('Character saved successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving character:', error);
            this.showNotification('Error saving character', 'error');
        }
    },
    
    async deleteCharacter(characterId) {
        if (!confirm('Delete this character?')) return;
        
        const projectId = document.getElementById('characters-project-select').value;
        
        try {
            await fetch(`${API_URL}/projects/${projectId}/characters/${characterId}`, {
                method: 'DELETE'
            });
            this.loadCharacters();
            this.showNotification('Character deleted', 'success');
        } catch (error) {
            console.error('Error deleting character:', error);
        }
    },
    
    // Plots
    async loadPlots() {
        const projectId = document.getElementById('plots-project-select').value;
        if (!projectId) {
            document.getElementById('plots-list').innerHTML = '<p class="placeholder">Select a project to view plot lines</p>';
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/projects/${projectId}/plots`);
            const plots = await response.json();
            this.renderPlots(plots);
        } catch (error) {
            console.error('Error loading plots:', error);
        }
    },
    
    renderPlots(plots) {
        const container = document.getElementById('plots-list');
        
        if (plots.length === 0) {
            container.innerHTML = '<p class="placeholder">No plot threads yet. Add your first plot line!</p>';
            return;
        }
        
        container.innerHTML = plots.map(plot => `
            <div class="plot-card">
                <div class="plot-header">
                    <div class="plot-title-section">
                        <div class="plot-title">${this.escapeHtml(plot.title)}</div>
                        <div class="plot-badges">
                            <span class="plot-badge type-${plot.type}">${this.escapeHtml(plot.type)}</span>
                            <span class="plot-badge status-${plot.status}">${this.escapeHtml(plot.status)}</span>
                        </div>
                    </div>
                </div>
                <div class="plot-description">${this.escapeHtml(plot.description || 'No description')}</div>
                ${plot.notes ? `
                    <div class="plot-notes">
                        <strong>Notes:</strong><br>
                        ${this.escapeHtml(plot.notes)}
                    </div>
                ` : ''}
                <div class="plot-actions">
                    <button class="btn btn-secondary" onclick="app.editPlot('${plot.id}')">
                        Edit
                    </button>
                    <button class="btn btn-danger" onclick="app.deletePlot('${plot.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    showNewPlotModal() {
        const projectId = document.getElementById('plots-project-select').value;
        if (!projectId) {
            this.showNotification('Please select a project first', 'warning');
            return;
        }
        
        this.currentPlot = null;
        document.getElementById('plot-modal-title').textContent = 'New Plot Thread';
        document.getElementById('plot-title').value = '';
        document.getElementById('plot-type').value = 'main';
        document.getElementById('plot-status').value = 'planned';
        document.getElementById('plot-description').value = '';
        document.getElementById('plot-notes').value = '';
        this.showModal('plot-modal');
    },
    
    async editPlot(plotId) {
        const projectId = document.getElementById('plots-project-select').value;
        
        try {
            const response = await fetch(`${API_URL}/projects/${projectId}/plots`);
            const plots = await response.json();
            const plot = plots.find(p => p.id === plotId);
            
            if (plot) {
                this.currentPlot = plot;
                document.getElementById('plot-modal-title').textContent = 'Edit Plot Thread';
                document.getElementById('plot-title').value = plot.title;
                document.getElementById('plot-type').value = plot.type;
                document.getElementById('plot-status').value = plot.status;
                document.getElementById('plot-description').value = plot.description || '';
                document.getElementById('plot-notes').value = plot.notes || '';
                this.showModal('plot-modal');
            }
        } catch (error) {
            console.error('Error loading plot:', error);
        }
    },
    
    async savePlot() {
        const projectId = document.getElementById('plots-project-select').value;
        const title = document.getElementById('plot-title').value;
        const type = document.getElementById('plot-type').value;
        const status = document.getElementById('plot-status').value;
        const description = document.getElementById('plot-description').value;
        const notes = document.getElementById('plot-notes').value;
        
        if (!title) {
            this.showNotification('Please enter a plot title', 'warning');
            return;
        }
        
        const plotData = { title, type, status, description, notes };
        
        try {
            let response;
            if (this.currentPlot) {
                // Update existing
                response = await fetch(`${API_URL}/projects/${projectId}/plots/${this.currentPlot.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(plotData)
                });
            } else {
                // Create new
                response = await fetch(`${API_URL}/projects/${projectId}/plots`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(plotData)
                });
            }
            
            if (response.ok) {
                this.closeModal('plot-modal');
                this.loadPlots();
                this.showNotification('Plot thread saved successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving plot:', error);
            this.showNotification('Error saving plot', 'error');
        }
    },
    
    async deletePlot(plotId) {
        if (!confirm('Delete this plot thread?')) return;
        
        const projectId = document.getElementById('plots-project-select').value;
        
        try {
            await fetch(`${API_URL}/projects/${projectId}/plots/${plotId}`, {
                method: 'DELETE'
            });
            this.loadPlots();
            this.showNotification('Plot thread deleted', 'success');
        } catch (error) {
            console.error('Error deleting plot:', error);
        }
    },
    
    // AI Suggestions
    async getAISuggestions(type) {
        const context = document.getElementById('ai-context').value;
        const projectId = document.getElementById('ai-project-select').value;
        const useFullStory = document.getElementById('use-full-story').checked;
        const apiKey = document.getElementById('openai-api-key').value.trim();
        
        const suggestionsList = document.getElementById('suggestions-list');
        
        // Validate full story selection
        if (useFullStory && !projectId) {
            this.showNotification('Please select a project to analyze the full story', 'warning');
            return;
        }
        
        suggestionsList.innerHTML = '<p class="placeholder">Generating suggestions...<br><small>This may take a moment if analyzing full story</small></p>';
        
        try {
            const requestBody = {
                type,
                context,
                project_id: projectId || null,
                use_full_story: useFullStory,
                api_key: apiKey || null
            };
            
            const response = await fetch(`${API_URL}/ai-suggest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            if (data.error && data.source === 'template') {
                // Show error but still display template suggestions
                this.showNotification(`OpenAI error: ${data.error}. Using template suggestions.`, 'warning');
            }
            
            if (data.suggestions && data.suggestions.length > 0) {
                this.renderSuggestions(data.suggestions, data.source);
                
                // Add the suggestion to chat history so user can ask follow-up questions
                if (data.source === 'openai') {
                    const suggestion = data.suggestions[0];
                    const analysisText = `Analysis: ${suggestion.title}\n\n${suggestion.description}`;
                    
                    // Add to chat history
                    this.chatHistory.push({
                        'role': 'assistant', 
                        'content': analysisText
                    });
                    
                    // Also display in chat if it's visible
                    const chatPlaceholder = document.getElementById('chat-placeholder');
                    if (chatPlaceholder && chatPlaceholder.style.display !== 'none') {
                        chatPlaceholder.style.display = 'none';
                    }
                    
                    // Add the analysis to chat display
                    this.addChatMessage('assistant', analysisText, false, false, true);
                }
            } else {
                suggestionsList.innerHTML = '<p class="placeholder">No suggestions available</p>';
            }
        } catch (error) {
            console.error('Error getting AI suggestions:', error);
            suggestionsList.innerHTML = '<p class="placeholder">Error getting suggestions. Check console for details.</p>';
            this.showNotification('Error getting AI suggestions', 'error');
        }
    },
    
    renderSuggestions(suggestions, source = 'template') {
        const container = document.getElementById('suggestions-list');
        
        if (!suggestions || suggestions.length === 0) {
            container.innerHTML = '<p class="placeholder">No suggestions available</p>';
            return;
        }
        
        const sourceBadge = source === 'openai' 
            ? '<span style="background: var(--success-color); color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; margin-left: 0.5rem;">🤖 AI Generated</span>'
            : '<span style="background: var(--text-secondary); color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; margin-left: 0.5rem;">📝 Template</span>';
        
        // Get the first (and only) suggestion
        const suggestion = suggestions[0];
        
        container.innerHTML = `
            <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--background); border-radius: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                Source: ${sourceBadge}
                ${source === 'template' ? '<br><small>For AI-generated suggestions, add your OpenAI API key above.</small>' : ''}
                ${source === 'openai' ? '<br><small>AI has analyzed all chapters in serialization order.</small>' : ''}
            </div>
            <div class="suggestion-card" style="max-width: 100%;">
                <div class="suggestion-title" style="font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--border-color);">
                    ${this.escapeHtml(suggestion.title)}
                </div>
                <div class="suggestion-description" style="white-space: pre-wrap; line-height: 1.8; font-size: 1rem;">
                    ${this.escapeHtml(suggestion.description)}
                </div>
                <span class="suggestion-category" style="margin-top: 1rem; display: inline-block;">${this.escapeHtml(suggestion.category || 'general')}</span>
            </div>
        `;
    },
    
    // Modal management
    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    },
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },
    
    // Chat Functions
    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        const projectId = document.getElementById('ai-project-select').value;
        const useFullStory = document.getElementById('use-full-story').checked;
        const apiKey = document.getElementById('openai-api-key').value.trim();
        
        if (useFullStory && !projectId) {
            this.showNotification('Please select a project to chat about your story', 'warning');
            return;
        }
        
        // Clear placeholder
        const placeholder = document.getElementById('chat-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        
        // Add user message to chat
        this.addChatMessage('user', message);
        input.value = '';
        
        // Show loading indicator
        const loadingId = this.addChatMessage('assistant', 'Thinking...', true);
        
        try {
            const requestBody = {
                message: message,
                project_id: projectId || null,
                use_full_story: useFullStory,
                api_key: apiKey || null,
                conversation_history: this.chatHistory
            };
            
            const response = await fetch(`${API_URL}/ai-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            // Remove loading message
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            
            if (data.error) {
                this.addChatMessage('assistant', `Error: ${data.error}`, false, true);
                this.showNotification('Error getting AI response', 'error');
            } else {
                // Add assistant response
                this.addChatMessage('assistant', data.response);
                // Update conversation history
                this.chatHistory.push({'role': 'user', 'content': message});
                this.chatHistory.push({'role': 'assistant', 'content': data.response});
            }
        } catch (error) {
            console.error('Error sending chat message:', error);
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            this.addChatMessage('assistant', 'Sorry, I encountered an error. Please try again.', false, true);
            this.showNotification('Error sending message', 'error');
        }
    },
    
    addChatMessage(role, content, isLoading = false, isError = false, isAnalysis = false) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        
        // Special styling for analysis messages
        if (isAnalysis) {
            messageDiv.style.cssText = `
                margin-bottom: 1rem;
                padding: 1rem;
                border-radius: 0.5rem;
                max-width: 90%;
                background: var(--background);
                color: var(--text-primary);
                border: 2px solid var(--primary-color);
                border-left: 4px solid var(--primary-color);
            `;
            
            // Add a header for analysis
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = `
                font-weight: 600;
                color: var(--primary-color);
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;
            headerDiv.textContent = '📊 Story Analysis';
            messageDiv.appendChild(headerDiv);
        } else {
            messageDiv.style.cssText = `
                margin-bottom: 1rem;
                padding: 0.75rem 1rem;
                border-radius: 0.5rem;
                max-width: 80%;
                ${role === 'user' 
                    ? 'background: var(--primary-color); color: white; margin-left: auto; text-align: right;' 
                    : 'background: var(--background); color: var(--text-primary); border: 1px solid var(--border-color);'}
                ${isError ? 'border-color: var(--error-color) !important;' : ''}
            `;
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
            white-space: pre-wrap;
            word-wrap: break-word;
            ${isLoading ? 'font-style: italic; color: var(--text-secondary);' : ''}
        `;
        contentDiv.textContent = content;
        messageDiv.appendChild(contentDiv);
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageId;
    },
    
    clearChat() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '<p class="placeholder" id="chat-placeholder">Start a conversation by asking a question about your story...</p>';
        }
        this.chatHistory = [];
        this.showNotification('Chat cleared', 'success');
    },
    
    // Utilities
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    },
    
    showNotification(message, type = 'info') {
        // Simple notification - could be enhanced with a toast library
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#6366f1'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
