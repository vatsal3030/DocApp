import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast, Toaster } from 'react-hot-toast';

const DocPage = () => {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const accessType = searchParams.get('access'); // 'read' or 'write' or null
  const navigate = useNavigate();

  const [user, loadingAuth] = useAuthState(auth);
  const [docData, setDocData] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(true);

  const hasWriteAccess = () => {
    if (!docData || !user) return false;
    return (
      accessType === 'write' ||
      docData.owner === user.uid ||
      docData.access?.customEmails?.includes(user.email)
    );
  };

  const hasReadAccess = () => {
    if (!docData) return false;
    if (accessType === 'read') return docData.publicRead;
    return hasWriteAccess(); // implies access via write or custom
  };

  useEffect(() => {
    if (loadingAuth) return;

    if (!user && accessType !== 'read') {
      // Redirect to login with return path
      navigate(`/login?redirect=/doc/${docId}?access=${accessType}`);
    }
  }, [user, loadingAuth, accessType, docId, navigate]);

  useEffect(() => {
    if (!docId) return;

    const loadDocument = async () => {
      setLoadingDoc(true);
      setError('');

      try {
        const docRef = doc(db, 'documents', docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('Document not found.');
          return;
        }

        const data = docSnap.data();
        const allowed =
          accessType === 'read'
            ? data.publicRead
            : accessType === 'write'
              ? data.access?.readWrite
              : user &&
              (data.owner === user.uid || data.access?.customEmails?.includes(user.email));

        if (!allowed) {
          setError('Access denied.');
          toast.dismiss();
          toast.error("Access Denied ! ");
          return;
        }

        setDocData({ id: docSnap.id, ...data });
        setContent(data.content);
      } catch (err) {
        setError(`Failed to load document: ${err.message}`);
      } finally {
        setLoadingDoc(false);
      }
    };

    loadDocument();
  }, [docId, accessType, user]);

  const handleContentChange = async (e) => {
    const newValue = e.target.value;
    setContent(newValue);

    if (!hasWriteAccess()) return;

    try {
      const docRef = doc(db, 'documents', docData.id);
      await updateDoc(docRef, {
        content: newValue,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid || user.email,
      });
    } catch (err) {
      setError(`Failed to update content: ${err.message}`);
    }
  };

  if (loadingAuth || loadingDoc) return <p>Loading...</p>;

  if (error) return <p className="text-red-600 text-center mt-10">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white border rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">{docData?.title || 'Untitled Document'}</h2>

      <textarea
        value={content}
        onChange={handleContentChange}
        disabled={!hasWriteAccess()}
        rows={20}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50"
      />
      <Toaster></Toaster>
      {!hasWriteAccess() && (
        <p className="text-sm text-gray-600 mt-2 italic">
          You have read-only access to this document.
        </p>
      )}
    </div>
  );
};

export default DocPage;
