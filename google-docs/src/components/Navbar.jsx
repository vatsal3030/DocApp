import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';

const Navbar = () => {
  const [user] = useAuthState(auth);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const fetchFirstName = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setFirstName(userDoc.data().firstName || '');
          } else {
            setFirstName('');
          }
        } catch (err) {
          console.error('Failed to fetch user first name:', err);
          setFirstName('');
        }
      } else {
        setFirstName('');
      }
    };

    fetchFirstName();
  }, [user]);

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center text-white">
      <div className="text-lg font-bold">DocApp</div>
      <div className="space-x-4 flex items-center">
        {user ? (
          <>
            <a href="/createdocs" className="hover:underline mr-4">
              Create Docs
            </a>
            <a href="/viewdocs" className="hover:underline mr-4">
              View Docs
            </a>
            <span className="mr-4">Hi, {firstName ? firstName : user.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <a href="/signin" className="hover:underline mr-4">
              Sign In
            </a>
            <a href="/signup" className="hover:underline">
              Sign Up
            </a>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
