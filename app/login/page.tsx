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
      router.push('/admin');
    }
  }, [user, loading, router]);

  return (
    <AuthProvider>
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100">
      <motion.div
        variants={slideUp}
        initial="initial"
        animate="animate"
        className="w-full max-w-md px-4 relative z-10"
      >
        <Card className="p-8 backdrop-blur-sm bg-white/80 shadow-xl">
          <motion.div 
            className="mb-8 text-center"
            variants={slideUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-center mb-4">
              <motion.div
                className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <span className="text-white text-2xl font-bold">L</span>
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue to your dashboard
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Alert variant="destructive">
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
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
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
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </motion.div>

     

            <motion.div
              variants={slideUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.6 }}
            >
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </motion.div>
                ) : (
                  'Sign in'
                )}
              </Button>
            </motion.div>
          </form>

        </Card>
      </motion.div>
    </div>
    </AuthProvider>
  );
}

