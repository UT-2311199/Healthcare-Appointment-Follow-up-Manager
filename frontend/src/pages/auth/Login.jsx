import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Stethoscope,
  Shield,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/common/ThemeToggle";

const DEMO_CREDS = [
  {
    role: "Admin",
    email: "admin@healthcare.com",
    password: "admin123",
    color: "from-red-500 to-orange-500",
    icon: Shield,
  },
  {
    role: "Doctor",
    email: "doctor@healthcare.com",
    password: "doctor123",
    color: "from-teal-500 to-cyan-500",
    icon: Stethoscope,
  },
  {
    role: "Patient",
    email: "patient@healthcare.com",
    password: "patient123",
    color: "from-violet-500 to-purple-500",
    icon: Heart,
  },
];

// Floating background orbs
function Orbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[
        {
          size: 600,
          x: -200,
          y: -200,
          color: "rgba(124,58,237,0.15)",
          delay: 0,
        },
        {
          size: 400,
          x: "70%",
          y: "60%",
          color: "rgba(59,130,246,0.12)",
          delay: 2,
        },
        {
          size: 300,
          x: "30%",
          y: "80%",
          color: "rgba(16,185,129,0.1)",
          delay: 4,
        },
      ].map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: orb.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const { isDark } = useTheme();
  const { login, loading } = useAuth();

  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password);
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "doctor") navigate("/doctor/dashboard");
      else navigate("/patient/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    }
  };

  const fillCreds = (cred) => {
    setValue("email", cred.email);
    setValue("password", cred.password);
    toast.success(`${cred.role} credentials filled!`, { icon: "✨" });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {isDark && <Orbs />}

      {/* Light mode background pattern */}
      {!isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30"
            style={{
              background: "radial-gradient(circle, #c4b5fd, transparent)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-20"
            style={{
              background: "radial-gradient(circle, #93c5fd, transparent)",
            }}
          />
        </div>
      )}

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* ── Left Side ── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <motion.div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
              <Heart className="w-6 h-6 style={{ color: 'var(--text-primary)' }}" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold style={{ color: 'var(--text-primary)' }}">
                HealthCare+
              </h1>
              <p className="text-xs style={{ color: 'var(--text-tertiary)' }}">
                Advanced Medical Platform
              </p>
            </div>
          </div>

          <h2 className="text-5xl font-bold leading-tight mb-6">
            <span className="style={{ color: 'var(--text-primary)' }}">
              Your Health,
            </span>
            <br />
            <span className="gradient-text">Our Priority</span>
          </h2>

          <p className="style={{ color: 'var(--text-secondary)' }} text-lg mb-10 leading-relaxed">
            AI-powered appointment management connecting patients with the best
            doctors seamlessly.
          </p>

          {/* Features */}
          {[
            {
              icon: "🤖",
              label: "AI Symptom Analysis",
              desc: "Smart pre-visit summaries",
            },
            {
              icon: "📅",
              label: "Smart Scheduling",
              desc: "No double-bookings, ever",
            },
            {
              icon: "💊",
              label: "Medication Reminders",
              desc: "Never miss a dose",
            },
            {
              icon: "📋",
              label: "Digital Visit Summaries",
              desc: "Patient-friendly reports",
            },
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-4 mb-4"
            >
              <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="style={{ color: 'var(--text-primary)' }} text-sm font-semibold">
                  {f.label}
                </p>
                <p className="style={{ color: 'var(--text-tertiary)' }} text-xs">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Right Side — Form ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
            >
              <Heart className="w-5 h-5 style={{ color: 'var(--text-primary)' }}" />
            </div>
            <h1 className="text-xl font-bold style={{ color: 'var(--text-primary)' }}">
              HealthCare+
            </h1>
          </div>

          <div className="glass-card p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }}">
                Welcome back
              </h3>
              <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 style={{ color: 'var(--text-tertiary)' }}" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="input-field pl-10"
                    {...register("email", { required: "Email is required" })}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1.5">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 style={{ color: 'var(--text-tertiary)' }}" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10"
                    {...register("password", {
                      required: "Password is required",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 style={{ color: 'var(--text-tertiary)' }}
                               hover:text-slate-300 transition-colors"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1.5">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center mt-2 py-3"
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="style={{ color: 'var(--text-muted)' }} text-xs">
                or try a demo account
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Demo Credentials */}
            <div className="grid grid-cols-3 gap-2">
              {DEMO_CREDS.map((cred) => (
                <motion.button
                  key={cred.role}
                  onClick={() => fillCreds(cred)}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border
                             border-white/10 hover:border-white/20 transition-all group"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cred.color}
                                   flex items-center justify-center`}
                  >
                    <cred.icon className="w-4 h-4 style={{ color: 'var(--text-primary)' }}" />
                  </div>
                  <span className="text-xs style={{ color: 'var(--text-secondary)' }} group-hover:style={{ color: 'var(--text-primary)' }} transition-colors font-medium">
                    {cred.role}
                  </span>
                </motion.button>
              ))}
            </div>

            <p className="text-center text-sm style={{ color: 'var(--text-tertiary)' }} mt-6">
              New patient?{" "}
              <Link
                to="/register"
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
