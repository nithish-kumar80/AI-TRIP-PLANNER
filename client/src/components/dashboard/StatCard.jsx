export default function StatCard({ label, value }) {
  return (
    <div className="card">
      <h3 className="text-slate-400 text-sm">{label}</h3>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
    </div>
  );
}
