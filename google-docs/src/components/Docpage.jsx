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
    if (!docData) return false;
    if (docData.owner === user?.uid) return true;

    const isCustom = docData.access?.customEmails?.includes(user?.email);
    const isPublicWrite = docData.access?.readWrite === true &&
      (!docData.access?.customEmails || docData.access.customEmails.length === 0);

    return isCustom || isPublicWrite;
  };


  const hasReadAccess = () => {
    if (!docData) return false;
    if (docData.owner === user?.uid) return true;

    const isCustom = docData.access?.customEmails?.includes(user?.email);
    const isPublicWrite = docData.access?.readWrite === true &&
      (!docData.access?.customEmails || docData.access.customEmails.length === 0);

    return docData.publicRead || isCustom || isPublicWrite;
  };


  useEffect(() => {
    if (loadingAuth) return;

    if (!user && accessType !== 'read') {
      // Redirect to login with return path
      navigate(`/login?redirect=/doc/${docId}?access=${accessType}`);
    }
  }, [user, loadingAuth, accessType, docId, navigate]);

  // useEffect(() => {
  //   if (!docId) return;

  //   const loadDocument = async () => {
  //     setLoadingDoc(true);
  //     setError('');

  //     try {
  //       const docRef = doc(db, 'documents', docId);
  //       const docSnap = await getDoc(docRef);

  //       if (!docSnap.exists()) {
  //         setError('Document not found.');
  //         return;
  //       }

  //       const data = docSnap.data();
  //       const customEmails = data.access?.customEmails || [];
  //       const isCustom = user && customEmails.includes(user.email);
  //       const isPublicWrite = docData.access?.readWrite === true &&
  //         (!docData.access?.customEmails || docData.access.customEmails.length === 0);

  //       const allowed =
  //         (user && (data.owner === user.uid || isCustom || isPublicWrite)) ||
  //         (accessType === 'read' && data.publicRead === true);

  //       if (!allowed) {
  //         setError('Access denied.');
  //         toast.dismiss();
  //         toast.error("Access Denied ! ");
  //         return;
  //       }

  //       setDocData({ id: docSnap.id, ...data });
  //       setContent(data.content);
  //     } catch (err) {
  //       toast.dismiss();
  //       // toast.error('here');
  //       setError(`Failed to load document: ${err.message}`);
  //     } finally {
  //       setLoadingDoc(false);
  //     }
  //   };

  //   loadDocument();
  // }, [docId, accessType, user]);


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

        const access = data.access || {};
        const customEmails = Array.isArray(access.customEmails) ? access.customEmails : [];
        const isCustom = user && customEmails.includes(user.email);
        const isPublicWrite = access.readWrite === true && customEmails.length === 0;

        const allowed =
          (user && (data.owner === user.uid || isCustom || isPublicWrite)) ||
          (accessType === 'read' && data.publicRead === true);

        if (!allowed) {
          setError('Access denied.');
          toast.dismiss();
          toast.error("Access Denied!");
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
