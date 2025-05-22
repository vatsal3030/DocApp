import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const DocPage = () => {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const accessType = searchParams.get('access'); // 'read' or 'write' or null

  const [user, loadingAuth] = useAuthState(auth);

  const [docData, setDocData] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(true);

  // Redirect to login if not logged in and link is not read-only public
  useEffect(() => {
    if (loadingAuth) return;
    if (!user && accessType !== 'read') {
      // redirect to login page (replace with your login route)
      window.location.href = `/login?redirect=/doc/${docId}?access=${accessType}`;
      return;
    }
  }, [user, loadingAuth, accessType, docId]);

  useEffect(() => {
    if (!docId) return;

    const loadDoc = async () => {
      setLoadingDoc(true);
      setError('');

      try {
        const docRef = doc(db, 'documents', docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('Document not found.');
          setLoadingDoc(false);
          return;
        }

        const data = docSnap.data();

        // Check access based on link type and user
        if (accessType === 'read') {
          if (!data.publicRead) {
            setError('Read access denied.');
            setLoadingDoc(false);
            return;
          }
        } else if (accessType === 'write') {
          if (!data.access?.readWrite) {
            setError('Write access denied.');
            setLoadingDoc(false);
            return;
          }
        } else {
          // Custom email access or owner
          if (
            !user ||
            !(
              data.owner === user.uid ||
              (data.access?.customEmails?.includes(user.email))
            )
          ) {
            setError('Access denied.');
            setLoadingDoc(false);
            return;
          }
        }

        setDocData({ id: docSnap.id, ...data });
        setContent(data.content);
      } catch (err) {
        setError(`Failed to load document: ${err.message}`);
      }
      setLoadingDoc(false);
    };

    loadDoc();
  }, [docId, accessType, user]);

  const handleContentChange = async (e) => {
    setContent(e.target.value);

    if (!docData || !user) return;

    // Only allow write if write link or custom email access or owner
    if (
      accessType !== 'write' &&
      !(docData.owner === user.uid || docData.access?.customEmails?.includes(user.email))
    )
      return;

    try {
      const docRef = doc(db, 'documents', docData.id);
      await updateDoc(docRef, {
        content: e.target.value,
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
      <h2 className="text-2xl font-bold mb-4">{docData?.title}</h2>

      <textarea
        value={content}
        onChange={handleContentChange}
        disabled={
          accessType !== 'write' &&
          !(docData.owner === user?.uid || docData.access?.customEmails?.includes(user?.email))
        }
        rows={20}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    </div>
  );
};

export default DocPage;
