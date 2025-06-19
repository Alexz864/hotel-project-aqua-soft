import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { type LoginRequest, type RegisterRequest, type FormErrors } from '../types';
import { Eye, EyeOff, Loader2, Mail, User, Lock, Hotel } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loginData, setLoginData] = useState<LoginRequest>({
    username: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: ''
  });
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (isLogin) {
      //login validation
      if (!loginData.username.trim()) {
        newErrors.username = 'Username is required';
      }
      if (!loginData.password) {
        newErrors.password = 'Password is required';
      }
    } else {
      //register validation
      if (!registerData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (registerData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (registerData.username.length > 50) {
        newErrors.username = 'Username must be less than 50 characters';
      }

      if (!registerData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!registerData.password) {
        newErrors.password = 'Password is required';
      } else if (registerData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (isLogin) {
        const result = await login(loginData);
        if (result.success) {
          navigate('/');
        } else {
          setErrors({ submit: result.error || 'Login failed' });
        }
      } else {
        const result = await register(registerData);
        if (result.success) {
          setIsLogin(true);
          setRegisterData({ username: '', email: '', password: '' });
          setErrors({ success: 'Registration successful! Please log in.' });
        } else {
          setErrors({ submit: result.error || 'Registration failed' });
        }
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setLoginData({ username: '', password: '' });
    setRegisterData({ username: '', email: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-24 px-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Auth Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Hotel className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Hotel Sparkling Awards
          </h1>
          <p className="text-gray-400">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {errors.success && (
              <div className="bg-green-900 border border-green-600 text-green-300 px-4 py-3 rounded-lg text-sm">
                {errors.success}
              </div>
            )}

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-900 border border-red-600 text-red-300 px-4 py-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={isLogin ? loginData.username : registerData.username}
                  onChange={(e) => {
                    if (isLogin) {
                      setLoginData({ ...loginData, username: e.target.value });
                    } else {
                      setRegisterData({ ...registerData, username: e.target.value });
                    }
                    if (errors.username) {
                      setErrors({ ...errors, username: '' });
                    }
                  }}
                  className={`block w-full pl-10 pr-3 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.username ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-400">{errors.username}</p>
              )}
            </div>

            {/* Email Field (Register only) */}
            {!isLogin && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={registerData.email}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, email: e.target.value });
                      if (errors.email) {
                        setErrors({ ...errors, email: '' });
                      }
                    }}
                    className={`block w-full pl-10 pr-3 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.email ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>
            )}

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={isLogin ? loginData.password : registerData.password}
                  onChange={(e) => {
                    if (isLogin) {
                      setLoginData({ ...loginData, password: e.target.value });
                    } else {
                      setRegisterData({ ...registerData, password: e.target.value });
                    }
                    if (errors.password) {
                      setErrors({ ...errors, password: '' });
                    }
                  }}
                  className={`block w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.password ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Mode Switch */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={handleModeSwitch}
                className="ml-1 text-blue-400 hover:text-blue-300 font-medium focus:outline-none focus:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>© 2025 Hotel Sparkling Awards. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;