"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Globe, Link2, Copy, Eye, EyeOff, Lock,
  ExternalLink, Check, Settings, Users, Calendar
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function PublishPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const [isPublished, setIsPublished] = useState(false);
  const [publishUrl, setPublishUrl] = useState("https://docs.docuflow.app/p/prd-q1-2026");
  const [copied, setCopied] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [allowEditing, setAllowEditing] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [unpublishDate, setUnpublishDate] = useState("");

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publishUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublish = () => {
    setIsPublished(true);
    setPublishUrl(`https://docs.docuflow.app/p/prd-q1-2026-${Date.now()}`);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center gap-3">
          <Link href={`/documents/${docId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Publish Settings</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPublished ? "default" : "secondary"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Publish to Web
              </CardTitle>
              <CardDescription>
                Make this document publicly accessible via a shareable link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPublished ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-green-200 bg-green-50 p-3">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-mono text-green-700">{publishUrl}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsPublished(false)}>
                      Unpublish
                    </Button>
                    <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                      Update
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={handlePublish} className="bg-gray-900 text-white hover:bg-gray-800">
                  <Globe className="mr-2 h-4 w-4" /> Publish document
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Access Controls
              </CardTitle>
              <CardDescription>Configure who can access the published document.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Anyone with the link</Label>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Allow comments</p>
                      <p className="text-xs text-gray-500">Visitors can leave comments on the document</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAllowComments(!allowComments)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${allowComments ? "bg-violet-600" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${allowComments ? "translate-x-4" : ""}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Allow editing</p>
                      <p className="text-xs text-gray-500">Anyone can edit the published version</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAllowEditing(!allowEditing)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${allowEditing ? "bg-violet-600" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${allowEditing ? "translate-x-4" : ""}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Password protection</p>
                      <p className="text-xs text-gray-500">Require a password to view the document</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRequiresPassword(!requiresPassword)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${requiresPassword ? "bg-violet-600" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${requiresPassword ? "translate-x-4" : ""}`} />
                  </button>
                </div>
                {requiresPassword && (
                  <div className="ml-7">
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Schedule
              </CardTitle>
              <CardDescription>Automatically publish or unpublish on a schedule.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="publish-date">Publish on</Label>
                  <Input
                    id="publish-date"
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unpublish-date">Unpublish on</Label>
                  <Input
                    id="unpublish-date"
                    type="datetime-local"
                    value={unpublishDate}
                    onChange={(e) => setUnpublishDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" /> SEO Settings
              </CardTitle>
              <CardDescription>Customize how the document appears in search results.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta-title">Page title</Label>
                <Input id="meta-title" defaultValue="Product Requirements v2 - DocuFlow" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta-description">Meta description</Label>
                <Input id="meta-description" defaultValue="Core requirements for the Q1 product launch" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="og-image">Social preview image</Label>
                <div className="flex items-center gap-3">
                  <div className="h-20 w-40 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                    Upload image
                  </div>
                  <Button variant="outline" size="sm">Choose image</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
