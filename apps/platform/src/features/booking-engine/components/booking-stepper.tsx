const STEPS = ["Stay & extras", "Guest & ID proof", "Review & payment"];

export function BookingStepper({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Booking progress" className="grid grid-cols-3 gap-1">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const active = step === activeStep;
        const complete = step < activeStep;

        return (
          <div key={label} className="flex flex-col gap-1">
            <div
              className={`h-1 ${
                active || complete ? "bg-foreground" : "bg-muted"
              }`}
            />
            <span
              className={`text-[10px] ${
                active ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {step}. {label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
