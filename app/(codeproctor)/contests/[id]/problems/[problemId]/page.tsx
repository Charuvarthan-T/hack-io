"use client";
import { problem } from "@/types/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Editor from "@monaco-editor/react";
import { ArrowLeft, ChevronDown, Loader2, Trophy } from "lucide-react";
import { capitalizeFirstLetter } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
export default function ContestProblemPage() {
  const { id: contestId, problemId } = useParams();
  const router = useRouter();
  const [problem, setProblem] = useState<problem>({} as problem);
  const [contest, setContest] = useState<any>(null);
  const [problemPoints, setProblemPoints] = useState<number>(0);
  const [language, setLanguage] = useState<string>("javascript");
  const [code, setCode] = useState<string>("");
  const [languageCode, setLanguageCode] = useState<number>(63);
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  interface TestCase {
    id: string;
    input: string;
    output: string;
  }
  interface TestResult {
    testCaseId: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
  }
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [templates, setTemplates] = useState<{ [key: string]: string }>({});
  async function checkSubmissionStatus() {
    try {
      const res = await fetch(`/api/contests/${contestId}/submissions`);
      if (res.ok) {
        const data = await res.json();
        const submission = data.submissions?.find(
          (s: any) => s.problem_id === problemId && s.is_solved
        );
        if (submission) {
          setIsSolved(true);
        }
      }
    } catch (error) {
      console.error("Error checking submission status:", error);
    }
  }
  useEffect(() => {
    async function fetchData() {
      try {
        const contestRes = await fetch(`/api/contests/${contestId}`);
        if (contestRes.ok) {
          const contestData = await contestRes.json();
          setContest(contestData.contest);
        }
        const problemRes = await fetch(`/api/problems/${problemId}`);
        if (problemRes.ok) {
          const problemData = await problemRes.json();
          setProblem(problemData);
        }
        const problemsRes = await fetch(`/api/contests/${contestId}/problems`);
        if (problemsRes.ok) {
          const problemsData = await problemsRes.json();
          const contestProblem = problemsData.problems?.find(
            (p: any) => p.id === problemId
          );
          if (contestProblem) {
            setProblemPoints(contestProblem.points || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load problem");
      }
    }
    fetchData();
    checkSubmissionStatus();
    fetchTestCases();
    fetchTemplates();
  }, [contestId, problemId]);
  async function handleClick() {
    setIsLoading(true);
    setIsRunningTests(true);
    const apiUrl = process.env.NEXT_PUBLIC_JUDGE0_API_URL;
    if (!apiUrl) {
      setOutput("❌ API configuration missing. Please check your environment variables.");
      setIsLoading(false);
      setIsRunningTests(false);
      return;
    }
    try {
      if (testCases.length === 0) {
        const url = `${apiUrl}/submissions?base64_encoded=false&wait=true`;
        const options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language_id: languageCode,
            source_code: getBoilerplateCode(language, code),
            stdin: "",
          }),
        };
        const response = await fetch(url, options);
        const result = await response.json();
        if (result.compile_output) {
          setOutput(`❌ Compilation Error:\n${result.compile_output}`);
        } else if (result.stderr) {
          setOutput(`❌ Runtime Error:\n${result.stderr}`);
        } else {
          setOutput(result.stdout || "No output");
        }
      } else {
        const results: TestResult[] = [];
        let allTestsPassed = true;
        let compilationError = false;
        let runtimeError = false;
        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i];
          const url = `${apiUrl}/submissions?base64_encoded=false&wait=true`;
          const options = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              language_id: languageCode,
              source_code: getBoilerplateCode(language, code),
              stdin: testCase.input,
            }),
          };
          const response = await fetch(url, options);
          const result = await response.json();
          if (result.compile_output) {
            setOutput(`❌ Compilation Error:\n${result.compile_output}`);
            compilationError = true;
            break;
          }
          if (result.stderr && !result.stdout) {
            setOutput(`❌ Runtime Error on Test Case ${i + 1}:\n${result.stderr}`);
            runtimeError = true;
            break;
          }
          const actualOutput = (result.stdout || result.stderr || "").trim();
          const expectedOutput = (testCase.output || "").trim();
          const passed = actualOutput === expectedOutput;
          if (!passed) allTestsPassed = false;
          results.push({
            testCaseId: testCase.id,
            input: testCase.input,
            expectedOutput: expectedOutput,
            actualOutput: actualOutput,
            passed: passed,
          });
        }
        if (!compilationError && !runtimeError) {
          setTestResults(results);
          const passedCount = results.filter((r) => r.passed).length;
          if (allTestsPassed) {
            try {
              const submissionRes = await fetch(`/api/contests/${contestId}/submissions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  problemId: problemId,
                  isSolved: true,
                  pointsEarned: problemPoints,
                }),
              });
              if (submissionRes.ok) {
                setIsSolved(true);
                toast.success(`🎉 Accepted! +${problemPoints} points`);
                setOutput(
                  `🎉 Accepted!\n\nAll test cases passed (${passedCount}/${results.length})\n\nContest Points Earned: ${problemPoints}\n\nRuntime: Judge0`
                );
              } else {
                setOutput(
                  `🎉 Accepted!\n\nAll test cases passed (${passedCount}/${results.length})\n\nPoints: Failed to record submission\n\nRuntime: Judge0`
                );
              }
            } catch (error) {
              console.error("Error recording submission:", error);
              setOutput(
                `🎉 Accepted!\n\nAll test cases passed (${passedCount}/${results.length})\n\nPoints: Error recording submission\n\nRuntime: Judge0`
              );
            }
          } else {
            const firstFailedIndex = results.findIndex((r) => !r.passed);
            setOutput(
              `❌ Wrong Answer\n\nTest case ${firstFailedIndex + 1} failed\nPassed: ${passedCount}/${results.length}\n\nSee test cases below for details.`
            );
            setSelectedTestCase(firstFailedIndex);
          }
        }
      }
    } catch (error) {
      console.error("Error running code:", error);
      setOutput("❌ Network Error: Unable to run your code. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRunningTests(false);
    }
  }
  const getMonacoLanguage = (lang: string): string => {
    switch (lang) {
      case "cpp": return "cpp";
      case "c": return "c";
      case "python": return "python";
      case "java": return "java";
      case "javascript": return "javascript";
      default: return "javascript";
    }
  };
  async function fetchTestCases() {
    try {
      const response = await fetch(`/api/problems/${problemId}/testcases`);
      if (response.ok) {
        const data = await response.json();
        setTestCases(data);
      }
    } catch (error) {
      console.error("Error fetching test cases:", error);
    }
  }
  async function fetchTemplates() {
    try {
      const response = await fetch(`/api/problems/${problemId}/template`);
      if (response.ok) {
        const data = await response.json();
        if (data.templates && typeof data.templates === "object") {
          setTemplates(data.templates);
        } else {
          setTemplates({});
        }
      } else {
        setTemplates({});
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setTemplates({});
    }
  }
  const getUserTemplate = (lang: string): string => {
    if (templates && typeof templates === "object" && templates[lang]) {
      const dbTemplate = templates[lang];
      if (dbTemplate && dbTemplate.trim() !== "") {
        return dbTemplate;
      }
    }
    if (
      problem.function_signatures &&
      problem.function_signatures[lang as keyof typeof problem.function_signatures]
    ) {
      return problem.function_signatures[lang as keyof typeof problem.function_signatures] || getCleanTemplate(lang);
    }
    return getCleanTemplate(lang);
  };
  const getCleanTemplate = (lang: string): string => {
    switch (lang) {
      case "python":
        return `def solution(input_data):\n    # Write your solution here\n    return "your_output"`;
      case "javascript":
        return `function solution(input) {\n    // Write your solution here\n    return "your_output";\n}`;
      case "java":
        return `public class Solution {\n    public String solution(String input) {\n        // Write your solution here\n        return "your_output";\n    }\n}`;
      case "cpp":
        return `#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    string solution(string input) {\n        // Write your solution here\n        return "your_output";\n    }\n};`;
      case "c":
        return `#include <stdio.h>\n#include <string.h>\n\nchar* solution(char* input) {\n    // Write your solution here\n    static char result[1000];\n    strcpy(result, "your_output");\n    return result;\n}`;
      default:
        return "// Write your solution here...";
    }
  };
  const getBoilerplateCode = (lang: string, userCode: string): string => {
    switch (lang) {
      case "python":
        return `${userCode}\n\nimport sys\ninput_data = sys.stdin.read().strip()\nresult = solution(input_data)\nprint(result)`;
      case "javascript":
        return `${userCode}\n\nconst input = require('fs').readFileSync(0, 'utf8').trim();\nconst result = solution(input);\nconsole.log(result);`;
      case "java":
        return `import java.util.*;\nimport java.io.*;\n\n${userCode}\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String input = br.readLine();\n        Solution sol = new Solution();\n        String result = sol.solution(input);\n        System.out.println(result);\n    }\n}`;
      case "cpp":
        return `#include <iostream>\n#include <string>\nusing namespace std;\n\n${userCode}\n\nint main() {\n    string input;\n    getline(cin, input);\n    Solution sol;\n    cout << sol.solution(input) << endl;\n    return 0;\n}`;
      case "c":
        return `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n${userCode}\n\nint main() {\n    char input[1000];\n    if (fgets(input, sizeof(input), stdin) != NULL) {\n        input[strcspn(input, "\\n")] = 0;\n        char* result = solution(input);\n        printf("%s\\n", result);\n    }\n    return 0;\n}`;
      default:
        return userCode;
    }
  };
  useEffect(() => {
    if (Object.keys(templates).length > 0) {
      const template = getUserTemplate(language);
      setCode(template);
    }
  }, [templates]);
  useEffect(() => {
    const template = getUserTemplate(language);
    setCode(template);
  }, [language, templates]);
  return (
    <div className="flex flex-col h-[85vh]">
      {}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(`/contests/${contestId}/take`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contest
        </Button>
        <div className="flex items-center gap-4">
          {contest && (
            <div className="text-sm text-muted-foreground">
              {contest.title}
            </div>
          )}
          <Badge variant="outline" className="gap-1">
            <Trophy className="h-3 w-3" />
            {problemPoints} points
          </Badge>
          {isSolved && (
            <Badge variant="default" className="bg-green-600">
              ✓ Solved
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 gap-2 min-h-0">
        {}
        <div className="w-1/2 flex flex-col">
          <div className="rounded-lg border bg-card shadow-sm p-6 flex-1 overflow-auto">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                {capitalizeFirstLetter(problem.title) || "Loading..."}
              </h2>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Description
                </h3>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {problem.description || "Loading problem description..."}
                </div>
              </div>
              {problem.created_by && (
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Created By
                  </h3>
                  <p className="text-muted-foreground">{problem.created_by}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {}
        <div className="w-1/2 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-30">
                    {language} <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { setLanguage("python"); setLanguageCode(71); }}>
                    python
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setLanguage("javascript"); setLanguageCode(63); }}>
                    javascript
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setLanguage("java"); setLanguageCode(62); }}>
                    java
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setLanguage("cpp"); setLanguageCode(54); }}>
                    cpp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setLanguage("c"); setLanguageCode(50); }}>
                    C
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="default"
                onClick={handleClick}
                disabled={isLoading || isRunningTests}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isRunningTests ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    ▶ Run
                    {testCases.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">
                        {testCases.length}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="rounded-lg border overflow-hidden mb-2" style={{ height: "45vh" }}>
            <Editor
              height="100%"
              language={getMonacoLanguage(language)}
              theme="vs-dark"
              value={code}
              key={`${language}-${JSON.stringify(templates)}`}
              options={{
                padding: { top: 20, bottom: 20 },
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: true,
                automaticLayout: true,
              }}
              onChange={(value) => setCode(value || "")}
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">Console</h3>
                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {isRunningTests ? "Running tests..." : "Running..."}
                  </div>
                )}
              </div>
              <div className="bg-gray-900 dark:bg-gray-950 rounded-md p-3 font-mono text-xs min-h-[80px] border border-gray-200 dark:border-gray-800">
                {!isLoading && !output && (
                  <span className="text-gray-500">Click "Run" to see output</span>
                )}
                {output && (
                  <div className="text-gray-100">
                    {output.includes("🎉 Accepted") && <div className="text-green-400"><pre className="whitespace-pre-wrap">{output}</pre></div>}
                    {output.includes("❌ Wrong Answer") && <div className="text-red-400"><pre className="whitespace-pre-wrap">{output}</pre></div>}
                    {output.includes("❌ Compilation Error") && <div className="text-yellow-400"><pre className="whitespace-pre-wrap">{output}</pre></div>}
                    {output.includes("❌ Runtime Error") && <div className="text-orange-400"><pre className="whitespace-pre-wrap">{output}</pre></div>}
                    {!output.includes("🎉") && !output.includes("❌") && <div className="text-gray-100"><pre className="whitespace-pre-wrap">{output}</pre></div>}
                  </div>
                )}
              </div>
            </Card>
            {}
            {testCases.length > 0 && (
              <Card className="p-3 flex-1 max-h-[25vh] overflow-hidden">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground">Test Cases</h3>
                    <Badge variant="secondary" className="text-xs h-5">
                      {testResults.length > 0
                        ? `${testResults.filter((r) => r.passed).length}/${testResults.length} passed`
                        : `${testCases.length} cases`}
                    </Badge>
                  </div>
                  <div className="flex gap-1 border-b mb-3">
                    {testCases.map((testCase, index) => {
                      const result = testResults.find((r) => r.testCaseId === testCase.id);
                      return (
                        <button
                          key={testCase.id}
                          onClick={() => setSelectedTestCase(index)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-colors ${
                            selectedTestCase === index
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            Case {index + 1}
                            {result && (
                              <div className={`w-2 h-2 rounded-full ${result.passed ? "bg-green-600" : "bg-red-600"}`} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {testCases[selectedTestCase] && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Input</label>
                            <div className="bg-muted/50 border rounded-md p-2 font-mono text-xs">
                              {testCases[selectedTestCase].input || "(empty)"}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Expected</label>
                            <div className="bg-muted/50 border rounded-md p-2 font-mono text-xs">
                              {testCases[selectedTestCase].output || "(empty)"}
                            </div>
                          </div>
                        </div>
                        {(() => {
                          const result = testResults.find((r) => r.testCaseId === testCases[selectedTestCase].id);
                          if (result && !result.passed) {
                            return (
                              <div>
                                <label className="text-xs font-medium text-red-600 mb-1 block">Your Output</label>
                                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-md p-2 font-mono text-xs">
                                  {result.actualOutput || "(empty)"}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
