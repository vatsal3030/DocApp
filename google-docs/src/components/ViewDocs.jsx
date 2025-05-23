import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc, } from 'firebase/firestore';
import { FileText, Share2, Eye, Edit, Users, AlertCircle, Save, Link, CheckCircle, Clock, User, Settings, Globe, Mail, Lock, Loader } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast'


const ViewDocs = () => {
  const [user] = useAuthState(auth);
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [accessControl, setAccessControl] = useState({
    publicRead: false,
    readWrite: false,
    customEmails: '',
  });
  const [savingAccess, setSavingAccess] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'documents'), where('owner', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docsData = [];
      querySnapshot.forEach((doc) => {
        docsData.push({ id: doc.id, ...doc.data() });
      });
      setDocs(docsData);
    }, (err) => {
      setError(`Failed to fetch documents: ${err.message}`);
      toast.dismiss();
      toast.error(`Failed to fetch documents: ${err.message}`);
    });

    return () => unsubscribe();
  }, [user]);

  const canRead = (docData) => {
    return (
      docData.owner === user?.uid ||
      docData.publicRead === true ||
      docData.access?.customEmails?.includes(user?.email) ||
      (docData.access?.readWrite === true && (!docData.access?.customEmails || docData.access.customEmails.length === 0))
    );
  };

  const canWrite = (docData) => {
    return (
      docData.owner === user?.uid ||
      docData.access?.customEmails?.includes(user?.email) ||
      (docData.access?.readWrite === true && (!docData.access?.customEmails || docData.access.customEmails.length === 0))
    );
  };

  const selectDoc = async (docId) => {
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, 'documents', docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        toast.dismiss();
        toast.error('Document not found!');
        setError('Document not found.');
        setSelectedDoc(null);
        setContent('');
        setLoading(false);
        return;
      }

      const data = docSnap.data();

      if (!canRead(data)) {
        toast.dismiss();
        toast.error('You do not have access!');
        setError('You do not have access to this document.');
        setSelectedDoc(null);
        setContent('');
        setLoading(false);
        return;
      }

      setSelectedDoc({ id: docSnap.id, ...data });
      setContent(data.content || '');
      setAccessControl({
        publicRead: data.publicRead || false,
        readWrite: data.access?.readWrite || false,
        customEmails: (data.access?.customEmails || []).join(', '),
      });
    } catch (err) {
      setError(`Failed to load document: ${err.message}`);
      toast.dismiss();
      toast.error(`Failed to load document: ${err.message}`);
      setSelectedDoc(null);
      setContent('');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedDoc || !user || !canWrite(selectedDoc)) return;

    const docRef = doc(db, 'documents', selectedDoc.id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (
          data.updatedAt &&
          data.updatedAt.toMillis() !== selectedDoc.updatedAt?.toMillis()
        ) {
          setContent(data.content);
          setSelectedDoc((prev) => ({ ...prev, ...data }));
          setAccessControl({
            publicRead: data.publicRead || false,
            readWrite: data.access?.readWrite || false,
            customEmails: (data.access?.customEmails || []).join(', '),
          });
        }
      }
    });

    return () => unsubscribe();
  }, [selectedDoc, user]);

  const handleContentChange = async (e) => {
    setContent(e.target.value);
    if (!selectedDoc || !user || !canWrite(selectedDoc)) return;

    try {
      const docRef = doc(db, 'documents', selectedDoc.id);
      await updateDoc(docRef, {
        content: e.target.value,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid || user.email,
      });
    } catch (err) {
      setError(`Failed to update content: ${err.message}`);
      toast.dismiss();
      toast.error('Failed to update!');
    }
  };

  const handleAccessChange = (field, value) => {
    setAccessControl((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveAccessControl = async () => {
    if (!selectedDoc || selectedDoc.owner !== user.uid) {
      setError('Only the owner can update access control.');
      return;
    }

    setSavingAccess(true);
    setError('');
    try {
      const docRef = doc(db, 'documents', selectedDoc.id);
      const emailsArray = accessControl.customEmails
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      await updateDoc(docRef, {
        publicRead: accessControl.publicRead,
        access: {
          readWrite: accessControl.readWrite,
          customEmails: emailsArray,
        },
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      setSelectedDoc((prev) => ({
        ...prev,
        publicRead: accessControl.publicRead,
        access: {
          readWrite: accessControl.readWrite,
          customEmails: emailsArray,
        },
      }));

      setError('Access control updated successfully.');
      toast.dismiss();
      toast.success('Access control updated!');
    } catch (err) {
      setError(`Failed to update access control: ${err.message}`);
      toast.dismiss();
      toast.error('Failed to update!');
    }
    setSavingAccess(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to view your documents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Manager</h1>
          <p className="text-gray-600">Manage and collaborate on your documents</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${error.includes('successfully')
            ? 'bg-green-50 border-green-400 text-green-700'
            : 'bg-red-50 border-red-400 text-red-700'
            }`}>
            <div className="flex items-center">
              {error.includes('successfully') ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Documents Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Your Documents
                </h2>
              </div>

              <div className="p-4">
                {docs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No documents yet</p>
                    <p className="text-sm text-gray-400">Create your first document to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {docs.map((docItem) => (
                      <div
                        key={docItem.id}
                        onClick={() => selectDoc(docItem.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${selectedDoc?.id === docItem.id
                          ? 'bg-blue-50 border-blue-200 shadow-sm'
                          : 'bg-gray-50 border-gray-100 hover:bg-gray-100 hover:shadow-sm'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium truncate ${selectedDoc?.id === docItem.id ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                              {docItem.title}
                            </h3>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              {/* <div className='flex items-center'> */}
                              <Clock className="w-3 h-3 mr-1" />
                              <span>
                                {docItem.updatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                              </span>
                              {/* </div> */}
                              {/* <div className='flex items-center'>
                                <Clock className="w-3 h-3 mr-1" />
                                <span>
                                  {docItem.updatedBy.firstName || 'Unknown'}
                                </span>
                              </div> */}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {docItem.publicRead && (
                              <div className="p-1 bg-green-100 rounded">
                                <Globe className="w-3 h-3 text-green-600" />
                              </div>
                            )}
                            {docItem.access?.readWrite && (
                              <div className="p-1 bg-blue-100 rounded">
                                <Edit className="w-3 h-3 text-blue-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {!selectedDoc ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Document</h3>
                <p className="text-gray-500">Choose a document from the sidebar to view and edit its content</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Document Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedDoc.title}</h2>
                    {loading && (
                      <div className="flex items-center text-blue-600">
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    )}
                  </div>

                  {/* Content Editor */}
                  <div className="relative">
                    <textarea
                      value={content}
                      onChange={handleContentChange}
                      rows="12"
                      className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Start writing your document content here..."
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {content.length} characters
                    </div>
                  </div>
                </div>

                {/* Access Control */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <Settings className="w-5 h-5 mr-2 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Access Control</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Public Access */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Globe className="w-5 h-5 mr-3 text-green-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Public Read Access</h4>
                            <p className="text-sm text-gray-500">Anyone with the link can view</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accessControl.publicRead}
                            onChange={(e) => handleAccessChange('publicRead', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Edit className="w-5 h-5 mr-3 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Public Write Access</h4>
                            <p className="text-sm text-gray-500">Anyone can read and edit</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accessControl.readWrite}
                            onChange={(e) => handleAccessChange('readWrite', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Custom Emails */}
                    <div>
                      <div className="flex items-center mb-3">
                        <Mail className="w-5 h-5 mr-2 text-purple-600" />
                        <h4 className="font-medium text-gray-900">Specific Email Access</h4>
                      </div>
                      <textarea
                        value={accessControl.customEmails}
                        onChange={(e) => handleAccessChange('customEmails', e.target.value)}
                        rows="4"
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="email1@example.com, email2@example.com"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Comma-separated list of email addresses that can access this document
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={saveAccessControl}
                      disabled={savingAccess}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                    >
                      {savingAccess ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Access Control
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sharing Links */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <Share2 className="w-5 h-5 mr-2 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Sharing Links</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Read-only Link */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center flex-1 min-w-0">
                        <Eye className="w-5 h-5 mr-3 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">Read-only Link</h4>
                          {selectedDoc.publicRead ? (
                            <a
                              href={`${window.location.origin}/doc/${selectedDoc.id}?access=read`}
                              className="text-sm text-blue-600 hover:text-blue-800 underline truncate block"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {`${window.location.origin}/doc/${selectedDoc.id}?access=read`}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-500">Enable public read access to generate link</p>
                          )}
                        </div>
                      </div>
                      <div className="ml-3">
                        {selectedDoc.publicRead ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <Lock className="w-3 h-3 mr-1" />
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Read & Write Link */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center flex-1 min-w-0">
                        <Edit className="w-5 h-5 mr-3 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">Read & Write Link</h4>
                          {selectedDoc.access?.readWrite ? (
                            <a
                              href={`${window.location.origin}/doc/${selectedDoc.id}?access=edit`}
                              className="text-sm text-blue-600 hover:text-blue-800 underline truncate block"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {`${window.location.origin}/doc/${selectedDoc.id}?access=edit`}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-500">Enable public write access to generate link</p>
                          )}
                        </div>
                      </div>
                      <div className="ml-3">
                        {selectedDoc.access?.readWrite ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <Lock className="w-3 h-3 mr-1" />
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster></Toaster>
    </div>
  );
};

export default ViewDocs;