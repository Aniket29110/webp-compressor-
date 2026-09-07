'use client';

import React from 'react';
import { Layers, ShieldCheck, Zap } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Badge } from './ui/badge';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-primary to-purple-600 flex items-center justify-center text-white shadow-md shadow-primary/20">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-foreground">
                Media & Doc Compressor
              </span>
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] py-0 px-2 border-primary/30 text-primary font-medium">
                Client-Side Suite
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              Fast, private Image, Video, Document & Audio compression
            </span>
          </div>
        </div>

        {/* Feature Highlights & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center gap-4 text-xs font-medium text-muted-foreground border-r border-border/80 pr-4">
            <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              100% Private (No Uploads)
            </span>
            <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Instant Canvas Processing
            </span>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
