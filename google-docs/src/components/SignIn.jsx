import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
const Signin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSignin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // toast.dismiss();
            // toast.success("Successfully sign In");
            setEmail('');
            setPassword('');
            navigate('/dashboard');
            // Optionally redirect or clear form
        } catch (err) {
            setError(err.message);
            // toast.dismiss();
            // toast.error(err.message);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Sign In</h2>
            {error && <p className="text-red-600 mb-3">{error}</p>}
            <form onSubmit={handleSignin} className="space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-2 border rounded"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-2 border rounded"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Sign In
                </button>
            </form>
        </div>
    );
};

export default Signin;
