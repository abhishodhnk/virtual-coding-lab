"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, LogOut, Code, ExternalLink } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface LabSession {
  id: number;
  sessionCode: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function StudentDashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [labs, setLabs] = useState<LabSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [error, setError] = useState("");
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        if (data.role !== "student") {
          router.push("/teacher/dashboard");
          return;
        }
        fetchLabs(data.id);
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  const fetchLabs = async (userId: string) => {
    try {
      const response = await fetch(`/api/labs?userId=${userId}&role=student`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLabs(data);
      }
    } catch (err) {
      console.error("Failed to fetch labs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsJoining(true);

    try {
      const response = await fetch("/api/labs/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
        body: JSON.stringify({
          userId: userData.id,
          role: "student",
          sessionCode: sessionCode.toUpperCase(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLabs([data.labSession, ...labs]);
        setDialogOpen(false);
        setSessionCode("");
        router.push(`/student/lab/${data.labSession.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to join lab");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsJoining(false);
    }
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");
    await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    localStorage.removeItem("bearer_token");
    router.push("/");
  };

  if (isPending || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session?.user || !userData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {userData.fullName}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Joined Labs</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{labs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <LogIn className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="sm">
                    <LogIn className="mr-2 h-4 w-4" />
                    Join New Lab
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleJoinLab}>
                    <DialogHeader>
                      <DialogTitle>Join Lab Session</DialogTitle>
                      <DialogDescription>
                        Enter the 6-character code provided by your teacher
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="sessionCode">Session Code</Label>
                        <Input
                          id="sessionCode"
                          placeholder="ABC123"
                          value={sessionCode}
                          onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                          required
                          maxLength={6}
                          disabled={isJoining}
                          className="font-mono text-lg tracking-wider"
                        />
                      </div>
                      {error && (
                        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                          {error}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isJoining}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isJoining}>
                        {isJoining ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          "Join Lab"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Labs List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Lab Sessions</CardTitle>
            <CardDescription>
              Access your joined lab sessions and start coding
            </CardDescription>
          </CardHeader>
          <CardContent>
            {labs.length === 0 ? (
              <div className="text-center py-12">
                <Code className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No labs joined yet</h3>
                <p className="text-muted-foreground mb-4">
                  Ask your teacher for a session code to join your first lab
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Join Lab
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {labs.map((lab) => (
                  <Card key={lab.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-xl">{lab.title}</CardTitle>
                          {lab.description && (
                            <CardDescription>{lab.description}</CardDescription>
                          )}
                          <div className="text-sm text-muted-foreground pt-2">
                            Joined on {new Date(lab.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/student/lab/${lab.id}`)}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Lab
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
