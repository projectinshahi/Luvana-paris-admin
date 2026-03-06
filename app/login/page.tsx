'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EyeIcon, EyeOffIcon, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; 
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';


const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function LoginPage() {
  const router = useRouter();
  const { login,user, loading  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.email || !formData.password) {
        setError('Please fill all the fields');
        return;
      }
      
      setIsLoading(true);
      setError(''); // Clear any previous error
      
      try {
        const success = await login(formData.email, formData.password);
        if (!success) {
          setError('Login failed. Please try again.');
        }
      } catch (err) {
        if (err instanceof Error) {
          // Check for specific error messages from backend
          const errorMessage = err.message.toLowerCase();
          
          if (errorMessage.includes('blocked')) {
            setError('Your account has been blocked. Please contact administrator.');
          } else if (errorMessage.includes('inactive')) {
            setError('Your account is inactive. Please contact administrator.');
          } else if (errorMessage.includes('not active')) {
            setError('Your account is not active. Please contact administrator.');
          } else if (errorMessage.includes('invalid') || errorMessage.includes('unauthorized')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(err.message || 'Login failed. Please try again.');
          }
        } else {
          setError('Login failed. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };


  useEffect(() => {
    if (!loading && user) {
      router.push('/admin/dashboard');
    }
  }, [user, loading, router]);

  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
            animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
            animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, linear: true }}
          />
        </div>

        {/* Main content */}
        <motion.div
          variants={slideUp}
          initial="initial"
          animate="animate"
          className="w-full max-w-md px-4 relative z-10"
        >
          <Card className="p-8 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl">
            <motion.div 
              className="mb-8 text-center"
              variants={slideUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-center mb-6">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur-lg opacity-75" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl">
                    <span className="text-white text-3xl font-bold">L</span>
                  </div>
                </motion.div>
              </div>
              <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-sm text-blue-100/70">
                Sign in to access your admin dashboard
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Alert className="bg-red-500/20 border border-red-500/30 text-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <motion.div
                variants={slideUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.3 }}
              >
                <label className="text-sm font-medium text-white/80 mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <Input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-11 bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:bg-white/15 rounded-xl transition-all"
                    disabled={isLoading}
                  />
                </div>
              </motion.div>

              <motion.div
                variants={slideUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.4 }}
              >
                <label className="text-sm font-medium text-white/80 mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-11 pr-11 bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:bg-white/15 rounded-xl transition-all"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-blue-200 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              <motion.div
                variants={slideUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.5 }}
                className="pt-2"
              >
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      variants={fadeIn}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="flex items-center justify-center"
                    >
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </motion.div>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Decorative line */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-white/50 text-center">
                Luvana Paris Admin Dashboard
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </AuthProvider>
  );
}

