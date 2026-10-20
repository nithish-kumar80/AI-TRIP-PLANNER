import { motion } from 'framer-motion';
export default function TripCard({ trip }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="card-hover">
      <h3 className="font-bold text-white">{trip?.title || 'Trip'}</h3>
      <p className="text-slate-400">{trip?.dest || 'Destination'}</p>
    </motion.div>
  );
}
