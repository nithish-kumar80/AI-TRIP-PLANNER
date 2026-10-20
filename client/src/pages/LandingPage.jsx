import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Hotel, Map, MessageSquare, Wallet, FileText, Star, CheckCircle, ArrowRight, Globe, Zap, Shield } from 'lucide-react';

const features = [
  { icon: Plane, title: 'AI Trip Planner', desc: 'Get personalized day-by-day itineraries crafted by AI in seconds. Just enter your destination and preferences.', color: 'from-violet-500 to-purple-600', badge: 'Most Popular' },
  { icon: Hotel, title: 'Hotel Booking', desc: 'Discover and book from curated hotels matching your budget. Read reviews, compare amenities, and book instantly.', color: 'from-blue-500 to-cyan-600', badge: null },
  { icon: Map, title: 'Interactive Maps', desc: 'Visualize your entire journey on an interactive map with hotels, restaurants, and tourist attractions.', color: 'from-emerald-500 to-teal-600', badge: null },
  { icon: MessageSquare, title: 'AI Travel Chat', desc: 'Chat with your personal AI travel assistant 24/7. Ask anything from visa requirements to local food tips.', color: 'from-orange-500 to-amber-600', badge: 'New' },
  { icon: Wallet, title: 'Budget Planner', desc: 'Smart AI budget breakdown for your entire trip. Know exactly how much to spend on hotels, food, and activities.', color: 'from-pink-500 to-rose-600', badge: null },
  { icon: FileText, title: 'PDF Export', desc: 'Export your complete itinerary as a beautifully formatted PDF to share with travel companions or print offline.', color: 'from-indigo-500 to-blue-600', badge: null },
];

const destinations = [
  { name: 'Goa', desc: 'Beach Paradise', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80', tours: '142 tours' },
  { name: 'Jaipur', desc: 'Pink City Heritage', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&q=80', tours: '98 tours' },
  { name: 'Kerala', desc: 'God\'s Own Country', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80', tours: '115 tours' },
  { name: 'Manali', desc: 'Mountain Adventure', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80', tours: '87 tours' },
  { name: 'Varanasi', desc: 'Spiritual Journey', image: 'https://images.unsplash.com/photo-1561361058-c24e3b52c6c5?w=400&q=80', tours: '64 tours' },
  { name: 'Udaipur', desc: 'City of Lakes', image: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=400&q=80', tours: '76 tours' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Solo Traveler', avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=6366f1&color=ffffff', rating: 5, comment: 'VoyageAI planned my entire Rajasthan trip in minutes! The AI itinerary was spot-on with hidden gems I never would have found myself.' },
  { name: 'Rahul Mehta', role: 'Family Vacationer', avatar: 'https://ui-avatars.com/api/?name=Rahul+Mehta&background=14b8a6&color=ffffff', rating: 5, comment: 'Booked hotels for our family of 5 effortlessly. The budget planner helped us stay within our ₹80,000 budget perfectly.' },
  { name: 'Ananya Krishnan', role: 'Digital Nomad', avatar: 'https://ui-avatars.com/api/?name=Ananya+Krishnan&background=f59e0b&color=ffffff', rating: 5, comment: 'The AI chat assistant is incredible! It suggested the best coworking spaces and cafés in each city I visited.' },
];

const steps = [
  { step: '01', title: 'Tell us your dream', desc: 'Enter your destination, budget, travel dates, and interests. The more you share, the better we personalize.' },
  { step: '02', title: 'AI crafts your trip', desc: 'Our Gemini-powered AI generates a complete itinerary, hotel recommendations, and budget breakdown in seconds.' },
  { step: '03', title: 'Travel & enjoy', desc: 'Book hotels, export your itinerary as PDF, and chat with your AI assistant throughout your journey.' },
];

const stats = [
  { value: '50K+', label: 'Trips Planned' },
  { value: '10K+', label: 'Hotels Listed' },
  { value: '95%', label: 'Satisfaction Rate' },
  { value: '24/7', label: 'AI Support' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-dark-700/50">
        <div className="page-container h-16 flex items-center justify-between">
          <div className="text-2xl font-black gradient-text">✈️ VoyageAI</div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Destinations', 'How it Works'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth/login" className="btn-ghost text-sm px-4 py-2">Login</Link>
            <Link to="/auth/register" className="btn-primary text-sm px-5 py-2.5">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden mesh-bg">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-900/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 page-container text-center py-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/30 text-primary-400 text-sm font-medium px-4 py-2 rounded-full mb-8">
              <Zap size={14} />
              Powered by Google Gemini AI
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight">
              Plan Your Perfect
              <br />
              <span className="gradient-text">Trip with AI</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              The ultimate AI-powered travel platform. Get personalized itineraries, discover amazing hotels,
              manage budgets, and chat with your personal travel assistant — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Link to="/auth/register" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2 group">
                Start Planning For Free
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/auth/login" className="btn-secondary text-lg px-8 py-4">
                Sign In
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="glass p-4 rounded-2xl">
                  <div className="text-2xl font-black gradient-text">{stat.value}</div>
                  <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
          <span className="text-xs">Scroll to explore</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-5 h-8 border-2 border-slate-600 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-slate-500 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-dark-900">
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Everything You Need to
              <span className="gradient-text"> Travel Smarter</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Six powerful tools combined into one intelligent platform, so you never have to switch apps again.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={itemVariants} whileHover={{ y: -8 }} className="glass-dark p-6 rounded-2xl relative overflow-hidden group cursor-default">
                {feature.badge && (
                  <span className="absolute top-4 right-4 badge-primary text-xs">{feature.badge}</span>
                )}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl`} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-dark-800/50">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Plan Your Trip in <span className="gradient-text">3 Simple Steps</span></h2>
            <p className="text-slate-400 text-lg">From idea to itinerary in under 60 seconds.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary-600 to-accent" />

            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center relative"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-500/25 border-4 border-dark-900">
                  <span className="text-2xl font-black text-white">{step.step}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section id="destinations" className="py-24 bg-dark-900">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Popular <span className="gradient-text">Destinations</span></h2>
            <p className="text-slate-400 text-lg">Explore India's most beloved travel spots with AI-powered planning.</p>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <motion.div key={dest.name} variants={itemVariants} whileHover={{ scale: 1.03 }} className="relative overflow-hidden rounded-2xl cursor-pointer group h-56">
                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${dest.name}&size=400&background=6366f1&color=ffffff`; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-xl font-bold text-white">{dest.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-300 text-sm">{dest.desc}</span>
                    <span className="text-primary-400 text-xs font-medium">{dest.tours}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-dark-800/50">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Loved by <span className="gradient-text">Thousands of Travelers</span></h2>
            <p className="text-slate-400 text-lg">Join our growing community of happy explorers.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="glass-dark p-6 rounded-2xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (<Star key={j} size={16} className="text-amber-400 fill-amber-400" />))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">"{t.comment}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="text-white font-semibold text-sm">{t.name}</div>
                    <div className="text-slate-500 text-xs">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-dark-900">
        <div className="page-container text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="gradient-border bg-dark-800 p-12 rounded-3xl max-w-3xl mx-auto">
            <div className="text-5xl mb-6">✈️</div>
            <h2 className="text-4xl font-black text-white mb-4">Ready to Start Your Adventure?</h2>
            <p className="text-slate-400 text-lg mb-8">Join thousands of travelers who plan smarter with VoyageAI. Your perfect trip is just a few clicks away.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                <Plane size={20} />
                Plan My First Trip
              </Link>
              <Link to="/auth/login" className="btn-secondary text-lg px-8 py-4">
                I have an account
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-800 border-t border-dark-700 py-12">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-xl font-black gradient-text mb-3">✈️ VoyageAI</div>
              <p className="text-slate-400 text-sm leading-relaxed">AI-powered travel planning for the modern explorer. Plan, book, and travel smarter.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Trip Planner', 'Hotel Booking', 'AI Chat'] },
              { title: 'Destinations', links: ['Goa', 'Jaipur', 'Kerala', 'Manali'] },
              { title: 'Company', links: ['About Us', 'Privacy Policy', 'Terms of Service', 'Contact'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-semibold mb-3 text-sm">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (<li key={link}><a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">{link}</a></li>))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-dark-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">© 2024 VoyageAI. All rights reserved.</p>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Shield size={14} />
              <span>Secured & Trusted Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
