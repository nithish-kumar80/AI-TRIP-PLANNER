import { motion } from 'framer-motion';
export default function HotelCard({ hotel }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="card-hover">
      <h3 className="font-bold text-white">{hotel?.name || 'Hotel'}</h3>
      <p className="text-slate-400">{hotel?.city || 'City'}</p>
      <div className="mt-4 text-accent font-bold">${hotel?.price || 100}/night</div>
    </motion.div>
  );
}
