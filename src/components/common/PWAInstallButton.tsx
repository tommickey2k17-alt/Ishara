/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface Props {
  className?: string;
  variant?: 'button' | 'compact' | 'card';
}

export const PWAInstallButton: React.FC<Props> = ({ className = '', variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 3000);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'card') {
      return (
        <div className={`p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Install Ishara App
              </h4>
              <p className="text-xs text-slate-600">
                Install as a standalone app for fast, offline symptom & sleep tracking.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            {installSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Installed</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Install PWA</span>
              </>
            )}
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer ${className}`}
        title="Install Ishara as a standalone app"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        {variant === 'card' ? (
          <div className={`p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Share className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Install on iPhone / iPad
                </h4>
                <p className="text-xs text-slate-600">
                  Add to home screen for fullscreen standalone access.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
            >
              <span>Install Instructions</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50/80 hover:bg-teal-100 text-teal-900 text-xs font-semibold transition-all cursor-pointer ${className}`}
            title="Install on iOS Safari"
          >
            <Download className="w-3.5 h-3.5 text-teal-700" />
            <span>Install on iOS</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900">Tap the Share icon</p>
                    <p className="text-[11px] text-slate-500">
                      Located in the bottom Safari toolbar (<Share className="w-3.5 h-3.5 inline mx-0.5" />).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900">Select "Add to Home Screen"</p>
                    <p className="text-[11px] text-slate-500">
                      Scroll down the share sheet and tap <PlusSquare className="w-3.5 h-3.5 inline mx-0.5" /> Add to Home Screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900">Tap "Add" in upper right</p>
                    <p className="text-[11px] text-slate-500">
                      Ishara will launch as a standalone app with offline support.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Instructions
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
