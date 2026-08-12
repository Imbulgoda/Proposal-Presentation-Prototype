import {
  Building2,
  GraduationCap,
  HeartPulse,
  Stethoscope,
  Users,
  UserCheck,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import MetricCard from '../components/cards/MetricCard';
import ExportToolbar from '../components/export/ExportToolbar';
import { clinicStaffDetails } from '../data/clinicData';

export default function ClinicStaff() {
  const { summary, provinces, services, roster } = clinicStaffDetails;

  return (
    <div className="min-h-screen">
      <Navbar
        title="Clinic Staff"
        subtitle="Nutrition clinic workforce, services and programme capacity"
      />
      <div className="space-y-5 p-4 md:p-6">
        <div className="flex justify-end">
          <ExportToolbar
            pdfSections={[
              {
                heading: 'Clinic Staff Summary',
                lines: [
                  `Clinics: ${summary.totalClinics}`,
                  `Nutrition Officers: ${summary.nutritionOfficers}`,
                  `Healthcare Workers: ${summary.healthcareWorkers}`,
                  `Active Programs: ${summary.activePrograms}`,
                ],
              },
            ]}
            excelSheets={{ Provinces: provinces, Services: services, Roster: roster }}
            csvRows={roster}
            pdfName="FedNutri-ClinicStaff.pdf"
            excelName="FedNutri-ClinicStaff.xlsx"
            csvName="FedNutri-ClinicRoster.csv"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard title="Total Clinics" value={summary.totalClinics} subtitle="Nationwide" icon={Building2} accent="#6C5CE7" />
          <MetricCard title="Nutrition Officers" value={summary.nutritionOfficers} subtitle="Deployed staff" icon={Stethoscope} accent="#3498DB" />
          <MetricCard title="Healthcare Workers" value={summary.healthcareWorkers} subtitle="Field & clinic" icon={Users} accent="#27AE60" />
          <MetricCard title="Active Programs" value={summary.activePrograms} subtitle="Running this quarter" icon={HeartPulse} accent="#F39C12" />
          <MetricCard title="Open Vacancies" value={summary.vacancies} subtitle="Recruitment pipeline" icon={UserCheck} accent="#E74C3C" />
          <MetricCard title="Training Completed" value={`${summary.trainingCompleted}%`} subtitle="Annual CPD target" icon={GraduationCap} accent="#0B1F4D" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-[#4C1D95] to-secondary px-5 py-4 text-white">
              <h3 className="font-bold">Nutrition Clinic Staff & Services</h3>
              <p className="text-xs text-white/70">Service coverage across active clinics</p>
            </div>
            <div className="space-y-4 p-5">
              {services.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-primary">{s.name}</span>
                    <span className="font-semibold text-secondary">{s.coverage}%</span>
                  </div>
                  <div className="mb-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${s.coverage}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {s.clinicsOffering} clinics · {s.monthlySessions.toLocaleString()} monthly sessions
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-primary">Provincial Capacity</h3>
            <p className="mb-4 text-xs text-slate-500">Clinics, officers and workers by province</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="pb-2">Province</th>
                    <th className="pb-2">Clinics</th>
                    <th className="pb-2">Officers</th>
                    <th className="pb-2">Workers</th>
                    <th className="pb-2">Programs</th>
                  </tr>
                </thead>
                <tbody>
                  {provinces.map((p) => (
                    <tr key={p.province} className="border-b border-slate-50">
                      <td className="py-2.5 font-medium text-primary">{p.province}</td>
                      <td className="py-2.5">{p.clinics}</td>
                      <td className="py-2.5">{p.officers}</td>
                      <td className="py-2.5">{p.workers}</td>
                      <td className="py-2.5">{p.programs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-primary">Staff Roster (Sample)</h3>
          <p className="mb-4 text-xs text-slate-500">Representative officers for demonstration</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">District</th>
                  <th className="pb-2">Clinic</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.name} className="border-b border-slate-50">
                    <td className="py-2.5 font-medium text-primary">{r.name}</td>
                    <td className="py-2.5">{r.role}</td>
                    <td className="py-2.5">{r.district}</td>
                    <td className="py-2.5 text-slate-500">{r.clinic}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          r.status === 'Active'
                            ? 'bg-success/10 text-success'
                            : 'bg-secondary/10 text-secondary'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
