"use client";

import { useState } from "react";
import { Link2, Copy, Check, Mail, Globe, Lock, UserPlus, Shield, X } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface ShareDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: "editor" | "viewer";
  avatar?: string;
}

const mockCollaborators: Collaborator[] = [
  { id: "1", name: "Jane Smith", email: "jane@example.com", role: "editor" },
  { id: "2", name: "Alex Chen", email: "alex@example.com", role: "viewer" },
];

export default function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkAccess, setLinkAccess] = useState<"restricted" | "anyone">("restricted");
  const [collaborators, setCollaborators] = useState(mockCollaborators);

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://docs.docuflow.app/d/prd-q1-2026");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = () => {
    if (email.trim()) {
      setCollaborators((prev) => [
        ...prev,
        { id: Date.now().toString(), name: email.split("@")[0], email, role: "editor" },
      ]);
      setEmail("");
    }
  };

  const handleRemoveCollaborator = (id: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Share document
          </DialogTitle>
          <DialogDescription>
            Invite people to collaborate on this document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter email addresses"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
              className="flex-1"
            />
            <Button onClick={handleInvite} disabled={!email.trim()}>
              Invite
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy link"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {linkAccess === "restricted" ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  {linkAccess === "restricted" ? "Restricted" : "Anyone with link"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setLinkAccess("restricted")}>
                  <Lock className="mr-2 h-4 w-4" /> Restricted
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLinkAccess("anyone")}>
                  <Globe className="mr-2 h-4 w-4" /> Anyone with link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">People with access</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">John Doe</span>
                      <Badge variant="secondary" className="text-[9px]">You</Badge>
                    </div>
                    <span className="text-xs text-gray-500">john@example.com</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">Owner</Badge>
              </div>

              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                        {getInitials(collaborator.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium">{collaborator.name}</span>
                      <div className="text-xs text-gray-500">{collaborator.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                          <Shield className="h-3 w-3" /> {collaborator.role}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Editor</DropdownMenuItem>
                        <DropdownMenuItem>Viewer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
