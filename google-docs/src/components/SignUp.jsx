import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (!firstName.trim() || !lastName.trim()) {
            setError('First name and last name are required');
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update displayName in Firebase Auth (optional)
            await updateProfile(user, {
                displayName: `${firstName.trim()} ${lastName.trim()}`,
            });

            // Save user info in Firestore 'users' collection
            await setDoc(doc(db, 'users', user.uid), {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                createdAt: new Date(),
            });

            // Optionally reset form or redirect

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSignup} className="max-w-md mx-auto p-4 space-y-4">
            {error && <p className="text-red-600">{error}</p>}

            <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                className="w-full p-2 border rounded"
            />

            <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                className="w-full p-2 border rounded"
            />

            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full p-2 border rounded"
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full p-2 border rounded"
            />

            <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
                {loading ? 'Signing up...' : 'Sign Up'}
            </button>
        </form>
    );
};

export default Signup;
