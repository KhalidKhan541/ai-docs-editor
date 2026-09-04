"use client";

import { useState } from "react";
import {
  User, Bell, Palette, Globe, Shield, CreditCard, Key, Mail,
  Monitor, Moon, Sun, Check, Save, Trash2, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "language", label: "Language & Region", icon: Globe },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        </div>
        <Button size="sm" className="gap-2 bg-gray-900 text-white hover:bg-gray-800" onClick={handleSave}>
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved!" : "Save changes"}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-56 shrink-0 border-r border-gray-200 p-4">
          <div className="space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeSection === section.id
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <section.icon className="h-4 w-4 shrink-0" />
                {section.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            {activeSection === "profile" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Manage your personal information and preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src="" alt="User" />
                        <AvatarFallback className="text-xl bg-violet-100 text-violet-700">JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" size="sm">Change avatar</Button>
                        <p className="mt-1 text-xs text-gray-500">JPG, GIF or PNG. Max 2MB.</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input id="role" defaultValue="Product Manager" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input id="timezone" defaultValue="UTC-8 (Pacific Time)" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Manage your account settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                      <div>
                        <p className="text-sm font-medium">Export data</p>
                        <p className="text-xs text-gray-500">Download a copy of all your data.</p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Export
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
                      <div>
                        <p className="text-sm font-medium text-red-800">Delete account</p>
                        <p className="text-xs text-red-600">Permanently delete your account and all data.</p>
                      </div>
                      <Button variant="destructive" size="sm" className="gap-1.5">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeSection === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Choose what notifications you receive.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Document comments", description: "When someone comments on your document", checked: true },
                    { label: "Mentions", description: "When someone mentions you in a document", checked: true },
                    { label: "Document shares", description: "When someone shares a document with you", checked: true },
                    { label: "Weekly digest", description: "Summary of your document activity", checked: false },
                    { label: "Product updates", description: "New features and improvements", checked: false },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                      <button
                        className={cn(
                          "relative h-5 w-9 rounded-full transition-colors",
                          item.checked ? "bg-violet-600" : "bg-gray-300"
                        )}
                      >
                        <span className={cn(
                          "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                          item.checked ? "translate-x-4" : ""
                        )} />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeSection === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the look and feel of DocuFlow.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "light", label: "Light", icon: Sun },
                        { id: "dark", label: "Dark", icon: Moon },
                        { id: "system", label: "System", icon: Monitor },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id as typeof theme)}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                            theme === t.id ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <t.icon className="h-6 w-6" />
                          <span className="text-sm font-medium">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label>Editor font size</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">Small</span>
                      <input type="range" min="12" max="20" defaultValue="14" className="flex-1" />
                      <span className="text-xs text-gray-500">Large</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Editor line height</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">Compact</span>
                      <input type="range" min="1.2" max="2" step="0.1" defaultValue="1.6" className="flex-1" />
                      <span className="text-xs text-gray-500">Relaxed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "language" && (
              <Card>
                <CardHeader>
                  <CardTitle>Language & Region</CardTitle>
                  <CardDescription>Set your language and regional preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Input defaultValue="English (US)" />
                    </div>
                    <div className="space-y-2">
                      <Label>Date format</Label>
                      <Input defaultValue="MM/DD/YYYY" />
                    </div>
                    <div className="space-y-2">
                      <Label>Time format</Label>
                      <Input defaultValue="12-hour" />
                    </div>
                    <div className="space-y-2">
                      <Label>First day of week</Label>
                      <Input defaultValue="Sunday" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage your security settings and sessions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium">Change password</p>
                      <p className="text-xs text-gray-500">Last changed 3 months ago</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Key className="h-3.5 w-3.5" /> Update
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium">Two-factor authentication</p>
                      <p className="text-xs text-gray-500">Add an extra layer of security to your account.</p>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium">Active sessions</p>
                      <p className="text-xs text-gray-500">You are signed in on 2 devices.</p>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "billing" && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing</CardTitle>
                  <CardDescription>Manage your subscription and payment methods.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">Pro Plan</p>
                          <Badge className="bg-violet-600 text-white text-xs">Current</Badge>
                        </div>
                        <p className="mt-1 text-xs text-gray-600">$12/month · Renews on Jan 15, 2026</p>
                      </div>
                      <Button variant="outline" size="sm">Manage subscription</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium">Payment method</p>
                      <p className="text-xs text-gray-500">Visa ending in 4242</p>
                    </div>
                    <Button variant="outline" size="sm">Update</Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium">Billing history</p>
                      <p className="text-xs text-gray-500">View past invoices and receipts.</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Download className="h-3.5 w-3.5" /> View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
