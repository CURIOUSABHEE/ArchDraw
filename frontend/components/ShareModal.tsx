'use client';

import { useState, useEffect, useRef } from 'react';
import { Copy, Check, Link2, Clock, Code, Monitor, Moon, Sun, GitBranch, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
  shareUrl: string;
  embedUrl: string;
  canvasName: string;
  onClose: () => void;
}

export function ShareModal({ shareUrl, embedUrl, canvasName, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [zoom, setZoom] = useState('1');
  const [height, setHeight] = useState('500');
  const [pathType, setPathType] = useState<'smooth' | 'step' | 'straight' | 'bezier'>('smooth');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const handleCopy = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const embedLinkUrl = () => {
    const params = new URLSearchParams();
    params.set('theme', theme);
    params.set('zoom', zoom);
    params.set('path', pathType);
    return `${embedUrl}?${params.toString()}`;
  };

  const generateIframeCode = () => {
    return `<iframe
  src="${embedLinkUrl()}"
  width="100%"
  height="${height}"
  style="border: none; border-radius: 12px;"
  title="${canvasName}"
></iframe>`;
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base">Share Diagram</DialogTitle>
              <DialogDescription className="text-xs truncate">
                {canvasName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 shrink-0 mx-6 mt-4">
            <TabsTrigger value="link" className="flex items-center gap-2 text-xs">
              <Link2 className="w-3.5 h-3.5" />
              Link
            </TabsTrigger>
            <TabsTrigger value="notion" className="flex items-center gap-2 text-xs">
              <Globe className="w-3.5 h-3.5" />
              Notion
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex items-center gap-2 text-xs">
              <Code className="w-3.5 h-3.5" />
              HTML
            </TabsTrigger>
          </TabsList>

          {/* Link Tab */}
          <TabsContent value="link" className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 mt-4 space-y-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Input
                    ref={inputRef}
                    readOnly
                    value={shareUrl}
                    className="pr-20 font-mono text-sm h-11 bg-muted/50 truncate"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] h-5 px-1.5 shrink-0"
                  >
                    <Clock className="w-2.5 h-2.5 mr-1" />
                    30 days
                  </Badge>
                </div>
              </div>

              <Button 
                onClick={() => handleCopy(shareUrl, setCopied)} 
                className="w-full h-11 text-sm font-medium"
                variant={copied ? 'secondary' : 'default'}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Anyone with this link can view this diagram.
              </p>
            </div>
          </TabsContent>

          {/* Notion Tab - Simple URL for Notion embedding */}
          <TabsContent value="notion" className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 mt-4 space-y-4">
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Paste this link in Notion</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Notion will automatically embed your diagram when you paste this link.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Embed Link</label>
                <Input
                  readOnly
                  value={embedLinkUrl()}
                  className="pr-16 font-mono text-sm h-11 bg-muted/50"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>

              <Button 
                onClick={() => handleCopy(embedLinkUrl(), setLinkCopied)} 
                className="w-full h-11 text-sm font-medium"
                variant={linkCopied ? 'secondary' : 'default'}
              >
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Embed Link
                  </>
                )}
              </Button>

              {/* Quick options */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-medium text-muted-foreground">Theme</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      theme === 'dark' 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border bg-card hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    <Moon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      theme === 'light' 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border bg-card hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    <Sun className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Works with Notion, Confluence, Miro, and any platform that supports URL embeds.
              </p>
            </div>
          </TabsContent>

          {/* HTML Embed Tab */}
          <TabsContent value="embed" className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 mt-4 space-y-4">
            <div className="space-y-4">
              {/* Options row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Height</label>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="h-9 text-sm"
                    min="200"
                    max="1200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Zoom</label>
                  <Input
                    type="number"
                    value={zoom}
                    onChange={(e) => setZoom(e.target.value)}
                    className="h-9 text-sm"
                    step="0.1"
                    min="0.1"
                    max="2"
                  />
                </div>
              </div>

              {/* Theme & Edge Style */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Theme</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex-1 flex items-center justify-center p-1.5 rounded border transition-colors ${
                        theme === 'dark' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border bg-card hover:bg-accent'
                      }`}
                    >
                      <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex-1 flex items-center justify-center p-1.5 rounded border transition-colors ${
                        theme === 'light' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border bg-card hover:bg-accent'
                      }`}
                    >
                      <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Edge</label>
                  <div className="flex gap-1">
                    {['smooth', 'step', 'straight'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPathType(type as typeof pathType)}
                        className={`flex-1 p-1.5 rounded border transition-colors ${
                          pathType === type 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border bg-card hover:bg-accent'
                        }`}
                      >
                        <svg width="24" height="12" viewBox="0 0 24 12" className="mx-auto">
                          <path
                            d={type === 'step' 
                              ? 'M 2 6 L 8 6 L 8 2 L 22 2' 
                              : type === 'straight' 
                              ? 'M 2 6 L 22 6'
                              : 'M 2 6 C 8 2, 16 10, 22 6'
                            }
                            fill="none"
                            stroke={pathType === type ? '#6366f1' : '#64748b'}
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Preview</label>
                <div 
                  className="w-full rounded-lg overflow-hidden border border-border bg-muted/30"
                  style={{ height: Math.min(Math.max(parseInt(height) || 300, 150), 200) }}
                >
                  <iframe
                    src={embedLinkUrl()}
                    className="w-full h-full"
                    title="Embed preview"
                  />
                </div>
              </div>

              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">HTML Code</label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={generateIframeCode()}
                    className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-muted/50 font-mono text-[11px] resize-none"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                </div>
              </div>

              <Button 
                onClick={() => handleCopy(generateIframeCode(), setEmbedCopied)} 
                className="w-full h-10 text-sm font-medium"
                variant={embedCopied ? 'secondary' : 'default'}
              >
                {embedCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy HTML Code
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
