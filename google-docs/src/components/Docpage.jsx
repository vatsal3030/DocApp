import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast, Toaster } from 'react-hot-toast';

const DocPage = () => {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const accessType = searchParams.get('access');
  const navigate = useNavigate();

  const [user, loadingAuth] = useAuthState(auth);
  const [docData, setDocData] = useState(null);
  const [content, setContent] = useState('');
  const [debouncedContent, setDebouncedContent] = useState('');
  const [error, setError] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [cursorPos, setCursorPos] = useState(0);

  const textareaRef = useRef(null);

  // Helper to generate a key for storing cursor position in localStorage
  const getCursorStorageKey = (id) => `docCursorPos_${id || ''}`;

  // Save cursor position
  const saveCursorPosition = (pos, id) => {
    if (!id) return;
    localStorage.setItem(getCursorStorageKey(id), pos);
  };

  // Get cursor position from localStorage
  const getCursorPosition = (id) => {
    return parseInt(localStorage.getItem(getCursorStorageKey(id))) || 0;
  };

  // Check if user has write access
  const hasWriteAccess = () => {
    if (!docData || !user) return false;
    const isOwner = docData.owner === user.uid;
    const isCustom = docData.access?.customEmails?.includes(user.email);
    const isPublicWrite =
      docData.access?.readWrite === true &&
      (!docData.access?.customEmails || docData.access.customEmails.length === 0);
    return isOwner || isCustom || isPublicWrite;
  };

  // Redirect if not logged in and not read access
  useEffect(() => {
    if (loadingAuth) return;
    if (!user && accessType !== 'read') {
      navigate(`/login?redirect=/doc/${docId}?access=${accessType}`);
    }
  }, [user, loadingAuth, accessType, docId, navigate]);

  // Fetch and sync document
  useEffect(() => {
    const docRef = doc(db, 'documents', docId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setError('Document not found.');
          setLoadingDoc(false);
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
          toast.error('Access Denied!');
          setLoadingDoc(false);
          return;
        }

        setDocData({ id: docSnap.id, ...data });

        if (data.content !== content) {
          setContent(data.content);
          setDebouncedContent(data.content);

          requestAnimationFrame(() => {
            if (textareaRef.current) {
              const pos = Math.min(getCursorPosition(docSnap.id), data.content.length);
              textareaRef.current.selectionStart = pos;
              textareaRef.current.selectionEnd = pos;
              setCursorPos(pos);
            }
          });
        }

        setLoadingDoc(false);
      },
      (err) => {
        setError(`Failed to load document: ${err.message}`);
        setLoadingDoc(false);
      }
    );

    return () => unsubscribe();
  }, [docId, accessType, user]);

  // Debounce content updates
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedContent(content);
    }, 0);

    return () => clearTimeout(handler);
  }, [content]);

  // Update Firestore when debounced content changes
  useEffect(() => {
    const updateContent = async () => {
      if (!docData || !user || !hasWriteAccess()) return;
      try {
        const docRef = doc(db, 'documents', docData.id);
        await updateDoc(docRef, {
          content: debouncedContent,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid || user.email,
        });
      } catch (err) {
        setError(`Failed to update content: ${err.message}`);
        toast.dismiss();
        toast.error('Failed to update!');
      }
    };

    if (debouncedContent !== docData?.content) {
      updateContent();
    }
  }, [debouncedContent]);

  // Handle textarea content changes and cursor tracking
  const handleContentChange = (e) => {
    const newText = e.target.value;
    const pos = e.target.selectionStart;
    setContent(newText);
    saveCursorPosition(pos, docData?.id);
    setCursorPos(pos);
  };

  const handleCursorChange = (e) => {
    const pos = e.target.selectionStart;
    saveCursorPosition(pos, docData?.id);
    setCursorPos(pos);
  };

  if (loadingAuth || loadingDoc) return <p>Loading...</p>;
  if (error) return <p className="text-red-600 text-center mt-10">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white border rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">{docData?.title || 'Untitled Document'}</h2>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        onSelect={handleCursorChange}
        onKeyUp={handleCursorChange}
        onClick={handleCursorChange}
        disabled={!hasWriteAccess()}
        rows={20}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50"
      />

      <Toaster />
      {!hasWriteAccess() && (
        <p className="text-sm text-gray-600 mt-2 italic">
          You have read-only access to this document.
        </p>
      )}
    </div>
  );
};

export default DocPage;
