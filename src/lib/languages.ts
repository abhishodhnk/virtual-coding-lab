// Programming languages supported by Judge0 API
export const languages = [
  { id: 63, name: "JavaScript", monacoId: "javascript", extension: "js" },
  { id: 71, name: "Python", monacoId: "python", extension: "py" },
  { id: 62, name: "Java", monacoId: "java", extension: "java" },
  { id: 54, name: "C++", monacoId: "cpp", extension: "cpp" },
  { id: 50, name: "C", monacoId: "c", extension: "c" },
  { id: 51, name: "C#", monacoId: "csharp", extension: "cs" },
  { id: 78, name: "Kotlin", monacoId: "kotlin", extension: "kt" },
  { id: 68, name: "PHP", monacoId: "php", extension: "php" },
  { id: 72, name: "Ruby", monacoId: "ruby", extension: "rb" },
  { id: 73, name: "Rust", monacoId: "rust", extension: "rs" },
  { id: 74, name: "TypeScript", monacoId: "typescript", extension: "ts" },
  { id: 60, name: "Go", monacoId: "go", extension: "go" },
  { id: 82, name: "SQL", monacoId: "sql", extension: "sql" },
  { id: 75, name: "Swift", monacoId: "swift", extension: "swift" },
  { id: 83, name: "Scala", monacoId: "scala", extension: "scala" },
  { id: 70, name: "Perl", monacoId: "perl", extension: "pl" },
  { id: 80, name: "R", monacoId: "r", extension: "r" },
  { id: 43, name: "Plain Text", monacoId: "plaintext", extension: "txt" },
];

export function getLanguageById(id: number) {
  return languages.find(lang => lang.id === id);
}

export function getLanguageByMonacoId(monacoId: string) {
  return languages.find(lang => lang.monacoId === monacoId);
}
