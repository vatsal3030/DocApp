import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';

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

  // Fetch documents created by the user
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
    });

    return () => unsubscribe();
  }, [user]);

  // Load document on selection
  const selectDoc = async (docId) => {
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, 'documents', docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('Document not found.');
        setSelectedDoc(null);
        setContent('');
        setLoading(false);
        return;
      }

      const data = docSnap.data();

      if (
        data.owner !== user.uid &&
        !(data.access?.customEmails?.includes(user.email)) &&
        !data.publicRead
      ) {
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
      setSelectedDoc(null);
      setContent('');
    }
    setLoading(false);
  };

  // Live sync updates
  useEffect(() => {
    if (!selectedDoc) return;

    if (
      !user ||
      !(selectedDoc.owner === user.uid ||
        selectedDoc.access?.readWrite === true ||
        selectedDoc.access?.customEmails?.includes(user.email))
    ) {
      return;
    }

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
    if (!selectedDoc) return;

    if (
      !user ||
      !(selectedDoc.owner === user.uid ||
        selectedDoc.access?.readWrite === true ||
        selectedDoc.access?.customEmails?.includes(user.email))
    ) {
      return;
    }

    try {
      const docRef = doc(db, 'documents', selectedDoc.id);
      await updateDoc(docRef, {
        content: e.target.value,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid || user.email,
      });
    } catch (err) {
      setError(`Failed to update content: ${err.message}`);
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
    } catch (err) {
      setError(`Failed to update access control: ${err.message}`);
    }
    setSavingAccess(false);
  };

  if (!user) {
    return <p className="text-center mt-10">Please sign in to view documents.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Your Documents</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="flex gap-6">
        <div className="w-1/3 border-r pr-4">
          {docs.length === 0 ? (
            <p>You have no documents. Create one first.</p>
          ) : (
            <ul className="space-y-2">
              {docs.map((doc) => (
                <li
                  key={doc.id}
                  onClick={() => selectDoc(doc.id)}
                  className={`p-2 rounded cursor-pointer hover:bg-blue-100 ${
                    selectedDoc?.id === doc.id ? 'bg-blue-200 font-semibold' : ''
                  }`}
                >
                  {doc.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="w-2/3">
          {!selectedDoc ? (
            <p>Select a document to view/edit.</p>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-2">{selectedDoc.title}</h3>

              <textarea
                value={content}
                onChange={handleContentChange}
                rows="10"
                className="w-full p-2 border rounded mb-4"
                placeholder="Start typing..."
              />

              <div className="bg-gray-100 p-3 mb-4 rounded border">
                <h4 className="font-semibold mb-2">Access Control</h4>
                <div className="mb-2">
                  <label className="block font-medium">Public Read:</label>
                  <input
                    type="checkbox"
                    checked={accessControl.publicRead}
                    onChange={(e) => handleAccessChange('publicRead', e.target.checked)}
                    className="ml-2"
                  />
                </div>
                <div className="mb-2">
                  <label className="block font-medium">Read & Write for Everyone:</label>
                  <input
                    type="checkbox"
                    checked={accessControl.readWrite}
                    onChange={(e) => handleAccessChange('readWrite', e.target.checked)}
                    className="ml-2"
                  />
                </div>
                <div className="mb-2">
                  <label className="block font-medium">Custom Emails (comma separated):</label>
                  <input
                    type="text"
                    value={accessControl.customEmails}
                    onChange={(e) => handleAccessChange('customEmails', e.target.value)}
                    className="w-full border p-1 rounded"
                    placeholder="email1@example.com, email2@example.com"
                  />
                </div>
                <button
                  onClick={saveAccessControl}
                  className="bg-blue-600 text-white px-4 py-1 rounded mt-2"
                  disabled={savingAccess}
                >
                  {savingAccess ? 'Saving...' : 'Save Access Control'}
                </button>
              </div>

              <div className="text-sm">
                <p>
                  <strong>Read-only link:</strong>{' '}
                  {selectedDoc.publicRead ? (
                    <a
                      href={`${window.location.origin}/doc/${selectedDoc.id}?access=read`}
                      className="text-blue-600 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {`${window.location.origin}/doc/${selectedDoc.id}?access=read`}
                    </a>
                  ) : (
                    <span className="text-gray-400">Disabled</span>
                  )}
                </p>
                <p>
                  <strong>Read & write link:</strong>{' '}
                  {selectedDoc.access?.readWrite ? (
                    <a
                      href={`${window.location.origin}/doc/${selectedDoc.id}?access=edit`}
                      className="text-blue-600 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {`${window.location.origin}/doc/${selectedDoc.id}?access=edit`}
                    </a>
                  ) : (
                    <span className="text-gray-400">Disabled</span>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewDocs;
