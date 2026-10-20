import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-dark-900 mesh-bg flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-900/50 to-dark-900 items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        </div>
        <div className="relative z-10 text-center px-12">
          <Link to="/" className="text-4xl font-black gradient-text block mb-6">✈️ VoyageAI</Link>
          <h2 className="text-3xl font-bold text-white mb-4">Your AI Travel Companion</h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Plan perfect trips with AI-generated itineraries, discover amazing hotels,
            and manage your travel budget — all in one place.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="text-3xl font-black gradient-text">✈️ VoyageAI</Link>
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
