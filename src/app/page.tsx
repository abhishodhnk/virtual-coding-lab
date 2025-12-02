"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Users, MessageSquare, Zap, CheckCircle, Globe } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Virtual Coding Lab
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            An interactive platform for students and teachers to collaborate on coding exercises
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Instant Lab Creation</CardTitle>
              <CardDescription>
                Teachers can create coding lab sessions in seconds with unique join codes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Code2 className="h-10 w-10 text-indigo-600 mb-2" />
              <CardTitle>20+ Programming Languages</CardTitle>
              <CardDescription>
                Support for Python, JavaScript, Java, C++, and many more via Judge0 API
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Real-time Collaboration</CardTitle>
              <CardDescription>
                Live code previews, announcements, and one-on-one chat between teachers and students
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-pink-600 mb-2" />
              <CardTitle>Interactive Communication</CardTitle>
              <CardDescription>
                Announcement channels and private messaging for personalized guidance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Custom Input Testing</CardTitle>
              <CardDescription>
                Test code with custom inputs and see real-time compilation results
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Multiple File Support</CardTitle>
              <CardDescription>
                Manage multiple code files within a single lab session workspace
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-2xl">For Teachers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 mt-1">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">1</span>
                  </div>
                  <p className="text-muted-foreground">Create a new lab session with a title and description</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 mt-1">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">2</span>
                  </div>
                  <p className="text-muted-foreground">Share the unique 6-character code with students</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 mt-1">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">3</span>
                  </div>
                  <p className="text-muted-foreground">Monitor student code in real-time and provide feedback</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 mt-1">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">4</span>
                  </div>
                  <p className="text-muted-foreground">Send announcements and chat privately with students</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <CardTitle className="text-2xl">For Students</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2 mt-1">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">1</span>
                  </div>
                  <p className="text-muted-foreground">Join a lab session using the code from your teacher</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2 mt-1">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">2</span>
                  </div>
                  <p className="text-muted-foreground">Write and test code in 20+ programming languages</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2 mt-1">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">3</span>
                  </div>
                  <p className="text-muted-foreground">Compile and run code with custom input directly in the browser</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2 mt-1">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">4</span>
                  </div>
                  <p className="text-muted-foreground">Get instant help from your teacher via private chat</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center max-w-2xl mx-auto">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 border-0">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Ready to Get Started?</CardTitle>
              <CardDescription className="text-blue-100 text-lg">
                Join thousands of students and teachers already using Virtual Coding Lab
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link href="/signup">Sign Up as Teacher</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50">
                <Link href="/signup">Sign Up as Student</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}