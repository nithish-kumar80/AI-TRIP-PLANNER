export default function BookingModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="card w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Book Room</h2>
        <input type="date" className="input-field mb-4" />
        <input type="date" className="input-field mb-4" />
        <button className="btn-primary w-full mb-2">Confirm Booking</button>
        <button onClick={onClose} className="btn-ghost w-full">Cancel</button>
      </div>
    </div>
  );
}
