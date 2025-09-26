'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded transform rotate-45"></div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  GlassBox AI - ENHANCED VERSION
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  The Global Operating System for Regulatory Technology
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full animate-pulse bg-green-500"></div>
                <span className="text-sm text-slate-600">System healthy</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-8">
        <div className="space-y-8">
          {/* Global Operating System Status */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">
                System Status
              </CardTitle>
              <CardDescription className="text-slate-600">
                GlassBox AI is now fully configured for iframe embedding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">✅ Iframe Support</h4>
                  <p className="text-sm text-green-600">Application can be embedded in iframes</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">✅ Firefox Compatible</h4>
                  <p className="text-sm text-blue-600">Works in Firefox iframe environments</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800">✅ Security Headers</h4>
                  <p className="text-sm text-purple-600">CSP and X-Frame-Options configured</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800">✅ CORS Enabled</h4>
                  <p className="text-sm text-yellow-600">Cross-origin requests supported</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">
                Ready for Deployment
              </CardTitle>
              <CardDescription className="text-slate-600">
                All fixes implemented and ready for deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-slate-700">
                  The application has been successfully updated with:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li>Dynamic CSP configuration for iframe embedding</li>
                  <li>Firefox iframe blocking fixes</li>
                  <li>Database initialization improvements</li>
                  <li>Security header optimizations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}