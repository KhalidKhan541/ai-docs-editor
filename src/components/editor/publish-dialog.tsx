"use client";

import { useState } from "react";
import { Globe, Link2, Copy, Check, Lock, Eye, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface PublishDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function PublishDialog({ open, onOpenChange }: PublishDialogProps) {
  const [isPublished, setIsPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishUrl] = useState("https://docs.docuflow.app/p/prd-q1-2026");

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publishUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> Publish to Web
          </DialogTitle>
          <DialogDescription>
            Make this document publicly accessible via a shareable link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isPublished ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-mono text-green-700">{publishUrl}</span>
                <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={handleCopyUrl}>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
              <Globe className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">This document is not published yet.</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Allow comments</p>
                  <p className="text-xs text-gray-500">Visitors can leave comments</p>
                </div>
              </div>
              <button className="relative h-5 w-9 rounded-full bg-violet-600 transition-colors">
                <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white translate-x-4" />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Password protection</p>
                  <p className="text-xs text-gray-500">Require a password to view</p>
                </div>
              </div>
              <button className="relative h-5 w-9 rounded-full bg-gray-300 transition-colors">
                <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white" />
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
          {isPublished ? (
            <Button className="bg-gray-900 text-white hover:bg-gray-800">Update</Button>
          ) : (
            <Button className="bg-gray-900 text-white hover:bg-gray-800" onClick={() => setIsPublished(true)}>
              Publish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
