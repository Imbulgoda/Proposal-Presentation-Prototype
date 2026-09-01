import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Gauge,
  LineChart,
  LockKeyhole,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';

const districtSignals = [
  {
    district: 'Nuwara Eliya',
    drift: 0.34,
    threshold: 0.2,
    severity: 'Critical',
    reason: 'Child wasting pattern shifted after estate-clinic reporting delay',
    samples: 1840,
    accuracy: 71.8,
    recalibrated: 85.4,
    status: 'Recalibration required',
  },
  {
    district: 'Badulla',
    drift: 0.28,
    threshold: 0.2,
    severity: 'High',
    reason: 'Income and food-price features no longer match training window',
    samples: 1625,
    accuracy: 74.2,
    recalibrated: 84.1,
    status: 'Queued for local update',
  },
  {
    district: 'Monaragala',
    drift: 0.23,
    threshold: 0.2,
    severity: 'High',
    reason: 'Seasonal drought features changed risk distribution',
    samples: 1375,
    accuracy: 76.6,
    recalibrated: 83.5,
    status: 'Awaiting validation',
  },
  {
    district: 'Colombo',
    drift: 0.12,
    threshold: 0.2,
    severity: 'Stable',
    reason: 'Current data remains inside accepted distribution band',
    samples: 2480,
    accuracy: 88.7,
    recalibrated: 89.2,
    status: 'Monitoring only',
  },
];

const monthlyDrift = [
  { month: 'Jan', feature: 0.08, label: 0.04, accuracy: 89.5 },
  { month: 'Feb', feature: 0.1, label: 0.05, accuracy: 88.9 },
  { month: 'Mar', feature: 0.12, label: 0.08, accuracy: 87.4 },
  { month: 'Apr', feature: 0.16, label: 0.1, accuracy: 84.8 },
  { month: 'May', feature: 0.19, label: 0.13, accuracy: 82.2 },
  { month: 'Jun', feature: 0.24, label: 0.16, accuracy: 78.6 },
  { month: 'Jul', feature: 0.31, label: 0.21, accuracy: 73.9 },
  { month: 'Aug', feature: 0.34, label: 0.25, accuracy: 71.8 },
];

const featureShift = [
  { feature: 'Age 6-24m', training: 28, current: 39 },
  { feature: 'Low BMI mother', training: 32, current: 45 },
  { feature: 'Food insecurity', training: 41, current: 57 },
  { feature: 'Clinic missed visits', training: 18, current: 31 },
  { feature: 'Safe water access', training: 72, current: 63 },
];

const recalibrationSteps = [
  {
    title: 'Detect',
    text: 'Compare live district data with the model training window using PSI and label-distribution checks.',
    icon: Activity,
  },
  {
    title: 'Validate',
    text: 'Confirm drift with accuracy decay, confidence widening, and PHM/clinic staff review.',
    icon: ShieldCheck,
  },
  {
    title: 'Recalibrate',
    text: 'Fine-tune district adapters locally and share encrypted model deltas instead of raw child records.',
    icon: RefreshCcw,
  },
  {
    title: 'Approve',
    text: 'Promote the recalibrated model only when fairness, recall, and privacy checks pass.',
    icon: CheckCircle2,
  },
];

const sensitivityProfiles = {
  Standard: { threshold: 0.2, label: 'Balanced alerts', update: '+11.4%' },
  Sensitive: { threshold: 0.16, label: 'Earlier detection', update: '+13.1%' },
  Conservative: { threshold: 0.24, label: 'Fewer alerts', update: '+8.6%' },
};

const driftColors = {
  Critical: '#E74C3C',
  High: '#F39C12',
  Stable: '#27AE60',
};

function severityClass(severity) {
  if (severity === 'Critical') return 'bg-danger/10 text-danger';
  if (severity === 'High') return 'bg-warning/10 text-warning';
  return 'bg-success/10 text-success';
}

export default function PrivacyRecalibration() {
  const { logout } = useApp();
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState(districtSignals[0].district);
  const [profile, setProfile] = useState('Standard');

  const selected = useMemo(
    () => districtSignals.find((item) => item.district === selectedDistrict) || districtSignals[0],
    [selectedDistrict]
  );

  const threshold = sensitivityProfiles[profile].threshold;
  const triggeredDistricts = districtSignals.filter((item) => item.drift >= threshold);
  const averageAccuracyDrop = Math.round(
    districtSignals.reduce((sum, item) => sum + (item.recalibrated - item.accuracy), 0) /
      districtSignals.length
  );
  const driftScore = Math.round(selected.drift * 100);

  const runRecalibration = () => {
    toast.success(`${selected.district} recalibration package created for review`);
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white">
              <Bot size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">FedNutri-XAI</p>
              <p className="text-[11px] text-slate-500">Component 03</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/research-home"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-slate-50"
            >
              <ArrowLeft size={14} /> Hub
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-slate-50"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <section className="animate-fade-in rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold text-secondary">
                <RefreshCcw size={12} /> Concept Drift Detection & Model Recalibration
              </span>
              <h1 className="text-2xl font-bold text-primary md:text-4xl">
                Adaptive malnutrition model monitoring
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 md:text-base">
                Detect when district nutrition patterns move away from the training data, quantify
                model decay, and trigger privacy-preserving recalibration before forecast quality drops
                below clinical decision-support standards.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center sm:min-w-[430px]">
              {[
                { label: 'Drift alerts', value: triggeredDistricts.length, icon: AlertTriangle },
                { label: 'Accuracy gain', value: `+${averageAccuracyDrop}%`, icon: Gauge },
                { label: 'Raw records shared', value: '0', icon: LockKeyhole },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className="rounded-2xl bg-surface p-3">
                    <Icon className="mx-auto mb-1 text-secondary" size={17} />
                    <p className="text-xl font-bold text-primary">{metric.value}</p>
                    <p className="text-[10px] font-medium text-slate-500">{metric.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-8">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-bold text-primary">Live Drift Monitor</h2>
                <p className="text-xs text-slate-500">Feature drift, label drift, and model accuracy decay</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(sensitivityProfiles).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setProfile(name)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${
                      profile === name
                        ? 'bg-secondary text-white shadow-md shadow-secondary/25'
                        : 'border border-slate-200 bg-white text-primary hover:bg-slate-50'
                    }`}
                  >
                    <SlidersHorizontal size={13} /> {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={monthlyDrift} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="drift" domain={[0, 0.4]} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="accuracy" orientation="right" domain={[65, 95]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'accuracy' ? [`${value}%`, 'Accuracy'] : [value, name]
                    }
                  />
                  <Legend />
                  <Line
                    yAxisId="drift"
                    type="monotone"
                    dataKey="feature"
                    name="Feature PSI"
                    stroke="#6C5CE7"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="drift"
                    type="monotone"
                    dataKey="label"
                    name="Label drift"
                    stroke="#F39C12"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="accuracy"
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy"
                    stroke="#27AE60"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-primary">District Signal</h2>
                <p className="text-xs text-slate-500">{sensitivityProfiles[profile].label}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${severityClass(selected.severity)}`}>
                {selected.severity}
              </span>
            </div>

            <select
              value={selectedDistrict}
              onChange={(event) => setSelectedDistrict(event.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-primary outline-none focus:border-secondary"
            >
              {districtSignals.map((item) => (
                <option key={item.district} value={item.district}>
                  {item.district}
                </option>
              ))}
            </select>

            <div className="mt-5 flex items-center justify-center">
              <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-surface">
                <div
                  className="absolute inset-3 rounded-full"
                  style={{
                    background: `conic-gradient(${driftColors[selected.severity]} ${driftScore}%, #E2E8F0 ${driftScore}% 100%)`,
                  }}
                />
                <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                  <p className="text-3xl font-bold text-primary">{selected.drift.toFixed(2)}</p>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">PSI drift</p>
                  <p className="mt-1 text-[10px] text-slate-500">Threshold {threshold.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="rounded-xl bg-surface p-3">
                <p className="text-xs font-semibold text-slate-400">Detected cause</p>
                <p className="mt-1 text-slate-600">{selected.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface p-3">
                  <p className="text-xs text-slate-400">Live samples</p>
                  <p className="font-bold text-primary">{selected.samples.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-surface p-3">
                  <p className="text-xs text-slate-400">Status</p>
                  <p className="font-bold text-primary">{selected.status}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-5">
            <div className="mb-4">
              <h2 className="font-bold text-primary">Feature Distribution Shift</h2>
              <p className="text-xs text-slate-500">Training window vs current district reporting window</p>
            </div>
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureShift} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="feature" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="training" name="Training" fill="#0B1F4D" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="current" name="Current" fill="#6C5CE7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-4">
            <div className="mb-4">
              <h2 className="font-bold text-primary">Recalibration Impact</h2>
              <p className="text-xs text-slate-500">Expected recovery after district adapter update</p>
            </div>
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={districtSignals.map((item) => ({
                    district: item.district,
                    current: item.accuracy,
                    after: item.recalibrated,
                  }))}
                  margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="district" tick={{ fontSize: 10 }} />
                  <YAxis domain={[65, 92]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Area type="monotone" dataKey="current" name="Current" stroke="#E74C3C" fill="#E74C3C22" />
                  <Area type="monotone" dataKey="after" name="After recalibration" stroke="#27AE60" fill="#27AE6022" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="font-bold text-primary">Recalibration Queue</h2>
                <p className="text-xs text-slate-500">Prioritized by drift severity</p>
              </div>
              <Zap size={18} className="text-warning" />
            </div>
            <div className="space-y-3">
              {districtSignals.map((item) => (
                <button
                  key={item.district}
                  type="button"
                  onClick={() => setSelectedDistrict(item.district)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedDistrict === item.district
                      ? 'border-secondary bg-secondary/5'
                      : 'border-slate-100 bg-surface hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-primary">{item.district}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${severityClass(item.severity)}`}>
                      {item.drift.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.status}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {recalibrationSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-300">0{index + 1}</span>
                </div>
                <h3 className="font-bold text-primary">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.text}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-2 flex items-center gap-2">
                <LineChart size={18} className="text-secondary" />
                <h2 className="font-bold text-primary">Demo Decision</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-500">
                {selected.district} has a PSI score of {selected.drift.toFixed(2)}. Under the {profile.toLowerCase()}
                profile, the system recommends a privacy-preserving recalibration cycle with an expected
                model quality recovery of {sensitivityProfiles[profile].update}.
              </p>
            </div>
            <button
              type="button"
              onClick={runRecalibration}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-secondary/25 transition hover:opacity-95"
            >
              <RefreshCcw size={16} /> Generate Recalibration Package
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
