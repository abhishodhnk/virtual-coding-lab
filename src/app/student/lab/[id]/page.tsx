"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Play, Plus, X, ArrowLeft, MessageSquare, Megaphone, Save, FileCode } from "lucide-react";
import Editor from "@monaco-editor/react";
import { languages, getLanguageById } from "@/lib/languages";

interface CodeFile {
  fileName: string;
  language: string;
  languageId: number;
  code: string;
  lastUpdated?: string;
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

export default function StudentLabPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const labId = params.id as string;

  const [lab, setLab] = useState<any>(null);
  const [files, setFiles] = useState<CodeFile[]>([
    {
      fileName: "main.py",
      language: "python",
      languageId: 71,
      code: "# Write your code here\nprint('Hello, World!')",
    },
  ]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  useEffect(() => {
    if (userData) {
      loadLabData();
      loadExistingCode();
      // Poll for updates every 3 seconds
      const interval = setInterval(() => {
        loadAnnouncements();
        loadChatMessages();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [userData, labId]);

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
      const response = await fetch(`/api/labs/${labId}?userId=${userData.id}&role=student`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
      });
      if (response.ok) {
        setLab(await response.json());
      }
    } catch (err) {
      console.error("Failed to load lab:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingCode = async () => {
    try {
      const response = await fetch(`/api/labs/${labId}/code?userId=${userData.id}&role=student`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
      });
      if (response.ok) {
        const existingFiles = await response.json();
        if (existingFiles.length > 0) {
          const loadedFiles = existingFiles.map((file: any) => ({
            fileName: file.fileName,
            language: file.language,
            languageId: languages.find(l => l.monacoId === file.language)?.id || 71,
            code: file.code,
            lastUpdated: file.lastUpdated,
          }));
          setFiles(loadedFiles);
        }
      }
    } catch (err) {
      console.error("Failed to load code:", err);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const response = await fetch(`/api/labs/${labId}/announcements?userId=${userData.id}&role=student`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
      });
      if (response.ok) {
        setAnnouncements(await response.json());
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    }
  };

  const loadChatMessages = async () => {
    try {
      const response = await fetch(
        `/api/labs/${labId}/chat?userId=${userData.id}&role=student&receiverId=${lab?.teacherId}`,
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

  const handleSaveCode = async () => {
    const currentFile = files[currentFileIndex];
    setIsSaving(true);

    try {
      const response = await fetch(`/api/labs/${labId}/code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
        body: JSON.stringify({
          userId: userData.id,
          role: "student",
          fileName: currentFile.fileName,
          language: currentFile.language,
          code: currentFile.code,
        }),
      });

      if (response.ok) {
        const updatedFile = await response.json();
        const newFiles = [...files];
        newFiles[currentFileIndex].lastUpdated = updatedFile.lastUpdated;
        setFiles(newFiles);
      }
    } catch (err) {
      console.error("Failed to save code:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunCode = async () => {
    const currentFile = files[currentFileIndex];
    setIsRunning(true);
    setOutput("Running code...");

    try {
      const response = await fetch("/api/judge0/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_code: currentFile.code,
          language_id: currentFile.languageId,
          stdin: customInput,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.stdout) {
          setOutput(result.stdout);
        } else if (result.stderr) {
          setOutput(`Error:\n${result.stderr}`);
        } else if (result.compile_output) {
          setOutput(`Compilation Error:\n${result.compile_output}`);
        } else if (result.message) {
          setOutput(`Status: ${result.message}`);
        } else {
          setOutput("No output");
        }
      } else {
        setOutput("Failed to execute code. Please try again.");
      }
    } catch (err) {
      setOutput("Error executing code: " + (err as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatText.trim() || !lab) return;
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
          role: "student",
          receiverId: lab.teacherId,
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

  const handleAddFile = () => {
    if (!newFileName.trim()) return;
    
    const selectedLang = languages[0]; // Default to JavaScript
    const newFile: CodeFile = {
      fileName: newFileName,
      language: selectedLang.monacoId,
      languageId: selectedLang.id,
      code: `// ${newFileName}\n`,
    };
    
    setFiles([...files, newFile]);
    setCurrentFileIndex(files.length);
    setNewFileName("");
    setShowNewFileDialog(false);
  };

  const handleDeleteFile = (index: number) => {
    if (files.length === 1) return; // Keep at least one file
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (currentFileIndex >= newFiles.length) {
      setCurrentFileIndex(newFiles.length - 1);
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    const newFiles = [...files];
    newFiles[currentFileIndex].code = value || "";
    setFiles(newFiles);
  };

  const handleLanguageChange = (monacoId: string) => {
    const lang = languages.find(l => l.monacoId === monacoId);
    if (lang) {
      const newFiles = [...files];
      newFiles[currentFileIndex].language = lang.monacoId;
      newFiles[currentFileIndex].languageId = lang.id;
      setFiles(newFiles);
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

  const currentFile = files[currentFileIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.push("/student/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{lab.title}</h1>
            <p className="text-sm text-muted-foreground">Teacher: {lab.teacherName}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Left Sidebar - Announcements & Chat */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Megaphone className="h-4 w-4" />
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-4 w-4" />
                  Teacher Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-[250px] border rounded-lg p-3">
                  <div className="space-y-3">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.senderId === userData.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-2 ${
                            msg.senderId === userData.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
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
                    placeholder="Ask your teacher..."
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendChat()}
                  />
                  <Button
                    size="icon"
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
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Code Editor */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Code Editor
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSaveCode} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                  <Button size="sm" onClick={handleRunCode} disabled={isRunning}>
                    {isRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run Code
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      currentFileIndex === index
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    onClick={() => setCurrentFileIndex(index)}
                  >
                    <span className="text-sm font-medium">{file.fileName}</span>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(index);
                        }}
                        className="hover:bg-background/20 rounded p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                {showNewFileDialog ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="filename.ext"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddFile()}
                      className="w-32 h-8"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleAddFile}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNewFileDialog(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewFileDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New File
                  </Button>
                )}
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Language:</label>
                <Select value={currentFile.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.monacoId}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Code Editor */}
              <div className="border rounded-lg overflow-hidden">
                <Editor
                  height="400px"
                  language={currentFile.language}
                  value={currentFile.code}
                  onChange={handleCodeChange}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>

              {/* Input & Output */}
              <Tabs defaultValue="output" className="w-full">
                <TabsList>
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="input">Custom Input</TabsTrigger>
                </TabsList>
                <TabsContent value="output">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap min-h-[100px]">
                        {output || "Run your code to see output here"}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="input">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Custom Input</CardTitle>
                      <CardDescription>
                        Provide input for your program (stdin)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Enter input data..."
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        rows={5}
                        className="font-mono"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
