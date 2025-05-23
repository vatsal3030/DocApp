import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { FileText, Share2, Eye, Edit, Users, AlertCircle, Plus, Mail } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast'


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
      toast.dismiss();
      toast.success(`Document created!`);
    } catch (err) {
      setError(`Failed to create document: ${err.message}`);
      toast.dismiss();
      toast.error(`Failed to create document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <p className="text-xl font-semibold text-gray-700">
            Please sign in to create documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto pt-8">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-xl">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create New Document</h2>
                <p className="text-blue-100">Build and share your content</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 animate-pulse">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Main Content Area - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Title and Content (Takes 2/3 on large screens) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title Input */}
                <div className="relative group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Document Title *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter document title..."
                      className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white hover:bg-white text-gray-900 placeholder-gray-500"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Content Textarea - Much Larger */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Document Content
                  </label>
                  <textarea
                    placeholder="Start writing your document content..."
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white hover:bg-white text-gray-900 placeholder-gray-500 resize-none"
                    style={{ height: '400px' }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                {/* Submit Button - Only on mobile */}
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full lg:hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Document
                    </>
                  )}
                </button>
              </div>

              {/* Right Column - Sharing Options (Takes 1/3 on large screens) */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 space-y-6 h-fit sticky top-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Share2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Sharing Options</h3>
                  </div>

                  {/* Public Read Toggle */}
                  <div className="flex flex-col gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Read-Only Link</p>
                        <p className="text-sm text-gray-600">Anyone with link can view</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={publicRead}
                        onChange={() => setPublicRead(!publicRead)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {publicRead ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  {/* Read-Write Toggle */}
                  <div className={`flex flex-col gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 shadow-sm ${!publicRead ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Edit className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Read + Write Link</p>
                        <p className="text-sm text-gray-600">Anyone with link can edit</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={readWrite}
                        onChange={() => setReadWrite(!readWrite)}
                        disabled={!publicRead}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 disabled:cursor-not-allowed"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {readWrite ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  {/* Custom Emails */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-300 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <label className="font-medium text-gray-800">
                        Custom Access
                      </label>
                    </div>
                    <div className="relative mb-3">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="email@example.com"
                        className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                        value={customEmailsText}
                        onChange={(e) => setCustomEmailsText(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Separate multiple emails with commas
                    </p>
                  </div>

                  {/* Submit Button - Desktop */}
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="hidden lg:flex w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Create Document
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default CreateDocs;