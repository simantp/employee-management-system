p1 = """'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Zap, 
  RotateCcw,
  Check,
  Shield,
  Briefcase,
  Palette,
  Printer,
  Layers,
  Loader2,
  KeyRound,
  Timer
} from 'lucide-react';
import { useApp } from '@/lib/store';
import confetti from 'canvas-confetti';

export default function AuthPortal() {
  const { 
    login, 
    register, 
    verifyOTP, 
    resendOTP, 
    pendingOTP, 
    users,
    employees,
    clockInWithKiosk,
    clockOutWithKiosk,
    activePortal 
  } = useApp();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'VERIFY_OTP' | 'KIOSK'>('LOGIN');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regForm, setRegForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    password: '',
    department: 'Large Format & Digital Print',
  });

  const [kioskPin, setKioskPin] = useState('');
  const [kioskPassword, setKioskPassword] = useState('');
  const [kioskFeedback, setKioskFeedback] = useState<{
    type: 'IN' | 'OUT';
    staffName: string;
    department: string;
    avatarUrl?: string;
    time: string;
    hours?: number;
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(45);

  const [sydneyTimeStr, setSydneyTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSydneyTimeStr(
        now.toLocaleTimeString('en-AU', {
          timeZone: 'Australia/Sydney',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'VERIFY_OTP' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, resendTimer]);

  useEffect(() => {
    if (pendingOTP) {
      setMode('VERIFY_OTP');
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(45);
    }
  }, [pendingOTP]);

  const matchedStaff = employees.find(e => e.kioskPin === kioskPin.trim());

  const handleKioskClockIn = () => {
    if (!kioskPin || !matchedStaff) return;
    const res = clockInWithKiosk(kioskPin, kioskPassword);
    if (res.success && res.employee) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      const now = new Date();
      setKioskFeedback({
        type: 'IN',
        staffName: `${res.employee.firstName} ${res.employee.lastName}`,
        department: res.employee.department || 'Production',
        avatarUrl: res.employee.avatarUrl,
        time: now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: true }),
        message: res.message
      });
      setTimeout(() => {
        setKioskPin('');
        setKioskPassword('');
        setKioskFeedback(null);
      }, 4000);
    }
  };

  const handleKioskClockOut = () => {
    if (!kioskPin || !matchedStaff) return;
    const res = clockOutWithKiosk(kioskPin, kioskPassword, 30);
    if (res.success && res.employee) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      const now = new Date();
      setKioskFeedback({
        type: 'OUT',
        staffName: `${res.employee.firstName} ${res.employee.lastName}`,
        department: res.employee.department || 'Production',
        avatarUrl: res.employee.avatarUrl,
        time: now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: true }),
        hours: res.totalHours,
        message: res.message
      });
      setTimeout(() => {
        setKioskPin('');
        setKioskPassword('');
        setKioskFeedback(null);
      }, 4000);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    setErrorMessage(null);
    login(loginEmail);
  };

  const handleQuickLogin = (email: string) => {
    setErrorMessage(null);
    login(email);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.firstName || !regForm.lastName || !regForm.email || !regForm.mobilePhone) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await register({
        firstName: regForm.firstName,
        lastName: regForm.lastName,
        email: regForm.email,
        mobilePhone: regForm.mobilePhone,
        password: regForm.password || 'password123',
        department: regForm.department,
      });

      if (res.success) {
        setMode('VERIFY_OTP');
      } else {
        setErrorMessage(res.message || 'Registration could not be completed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while sending the email code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((d, i) => {
        newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      if (pasted.length === 6) {
        handleVerifyCode(pasted.join(''));
      }
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every(d => d !== '') && val) {
      handleVerifyCode(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = (codeToVerify: string) => {
    const success = verifyOTP(codeToVerify);
    if (success) {
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {}
    }
  };
"""

with open(r"src\components\auth\AuthPortal.tsx", "w", encoding="utf-8") as f:
    f.write(p1)

print("Part 1 written.")
