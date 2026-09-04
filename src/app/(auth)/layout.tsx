import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-gray-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">DocuFlow</span>
          </Link>
        </div>
        <div className="space-y-6">
          <blockquote className="text-lg text-white/80">
            &ldquo;DocuFlow has completely transformed how our team collaborates on documents. The AI features alone have saved us hours every week.&rdquo;
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500" />
            <div>
              <div className="font-medium text-white">Alex Morgan</div>
              <div className="text-sm text-white/60">Head of Product, Acme Corp</div>
            </div>
          </div>
        </div>
        <div className="text-sm text-white/40">
          &copy; 2026 DocuFlow. All rights reserved.
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
