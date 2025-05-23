import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Signup from './components/SignUp';
import Signin from './components/SignIn';
import CreateDocs from './components/CreateDocs';
import ViewDocs from './components/ViewDocs';
import DocPage from './components/Docpage'; 

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

const App = () => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Navbar />
      <div className="container mx-auto px-4">
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/viewdocs" /> : <Navigate to="/signin" />}
          />

          <Route
            path="/signup"
            element={!user ? <Signup /> : <Navigate to="/createdocs" />}
          />
          <Route
            path="/signin"
            element={!user ? <Signin /> : <Navigate to="/createdocs" />}
          />

          <Route
            path="/createdocs"
            element={user ? <CreateDocs /> : <Navigate to="/signin" />}
          />

          <Route
            path="/viewdocs"
            element={user ? <ViewDocs /> : <Navigate to="/signin" />}
          />

          <Route
            path="/doc/:docId"
            element={<DocPage />}
          />

        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
