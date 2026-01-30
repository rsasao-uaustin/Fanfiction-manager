# 📥 Google Docs Import Guide

The Fanfiction Manager now supports importing documents directly from Google Docs!

## Quick Start

### Method 1: Public Documents (Easiest)

1. **Make your Google Doc public:**
   - Open your Google Document
   - Click "Share" button
   - Change access to "Anyone with the link can view"
   - Copy the link

2. **Import in Fanfiction Manager:**
   - Open the Editor view
   - Select your project
   - Click "📥 Import Google Doc" button
   - Paste the Google Docs URL
   - Leave "Access Token" field empty
   - Click "Import Document"

### Method 2: Private Documents (Requires OAuth)

For private documents, you'll need a Google OAuth access token.

## Setting Up Google OAuth (For Private Documents)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Google Docs API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Docs API"
   - Click "Enable"

### Step 2: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:5000` (for local development)
   - Your production URL (if applicable)
5. Save the Client ID and Client Secret

### Step 3: Get Access Token

#### Option A: OAuth Playground (Easiest)

1. Go to [Google OAuth Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In the left panel, find "Google Docs API v1"
6. Select scope: `https://www.googleapis.com/auth/documents.readonly`
7. Click "Authorize APIs"
8. Sign in with your Google account
9. Click "Exchange authorization code for tokens"
10. Copy the "Access token" value

#### Option B: Programmatic OAuth (Advanced)

Use the Google Auth library to handle OAuth flow programmatically.

## Using the Import Feature

### Import Process

1. **Navigate to Editor:**
   - Click "Editor" in the sidebar
   - Select your project from the dropdown

2. **Open Import Dialog:**
   - Click "📥 Import Google Doc" button
   - A modal will appear

3. **Enter Document Information:**
   - **Google Docs URL**: Paste the full URL
     - Format: `https://docs.google.com/document/d/DOCUMENT_ID/edit`
   - **Access Token**: (Optional)
     - Leave empty for public documents
     - Enter token for private documents

4. **Import:**
   - Click "Import Document"
   - Wait for processing
   - The document will be imported as a new chapter

### What Gets Imported

- **Document Title**: Becomes the chapter title
- **Text Content**: All text from the document
- **Formatting**: Basic text is preserved (formatting may be simplified)
- **Tables**: Text from table cells is extracted
- **Metadata**: Document ID is stored for reference

### Limitations

- **Formatting**: Complex formatting (colors, fonts, etc.) may not be preserved
- **Images**: Images are not imported (only text)
- **Comments**: Comments and suggestions are not imported
- **Headers/Footers**: May not be included
- **Complex Elements**: Some advanced elements may not be fully extracted

## Troubleshooting

### "Invalid Google Docs URL format"

**Problem**: The URL format is incorrect.

**Solution**: 
- Make sure you're using the full URL: `https://docs.google.com/document/d/DOCUMENT_ID/edit`
- Copy the URL directly from your browser's address bar

### "Authentication required"

**Problem**: The document is private and requires authentication.

**Solutions**:
1. **Make document public** (easiest):
   - Share > "Anyone with the link can view"
   - Leave access token empty

2. **Use access token**:
   - Get an OAuth access token (see setup above)
   - Enter it in the "Access Token" field

### "Google API error: 403"

**Problem**: Insufficient permissions.

**Solutions**:
- Make sure the document is shared with your Google account
- Check that your OAuth token has the correct scopes
- Verify the document isn't restricted

### "Google API error: 404"

**Problem**: Document not found.

**Solutions**:
- Verify the document ID is correct
- Check that the document exists and is accessible
- Make sure you have permission to view it

### "ModuleNotFoundError: No module named 'google'"

**Problem**: Google API libraries not installed.

**Solution**:
```powershell
cd C:\Users\riosa\polaris_ideas_projects\fanfiction-manager
python -m pip install -r requirements.txt
```

## Best Practices

### For Public Documents

1. **Share Settings**: Use "Anyone with the link can view"
2. **No Token Needed**: Leave access token empty
3. **Simple Process**: Just paste URL and import

### For Private Documents

1. **Secure Tokens**: Don't share your access tokens
2. **Token Expiry**: Tokens expire after 1 hour - get a new one if needed
3. **Minimal Scopes**: Use read-only scopes when possible

### Document Preparation

1. **Clean Formatting**: Simple formatting imports better
2. **Chapter Separation**: Use clear headings or separate documents
3. **Backup**: Keep originals in Google Docs as backup
4. **Review**: Always review imported content for accuracy

## API Endpoints

### Import Endpoint

**POST** `/api/google/import-simple`

**Request Body:**
```json
{
  "doc_id": "DOCUMENT_ID",
  "access_token": "YOUR_TOKEN_OR_NULL",
  "project_id": "PROJECT_ID"
}
```

**Response:**
```json
{
  "success": true,
  "chapter": {
    "id": "chapter_id",
    "title": "Imported Document Title",
    "content": "Document content...",
    "imported_from": "google_docs:DOCUMENT_ID"
  },
  "message": "Successfully imported..."
}
```

## Security Notes

- **Access Tokens**: Are sent to the server but not stored
- **Document URLs**: Are processed server-side
- **Private Documents**: Require valid OAuth tokens
- **Public Documents**: No authentication needed

## Future Enhancements

Potential improvements:
- [ ] Full OAuth flow integration
- [ ] Automatic token refresh
- [ ] Batch import multiple documents
- [ ] Preserve more formatting
- [ ] Import images
- [ ] Sync changes back to Google Docs
- [ ] Two-way synchronization

## Need Help?

- Check the main README.md for general setup
- Review error messages in the browser console
- Verify your Google Cloud project settings
- Ensure Google Docs API is enabled

---

**Happy importing!** 📥✨
