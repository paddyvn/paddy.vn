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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateCustomer, Customer } from "@/hooks/useCustomers";
import { 
  useCustomerAddresses, 
  useAddCustomerAddress, 
  useUpdateCustomerAddress,
  useDeleteCustomerAddress,
  CustomerAddress 
} from "@/hooks/useCustomerAddresses";
import { AlertTriangle, Pencil, MoreHorizontal, Search, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export const EditCustomerDialog = ({
  open,
  onOpenChange,
  customer,
}: EditCustomerDialogProps) => {
  const [firstName, setFirstName] = useState(customer.first_name || "");
  const [lastName, setLastName] = useState(customer.last_name || "");
  const [email, setEmail] = useState(customer.email || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const updateCustomer = useUpdateCustomer();

  useEffect(() => {
    if (open) {
      setFirstName(customer.first_name || "");
      setLastName(customer.last_name || "");
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
    }
  }, [open, customer]);

  const handleSave = () => {
    updateCustomer.mutate(
      {
        id: customer.id,
        updates: {
          first_name: firstName || null,
          last_name: lastName || null,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select defaultValue="vi">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">Vietnamese [Default]</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This customer will receive notifications in this language.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=""
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 border rounded-md px-3 bg-muted/30">
                <span className="text-lg">🇻🇳</span>
              </div>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+84 xxx xxx xxx"
                className="flex-1"
              />
            </div>
          </div>

          {phone && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Changing the phone number for this customer will unsubscribe them from SMS
                marketing text messages until they provide consent.
              </AlertDescription>
            </Alert>
          )}
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

interface ManageAddressesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export const ManageAddressesDialog = ({
  open,
  onOpenChange,
  customer,
}: ManageAddressesDialogProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const { data: addresses = [], isLoading } = useCustomerAddresses(customer.id);
  const deleteAddress = useDeleteCustomerAddress();

  const handleClose = () => {
    setShowAddForm(false);
    setEditingAddress(null);
    onOpenChange(false);
  };

  if (showAddForm || editingAddress) {
    return (
      <AddEditAddressDialog
        open={open}
        onOpenChange={handleClose}
        customerId={customer.id}
        address={editingAddress}
        onBack={() => {
          setShowAddForm(false);
          setEditingAddress(null);
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage addresses</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : addresses.length > 0 ? (
            addresses.map((address) => (
              <div key={address.id} className="border rounded-lg p-4 space-y-1">
                {address.is_default && (
                  <Badge className="mb-2 bg-yellow-400 text-yellow-900 hover:bg-yellow-400">Default</Badge>
                )}
                <div className="flex justify-between">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">
                      {[address.first_name, address.last_name].filter(Boolean).join(" ") || "No name"}
                    </p>
                    <p>{address.address1}</p>
                    {address.address2 && <p>{address.address2}</p>}
                    <p>{address.city}</p>
                    <p>{address.country}</p>
                    {address.phone && <p>{address.phone}</p>}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setEditingAddress(address)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground text-center">
                No addresses on file
              </p>
            </div>
          )}

          <div className="border rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm">Vietnam</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Set as default country</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddForm(true)}>
            Add new address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface AddEditAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  address?: CustomerAddress | null;
  onBack: () => void;
}

const AddEditAddressDialog = ({
  open,
  onOpenChange,
  customerId,
  address,
  onBack,
}: AddEditAddressDialogProps) => {
  const [country, setCountry] = useState(address?.country || "Vietnam");
  const [firstName, setFirstName] = useState(address?.first_name || "");
  const [lastName, setLastName] = useState(address?.last_name || "");
  const [company, setCompany] = useState(address?.company || "");
  const [address1, setAddress1] = useState(address?.address1 || "");
  const [address2, setAddress2] = useState(address?.address2 || "");
  const [city, setCity] = useState(address?.city || "");
  const [postalCode, setPostalCode] = useState(address?.postal_code || "");
  const [phone, setPhone] = useState(address?.phone || "");
  const [isDefault, setIsDefault] = useState(address?.is_default || false);

  const addAddress = useAddCustomerAddress();
  const updateAddress = useUpdateCustomerAddress();
  const deleteAddress = useDeleteCustomerAddress();

  const isEditing = !!address;

  const handleSave = () => {
    const addressData = {
      customer_id: customerId,
      country,
      country_code: "VN",
      first_name: firstName || null,
      last_name: lastName || null,
      company: company || null,
      address1,
      address2: address2 || null,
      city,
      province: null,
      postal_code: postalCode || null,
      phone: phone || null,
      is_default: isDefault,
    };

    if (isEditing && address) {
      updateAddress.mutate(
        { id: address.id, customerId, updates: addressData },
        { onSuccess: () => onBack() }
      );
    } else {
      addAddress.mutate(addressData, { onSuccess: () => onBack() });
    }
  };

  const handleDelete = () => {
    if (address) {
      deleteAddress.mutate(
        { id: address.id, customerId },
        { onSuccess: () => onBack() }
      );
    }
  };

  const isPending = addAddress.isPending || updateAddress.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit address" : "Add new address"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Country/region</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vietnam">Vietnam</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Japan">Japan</SelectItem>
                <SelectItem value="South Korea">South Korea</SelectItem>
                <SelectItem value="Thailand">Thailand</SelectItem>
                <SelectItem value="Singapore">Singapore</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder=""
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Company</Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder=""
            />
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                placeholder=""
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Apartment, suite, etc</Label>
            <Input
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder=""
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label>Postal code</Label>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder=""
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 border rounded-md px-3 bg-muted/30">
                <span className="text-lg">🇻🇳</span>
              </div>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder=""
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is-default"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked as boolean)}
            />
            <Label htmlFor="is-default">Set as default address</Label>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {isEditing && (
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteAddress.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isPending || !address1 || !city}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
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
  const [acceptsEmailMarketing, setAcceptsEmailMarketing] = useState(customer.accepts_marketing);
  const [acceptsSmsMarketing, setAcceptsSmsMarketing] = useState(false);
  const updateCustomer = useUpdateCustomer();

  useEffect(() => {
    if (open) {
      setAcceptsEmailMarketing(customer.accepts_marketing);
      setAcceptsSmsMarketing(false);
    }
  }, [open, customer]);

  const handleSave = () => {
    updateCustomer.mutate(
      {
        id: customer.id,
        updates: {
          accepts_marketing: acceptsEmailMarketing,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit marketing status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="email-marketing"
              checked={acceptsEmailMarketing}
              onCheckedChange={(checked) => setAcceptsEmailMarketing(checked as boolean)}
              className="mt-0.5"
            />
            <Label 
              htmlFor="email-marketing" 
              className={`text-sm ${!acceptsEmailMarketing ? 'text-muted-foreground' : ''}`}
            >
              Customer agreed to receive marketing emails.
            </Label>
          </div>
          
          <div className="flex items-start gap-3">
            <Checkbox
              id="sms-marketing"
              checked={acceptsSmsMarketing}
              onCheckedChange={(checked) => setAcceptsSmsMarketing(checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="sms-marketing" className="text-sm">
              Customer agreed to receive SMS marketing text messages.
            </Label>
          </div>

          <p className="text-sm text-muted-foreground pt-2">
            You should ask your customers for permission before you subscribe them to your marketing
            emails or SMS.
          </p>
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

interface EditTaxDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export const EditTaxDetailsDialog = ({
  open,
  onOpenChange,
  customer,
}: EditTaxDetailsDialogProps) => {
  const [taxSetting, setTaxSetting] = useState("collect");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit tax details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tax settings</Label>
            <Select value={taxSetting} onValueChange={setTaxSetting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collect">Collect tax</SelectItem>
                <SelectItem value="exempt">Tax exempt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Save
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

// Keep this for backward compatibility
export const EditContactInfoDialog = EditCustomerDialog;
export const EditCustomerNameDialog = EditCustomerDialog;
