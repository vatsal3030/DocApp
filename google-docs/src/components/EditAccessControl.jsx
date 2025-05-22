import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const EditAccessControl = ({ docId }) => {
  const [access, setAccess] = useState({
    readOnly: false,
    readWrite: false,
    customEmails: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchAccess = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'documents', docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('Document not found.');
          setLoading(false);
          return;
        }

        const data = docSnap.data();

        // Check if current user is owner
        if (auth.currentUser.uid !== data.owner) {
          setError('Only the owner can edit access control.');
          setLoading(false);
          return;
        }

        setAccess(data.access || {
          readOnly: false,
          readWrite: false,
          customEmails: [],
        });
        setIsOwner(true);
        setError('');
      } catch (err) {
        setError('Failed to load access control.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccess();
  }, [docId]);

  const toggleReadOnly = () => {
    setAccess((prev) => ({
      ...prev,
      readOnly: !prev.readOnly,
      // If readWrite is enabled, readOnly can be true or false (optional)
      // You can decide your logic here
    }));
  };

  const toggleReadWrite = () => {
    setAccess((prev) => ({
      ...prev,
      readWrite: !prev.readWrite,
      // Usually readWrite implies readOnly true as well,
      // but up to your logic
    }));
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (email && !access.customEmails.includes(email)) {
      setAccess((prev) => ({
        ...prev,
        customEmails: [...prev.customEmails, email],
      }));
      setEmailInput('');
    }
  };

  const removeEmail = (emailToRemove) => {
    setAccess((prev) => ({
      ...prev,
      customEmails: prev.customEmails.filter((email) => email !== emailToRemove),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, 'documents', docId);
      await updateDoc(docRef, { access });
      alert('Access control updated successfully!');
    } catch (err) {
      setError('Failed to update access control.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading access control...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!isOwner) return null;

  return (
    <div className="max-w-md p-4 border rounded shadow bg-white mt-6">
      <h3 className="text-xl font-bold mb-4">Edit Access Control</h3>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={access.readOnly}
            onChange={toggleReadOnly}
          />
          <span>Public Read-Only Access</span>
        </label>
      </div>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={access.readWrite}
            onChange={toggleReadWrite}
          />
          <span>Public Read-Write Access</span>
        </label>
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Custom Access Emails</label>
        <div className="flex space-x-2 mb-2">
          <input
            type="email"
            placeholder="Add email"
            className="flex-grow p-2 border rounded"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <button
            type="button"
            onClick={addEmail}
            className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <ul>
          {access.customEmails.map((email) => (
            <li key={email} className="flex justify-between items-center mb-1">
              <span>{email}</span>
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        Save Changes
      </button>
    </div>
  );
};

export default EditAccessControl;
