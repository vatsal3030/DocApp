import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  FileText,
  Plus,
  Eye,
  LogOut,
  User,
  Menu,
  X,
  Settings,
  Bell
} from 'lucide-react';

const Navbar = () => {
  const [user] = useAuthState(auth);
  const [firstName, setFirstName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DocApp
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {user ? (
                <>
                  <a
                    href="/createdocs"
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Docs
                  </a>
                  <a
                    href="/viewdocs"
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Docs
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/signin"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    Sign In
                  </a>

                  <a
                    href="/signup"
                    className="px-4 py-2 rounded-md text-sm font-medium text-white hover:from-blue-600  hover:bg-blue-50 transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    Sign Up
                  </a>
                </>
              )}
            </div>
          </div>

          {/* User Menu */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                <Bell className="w-5 h-5" />
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-700">
                      Hi, {firstName || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2 border border-gray-200">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center px-3 py-2 mb-3 bg-white rounded-md">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {firstName || user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <a
                    href="/createdocs"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-white transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Create Docs
                  </a>
                  <a
                    href="/viewdocs"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-white transition-colors duration-200"
                  >
                    <Eye className="w-5 h-5 mr-3" />
                    View Docs
                  </a>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-2"></div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/signin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-white transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    Sign In
                  </a>
                  <a
                    href="/signup"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white  hover:text-blue-600 hover:bg-white transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    Sign Up
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;