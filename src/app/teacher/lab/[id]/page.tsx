"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Users, Megaphone, Code, ArrowLeft, MessageSquare } from "lucide-react";
import Editor from "@monaco-editor/react";

interface Student {
  studentId: string;
  studentName: string;
  studentEmail: string;
}

interface Announcement {
  id: number;
  message: string;
  creatorName: string;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

interface CodeFile {
  id: number;
  studentId: string;
  studentName: string;
  fileName: string;
  language: string;
  code: string;
  lastUpdated: string;
}

export default function TeacherLabPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const labId = params.id as string;

  const [lab, setLab] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedCode, setSelectedCode] = useState<CodeFile | null>(null);
  
  const [announcementText, setAnnouncementText] = useState("");
  const [chatText, setChatText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  useEffect(() => {
    if (userData) {
      loadLabData();
      // Poll for updates every 3 seconds
      const interval = setInterval(loadLabData, 3000);
      return () => clearInterval(interval);
    }
  }, [userData, labId]);

  useEffect(() => {
    if (selectedStudent && userData) {
      loadChatMessages(selectedStudent.studentId);
    }
  }, [selectedStudent, userData]);

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
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  const loadLabData = async () => {
    try {
      const [labRes, studentsRes, announcementsRes, codeRes] = await Promise.all([
        fetch(`/api/labs/${labId}?userId=${userData.id}&role=teacher`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
        }),
        fetch(`/api/labs/${labId}/participants?userId=${userData.id}&role=teacher`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
        }),
        fetch(`/api/labs/${labId}/announcements?userId=${userData.id}&role=teacher`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
        }),
        fetch(`/api/labs/${labId}/all-code?userId=${userData.id}&role=teacher`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
        }),
      ]);

      if (labRes.ok) setLab(await labRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
      if (codeRes.ok) {
        const codes = await codeRes.json();
        setCodeFiles(codes);
        if (codes.length > 0 && !selectedCode) {
          setSelectedCode(codes[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load lab data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatMessages = async (studentId: string) => {
    try {
      const response = await fetch(
        `/api/labs/${labId}/chat?userId=${userData.id}&role=teacher&receiverId=${studentId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
        }
      );
      if (response.ok) {
        setChatMessages(await response.json());
      }
    } catch (err) {
      console.error("Failed to load chat messages:", err);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setIsSendingAnnouncement(true);

    try {
      const response = await fetch(`/api/labs/${labId}/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
        body: JSON.stringify({
          userId: userData.id,
          role: "teacher",
          message: announcementText,
        }),
      });

      if (response.ok) {
        const newAnnouncement = await response.json();
        setAnnouncements([newAnnouncement, ...announcements]);
        setAnnouncementText("");
      }
    } catch (err) {
      console.error("Failed to send announcement:", err);
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatText.trim() || !selectedStudent) return;
    setIsSendingChat(true);

    try {
      const response = await fetch(`/api/labs/${labId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
        body: JSON.stringify({
          userId: userData.id,
          role: "teacher",
          receiverId: selectedStudent.studentId,
          message: chatText,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setChatMessages([...chatMessages, newMessage]);
        setChatText("");
      }
    } catch (err) {
      console.error("Failed to send chat:", err);
    } finally {
      setIsSendingChat(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!lab) return <div>Lab not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.push("/teacher/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{lab.title}</h1>
            <p className="text-sm text-muted-foreground">
              Session Code: <span className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{lab.sessionCode}</span>
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <Users className="inline h-4 w-4 mr-1" />
            {students.length} Students
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column - Announcements & Students */}
          <div className="space-y-4">
            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type announcement..."
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    rows={2}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendAnnouncement}
                    disabled={isSendingAnnouncement || !announcementText.trim()}
                  >
                    {isSendingAnnouncement ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">{ann.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(ann.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Students List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Students ({students.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {students.map((student) => (
                      <div
                        key={student.studentId}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedStudent?.studentId === student.studentId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <p className="font-medium text-sm">{student.studentName}</p>
                        <p className="text-xs opacity-80">{student.studentEmail}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Code Viewer */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Student Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="code">
                <TabsList className="mb-4">
                  <TabsTrigger value="code">Code Files</TabsTrigger>
                  <TabsTrigger value="chat">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Student Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="space-y-4">
                  {/* File List */}
                  <ScrollArea className="h-[100px]">
                    <div className="flex gap-2 flex-wrap">
                      {codeFiles.map((file) => (
                        <Button
                          key={file.id}
                          variant={selectedCode?.id === file.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCode(file)}
                        >
                          {file.studentName} - {file.fileName}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Code Editor */}
                  {selectedCode ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{selectedCode.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            By {selectedCode.studentName} • {selectedCode.language}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(selectedCode.lastUpdated).toLocaleString()}
                        </p>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <Editor
                          height="500px"
                          language={selectedCode.language.toLowerCase()}
                          value={selectedCode.code}
                          theme="vs-dark"
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 14,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No code submissions yet
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="chat">
                  {selectedStudent ? (
                    <div className="space-y-4">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="font-semibold">{selectedStudent.studentName}</p>
                        <p className="text-sm text-muted-foreground">{selectedStudent.studentEmail}</p>
                      </div>

                      <ScrollArea className="h-[400px] border rounded-lg p-4">
                        <div className="space-y-3">
                          {chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${
                                msg.senderId === userData.id ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  msg.senderId === userData.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="text-sm">{msg.message}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(msg.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={chatText}
                          onChange={(e) => setChatText(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendChat()}
                        />
                        <Button
                          onClick={handleSendChat}
                          disabled={isSendingChat || !chatText.trim()}
                        >
                          {isSendingChat ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Select a student to start chatting
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
