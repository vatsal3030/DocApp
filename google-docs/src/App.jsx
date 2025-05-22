import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Signup from './components/SignUp';
import Signin from './components/SignIn';
import CreateDocs from './components/CreateDocs';
import ViewDocs from './components/ViewDocs';
import DocPage from './components/Docpage'; // Import if you add this for shared doc links

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

const App = () => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <Router>
      <Navbar />
      <div className="container mx-auto px-4">
        <Routes>
          {/* Default route: redirect to viewdocs if logged in, else to signin */}
          <Route
            path="/"
            element={user ? <Navigate to="/viewdocs" /> : <Navigate to="/signin" />}
          />

          {/* Public routes: signup and signin only accessible if NOT logged in */}
          <Route
            path="/signup"
            element={!user ? <Signup /> : <Navigate to="/createdocs" />}
          />
          <Route
            path="/signin"
            element={!user ? <Signin /> : <Navigate to="/createdocs" />}
          />

          {/* Protected routes: create and view docs only if logged in */}
          <Route
            path="/createdocs"
            element={user ? <CreateDocs /> : <Navigate to="/signin" />}
          />
          <Route
            path="/viewdocs"
            element={user ? <ViewDocs /> : <Navigate to="/signin" />}
          />

          {/* Public doc viewing route for shared links */}
          <Route
            path="/doc/:docId"
            element={<DocPage />}
          />

          {/* Add more routes here as needed */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
