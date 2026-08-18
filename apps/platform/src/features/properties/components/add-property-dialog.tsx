import { Button } from "@propertyos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@propertyos/ui/components/dialog";
import { Input } from "@propertyos/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@propertyos/ui/components/select";
import { Stepper, type StepperStep } from "@propertyos/ui/components/stepper";
import {
  BuildingIcon,
  CameraIcon,
  CheckCircle2Icon,
  DoorOpenIcon,
  MapPinIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PROPERTY_TYPE_OPTIONS = [
  { value: "villa", label: "Villa" },
  { value: "hotel", label: "Hotel" },
  { value: "apartment", label: "Apartment" },
  { value: "homestay", label: "Homestay" },
  { value: "hostel", label: "Hostel" },
  { value: "other", label: "Other" },
];

const STEPS: StepperStep[] = [
  { label: "Basic Info", icon: <BuildingIcon className="size-4" /> },
  { label: "Location", icon: <MapPinIcon className="size-4" /> },
  { label: "First Room Type", icon: <DoorOpenIcon className="size-4" /> },
  { label: "Cover Photo", icon: <CameraIcon className="size-4" /> },
  { label: "Done", icon: <CheckCircle2Icon className="size-4" /> },
];

const INITIAL_FORM = {
  name: "",
  propertyType: "villa",
  description: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  pinCode: "",
  roomTypeName: "Entire Property",
  quantity: "1",
  baseRate: "",
};

export function AddPropertyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);

  function reset() {
    setCurrentStep(1);
    setForm(INITIAL_FORM);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleFinish() {
    toast.success("Property created", {
      description: `${form.name || "New property"} has been added to your portfolio.`,
    });
    handleOpenChange(false);
  }

  const canAdvance =
    (currentStep === 1 && form.name.trim().length > 0) ||
    (currentStep === 2 && form.city.trim().length > 0) ||
    currentStep === 3 ||
    currentStep === 4 ||
    currentStep === 5;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Property</DialogTitle>
          <DialogDescription>
            Set up a new location in your portfolio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-4 pb-2">
          <Stepper steps={STEPS} currentStep={currentStep} />

          {currentStep === 1 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Property Name
                </span>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sunrise Villa"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Property Type
                </span>
                <Select
                  value={form.propertyType}
                  onValueChange={(value) =>
                    setForm({ ...form, propertyType: value as string })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type">
                      {(value: unknown) =>
                        PROPERTY_TYPE_OPTIONS.find((o) => o.value === value)
                          ?.label ?? "Type"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Description
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Short description of the property"
                  rows={3}
                  className="w-full min-w-0 resize-none rounded-none border border-input bg-transparent px-2.5 py-1.5 text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Address Line 1
                </span>
                <Input
                  value={form.addressLine1}
                  onChange={(e) =>
                    setForm({ ...form, addressLine1: e.target.value })
                  }
                  placeholder="Street address"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Address Line 2
                </span>
                <Input
                  value={form.addressLine2}
                  onChange={(e) =>
                    setForm({ ...form, addressLine2: e.target.value })
                  }
                  placeholder="Landmark, area (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs">City</span>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs">State</span>
                  <Input
                    value={form.state}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                    placeholder="State"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs">Country</span>
                  <Input
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs">
                    PIN Code
                  </span>
                  <Input
                    value={form.pinCode}
                    onChange={(e) =>
                      setForm({ ...form, pinCode: e.target.value })
                    }
                    placeholder="PIN Code"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-xs">
                We auto-created a default room type. Rename it and set a
                quantity — use 1 for a whole-property listing like a villa.
              </p>
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Room Type Name
                </span>
                <Input
                  value={form.roomTypeName}
                  onChange={(e) =>
                    setForm({ ...form, roomTypeName: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs">
                    Quantity
                  </span>
                  <Input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs">
                    Base Rate (₹/night)
                  </span>
                  <Input
                    type="number"
                    value={form.baseRate}
                    onChange={(e) =>
                      setForm({ ...form, baseRate: e.target.value })
                    }
                    placeholder="e.g. 3500"
                  />
                </div>
              </div>
              {Number(form.quantity) > 1 && (
                <p className="border bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
                  We'll auto-generate {form.quantity} units (e.g. Room 101,
                  102...) that you can rename later from Rooms & Units.
                </p>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex flex-col items-center gap-3 border border-dashed py-10 text-center">
              <CameraIcon className="size-6 text-muted-foreground" />
              <p className="text-sm">Upload a cover photo</p>
              <p className="max-w-xs text-muted-foreground text-xs">
                This image appears on the property card in your directory. You
                can add more photos later from the Gallery tab.
              </p>
              <Button variant="outline" size="sm" type="button">
                Choose File
              </Button>
            </div>
          )}

          {currentStep === 5 && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2Icon className="size-8 text-success" />
              <p className="text-sm">
                {form.name || "Your new property"} is ready to configure.
              </p>
              <p className="max-w-xs text-muted-foreground text-xs">
                Continue setting up pricing, policies, amenities, and photos
                from the property detail page.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            >
              Back
            </Button>
          )}
          {currentStep < 5 ? (
            <Button
              disabled={!canAdvance}
              onClick={() => setCurrentStep((s) => Math.min(5, s + 1))}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleFinish}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
