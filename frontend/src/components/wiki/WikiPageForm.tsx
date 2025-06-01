
import React, { useState, useEffect } from 'react';
import { WikiPageFormProps } from '../../types';

const WikiPageForm: React.FC<WikiPageFormProps> = React.memo(({ initialPage, onSave, onCancel, isSaving }) => {
  const [title, setTitle] = useState('');
  const [contentMd, setContentMd] = useState('');
  const [pageId, setPageId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialPage) {
      setTitle(initialPage.title);
      setContentMd(initialPage.content_md);
      setPageId(initialPage.id);
    } else {
      setTitle('');
      setContentMd('');
      setPageId(undefined);
    }
  }, [initialPage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentMd.trim()) {
        alert("Title and Content cannot be empty."); // Basic validation
        return;
    }
    onSave({ title, content_md: contentMd, id: pageId });
  };

  return (
    <form onSubmit={handleSubmit} className="wiki-page-form">
      <h3>{pageId ? 'Edit Page' : 'Add New Page'}</h3>
      <div className="form-group">
        <label htmlFor="wiki-page-title">Title</label>
        <input
          id="wiki-page-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter page title"
          required
          disabled={isSaving}
        />
      </div>
      <div className="form-group">
        <label htmlFor="wiki-page-content">Content (Markdown)</label>
        <textarea
          id="wiki-page-content"
          value={contentMd}
          onChange={(e) => setContentMd(e.target.value)}
          placeholder="Enter page content in Markdown format..."
          required
          disabled={isSaving}
          rows={15}
        />
      </div>
      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={isSaving || !title.trim() || !contentMd.trim()}>
          {isSaving ? (pageId ? 'Saving...' : 'Adding...') : (pageId ? 'Save Changes' : 'Add Page')}
        </button>
      </div>
    </form>
  );
});

export default WikiPageForm;
