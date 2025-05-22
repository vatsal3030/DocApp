import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

const CreateDocs = () => {
  const [user] = useAuthState(auth);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // For share toggles
  const [publicRead, setPublicRead] = useState(false); // read-only link enabled?
  const [readWrite, setReadWrite] = useState(false); // read+write link enabled?
  const [customEmailsText, setCustomEmailsText] = useState(''); // comma separated emails for custom access

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, 'documents'), {
        title: title.trim(),
        content: content.trim() || 'No content',
        owner: user.uid,
        publicRead,
        access: {
          readOnly: publicRead,  // read-only link means publicRead true, readOnly true here for rules
          readWrite,             // read+write link enabled
          customEmails: customEmailsText
            .split(',')
            .map(e => e.trim())
            .filter(e => e.length > 0),
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      console.log('Document created with ID:', docRef.id);
      setTitle('');
      setContent('');
      setPublicRead(false);
      setReadWrite(false);
      setCustomEmailsText('');
      alert(`Document created! Shareable links will be available on the View Docs page.`);
    } catch (err) {
      setError(`Failed to create document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <p className="text-center mt-10 text-lg font-medium text-gray-700">
        Please sign in to create documents.
      </p>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white border rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Create a New Document</h2>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleCreate} className="space-y-4">
        <input
          type="text"
          placeholder="Document Title"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Document Content (optional)"
          className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={publicRead}
              onChange={() => setPublicRead(!publicRead)}
            />
            <span>Enable Read-Only Public Link (anyone can view)</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={readWrite}
              onChange={() => setReadWrite(!readWrite)}
              disabled={!publicRead} // Only if publicRead enabled can enable readWrite link
            />
            <span>Enable Read + Write Public Link (anyone can edit)</span>
          </label>

          <label className="block">
            <span>Custom Access Emails (comma separated)</span>
            <input
              type="text"
              placeholder="email1@example.com, email2@example.com"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customEmailsText}
              onChange={(e) => setCustomEmailsText(e.target.value)}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white font-semibold px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Document'}
        </button>
      </form>
    </div>
  );
};

export default CreateDocs;
