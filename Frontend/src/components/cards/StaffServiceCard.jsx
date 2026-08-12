import {
  Activity,
  Building2,
  HeartPulse,
  Stethoscope,
  Users,
} from 'lucide-react';
import { clinicStaffServices } from '../../data/dashboardData';

export default function StaffServiceCard() {
  const stats = [
    { label: 'Total Clinics', value: clinicStaffServices.totalClinics, icon: Building2 },
    { label: 'Nutrition Officers', value: clinicStaffServices.nutritionOfficers, icon: Stethoscope },
    { label: 'Healthcare Workers', value: clinicStaffServices.healthcareWorkers, icon: Users },
    { label: 'Active Programs', value: clinicStaffServices.activePrograms, icon: HeartPulse },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-gradient-to-r from-[#4C1D95] to-[#6C5CE7] px-5 py-4 text-white">
        <div>
          <h3 className="font-bold">Nutrition Clinic Staff & Services</h3>
          <p className="text-xs text-white/70">Workforce capacity and service coverage</p>
        </div>
        <Activity size={20} className="opacity-90" />
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl bg-surface px-3 py-3 text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <Icon size={16} />
            </div>
            <p className="text-lg font-bold text-primary">{value}</p>
            <p className="text-[10px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-slate-100 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Services Provided</p>
        {clinicStaffServices.services.map((s) => (
          <div key={s.name}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-primary">{s.name}</span>
              <span className="font-semibold text-secondary">{s.coverage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-700"
                style={{ width: `${s.coverage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
