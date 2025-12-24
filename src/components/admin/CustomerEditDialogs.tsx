import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateCustomer, Customer } from "@/hooks/useCustomers";

interface EditContactInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export const EditContactInfoDialog = ({
  open,
  onOpenChange,
  customer,
}: EditContactInfoDialogProps) => {
  const [email, setEmail] = useState(customer.email || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const updateCustomer = useUpdateCustomer();

  useEffect(() => {
    if (open) {
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
    }
  }, [open, customer]);

  const handleSave = () => {
    updateCustomer.mutate(
      {
        id: customer.id,
        updates: {
          email: email || null,
          phone: phone || null,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit contact information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+84 xxx xxx xxx"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateCustomer.isPending}>
            {updateCustomer.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface EditMarketingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export const EditMarketingDialog = ({
  open,
  onOpenChange,
  customer,
}: EditMarketingDialogProps) => {
  const [acceptsMarketing, setAcceptsMarketing] = useState(customer.accepts_marketing);
  const updateCustomer = useUpdateCustomer();

  useEffect(() => {
    if (open) {
      setAcceptsMarketing(customer.accepts_marketing);
    }
  }, [open, customer]);

  const handleSave = () => {
    updateCustomer.mutate(
      {
        id: customer.id,
        updates: {
          accepts_marketing: acceptsMarketing,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit marketing settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="email-marketing"
              checked={acceptsMarketing}
              onCheckedChange={(checked) => setAcceptsMarketing(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="email-marketing" className="font-medium">
                Email marketing
              </Label>
              <p className="text-sm text-muted-foreground">
                Customer agrees to receive marketing emails
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 opacity-50">
            <Checkbox id="sms-marketing" disabled />
            <div className="space-y-1">
              <Label htmlFor="sms-marketing" className="font-medium">
                SMS marketing
              </Label>
              <p className="text-sm text-muted-foreground">
                Customer agrees to receive SMS marketing (not available)
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateCustomer.isPending}>
            {updateCustomer.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface EditTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export const EditTagsDialog = ({
  open,
  onOpenChange,
  customer,
}: EditTagsDialogProps) => {
  const [tags, setTags] = useState(customer.tags || "");
  const updateCustomer = useUpdateCustomer();

  useEffect(() => {
    if (open) {
      setTags(customer.tags || "");
    }
  }, [open, customer]);

  const handleSave = () => {
    updateCustomer.mutate(
      {
        id: customer.id,
        updates: {
          tags: tags || null,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit tags</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="VIP, Wholesale, Returning (comma separated)"
            />
            <p className="text-sm text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateCustomer.isPending}>
            {updateCustomer.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface EditNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export const EditNotesDialog = ({
  open,
  onOpenChange,
  customer,
}: EditNotesDialogProps) => {
  const [note, setNote] = useState(customer.note || "");
  const updateCustomer = useUpdateCustomer();

  useEffect(() => {
    if (open) {
      setNote(customer.note || "");
    }
  }, [open, customer]);

  const handleSave = () => {
    updateCustomer.mutate(
      {
        id: customer.id,
        updates: {
          note: note || null,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit notes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this customer..."
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Notes are private and only visible to staff
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateCustomer.isPending}>
            {updateCustomer.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface EditCustomerNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export const EditCustomerNameDialog = ({
  open,
  onOpenChange,
  customer,
}: EditCustomerNameDialogProps) => {
  const [firstName, setFirstName] = useState(customer.first_name || "");
  const [lastName, setLastName] = useState(customer.last_name || "");
  const updateCustomer = useUpdateCustomer();

  useEffect(() => {
    if (open) {
      setFirstName(customer.first_name || "");
      setLastName(customer.last_name || "");
    }
  }, [open, customer]);

  const handleSave = () => {
    updateCustomer.mutate(
      {
        id: customer.id,
        updates: {
          first_name: firstName || null,
          last_name: lastName || null,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateCustomer.isPending}>
            {updateCustomer.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
