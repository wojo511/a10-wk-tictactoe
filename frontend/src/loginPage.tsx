import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from './authService.ts';
import './App.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const session = await signIn(email, password);
      console.log('Login successful', session);
      if (session && typeof session.AccessToken !== 'undefined') {
        sessionStorage.setItem('accessToken', session.AccessToken);
        if (sessionStorage.getItem('accessToken')) {
          setToken(session.AccessToken);
        } else {
          console.error('Session token was not set properly.');
        }
      } else {
        console.error('SignIn session or AccessToken is undefined.');
      }
    } catch (error) {
      alert(`Login failed: ${error}`);
    }
  };

  useEffect(() => {
    if (token) {
      navigate('/', { state: { email } });
    }
  }, [token, navigate, email]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      await signUp(email, password);
      navigate('/confirm', { state: { email } });
    } catch (error) {
      alert(`Register failed: ${error}`);
    }
  };

  return (
      <div className="loginForm">
        <h1>Tic Tac Toe</h1>
        <h4>{isSignUp ? 'Register to create an account' : 'Login to your account'}</h4>
        <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          <div>
            <input
                className="inputText"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
          </div>
          <div>
            <input
                className="inputText"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
            />
          </div>
          {isSignUp && (
              <div>
                <input
                    className="inputText"
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                />
              </div>
          )}
          <button type="submit" className="submitButton">{isSignUp ? 'Register' : 'Login'}</button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="toggleButton">
          {isSignUp ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
  );
};

export default LoginPage;