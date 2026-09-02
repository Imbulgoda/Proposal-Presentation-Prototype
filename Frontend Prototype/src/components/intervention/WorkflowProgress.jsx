import { Check } from 'lucide-react';

const interventionWorkflowSteps = [
  'Prediction Review',
  'Risk Factor Analysis',
  'Counterfactual Generation',
  'Feasibility Filtering',
  'Intervention Ranking',
  'Personalized Plan',
  'Healthcare Review',
];

export default function WorkflowProgress({ currentStep = 1, reviewCompleted = false, className = '' }) {
  return (
    <section aria-label="Component 4 workflow progress" className={`overflow-x-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ${className}`}>
      <div className="flex min-w-[760px] items-start">
        {interventionWorkflowSteps.map((step, index) => {
          const stepNumber = index + 1;
          const completed = stepNumber < currentStep || (stepNumber === 7 && reviewCompleted);
          const current = stepNumber === currentStep && !completed;
          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex min-w-24 flex-col items-center text-center">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${completed ? 'bg-success text-white' : current ? 'bg-secondary text-white ring-4 ring-secondary/10' : 'bg-slate-200 text-slate-500'}`}>
                  {completed ? <Check size={15} aria-hidden="true" /> : stepNumber}
                </span>
                <span className={`mt-2 text-[10px] font-semibold ${current ? 'text-secondary' : 'text-slate-600'}`}>{step}</span>
              </div>
              {index < interventionWorkflowSteps.length - 1 && <div className={`mt-4 h-0.5 flex-1 ${completed ? 'bg-success' : 'bg-slate-200'}`} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
