"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scrollArea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QuizEngine from "./QuizEngine";
import { PublicTest, SubmitResult } from "@/lib/shared-types";

interface StudentDashboardData {
  student: {
    name: string;
    phone: string;
    age: number;
    country: string;
  };
  stats: {
    totalAttempts: number;
    passedAttempts: number;
    averageScore: number;
  };
  attempts: Array<{
    id: string;
    testId: string;
    score: number;
    total: number;
    percentage: number;
    levelName: string;
    createdAt: string;
    test: {
      title: string;
      kind: string;
      emoji: string;
      color: string;
    };
  }>;
}

export default function StudentPortal({ onBack }: { onBack?: () => void }) {
  const { user, logout } = useSession();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // States for viewing answers
  const [viewAttemptId, setViewAttemptId] = useState<string | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/dashboard");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const viewAnswers = async (id: string) => {
    setViewAttemptId(id);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/attempts/${id}`);
      if (res.ok) {
        setAttemptDetails(await res.json());
      } else {
        setAttemptDetails(null);
      }
    } catch (e) {
      setAttemptDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-bold">تعذر تحميل بيانات لوحة التحكم</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900">
            مرحباً، {data.student.name} 👋
          </h1>
          <p className="text-purple-600 font-semibold mt-1">
            لوحة تحكم الطالب الخاصة بك
          </p>
        </div>
        <div className="flex gap-2">
          {onBack && (
            <Button onClick={onBack} variant="outline" className="font-bold border-purple-200 text-purple-700">
              الرئيسية
            </Button>
          )}
          <Button onClick={() => { logout(); onBack?.(); }} variant="destructive" className="font-bold">
            تسجيل الخروج
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-purple-100 bg-purple-50/50 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-4xl mb-2">📝</p>
            <h3 className="text-sm font-bold text-purple-500 mb-1">إجمالي الاختبارات</h3>
            <p className="text-3xl font-extrabold text-purple-900">{data.stats.totalAttempts}</p>
          </CardContent>
        </Card>
        <Card className="border-green-100 bg-green-50/50 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-4xl mb-2">✅</p>
            <h3 className="text-sm font-bold text-green-500 mb-1">الاختبارات المجتازة</h3>
            <p className="text-3xl font-extrabold text-green-900">{data.stats.passedAttempts}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-100 bg-orange-50/50 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-4xl mb-2">🎯</p>
            <h3 className="text-sm font-bold text-orange-500 mb-1">متوسط الدرجات</h3>
            <p className="text-3xl font-extrabold text-orange-900">{data.stats.averageScore}%</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold text-purple-900 mb-4">سجل الاختبارات</h2>
      
      {data.attempts.length === 0 ? (
        <Card className="border-dashed border-2 border-purple-200 bg-transparent">
          <CardContent className="p-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-purple-500 font-bold">لم تقم بإجراء أي اختبارات حتى الآن.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.attempts.map((attempt) => (
            <Card key={attempt.id} className="border-purple-100 shadow-sm overflow-hidden" style={{ borderRightWidth: '4px', borderRightColor: attempt.test.color }}>
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: attempt.test.color + "22" }}>
                    {attempt.test.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900 text-lg">{attempt.test.title}</h3>
                    <p className="text-xs font-semibold text-purple-400 mt-0.5">
                      {new Date(attempt.createdAt).toLocaleString("ar-SA")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-left" dir="ltr">
                    <p className="font-extrabold text-lg text-purple-900">
                      {attempt.test.kind === "points" ? `${Math.round(attempt.percentage)}%` : attempt.levelName}
                    </p>
                    {attempt.test.kind === "points" && (
                      <p className="text-xs font-bold text-purple-500">
                        {attempt.score} / {attempt.total}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={() => viewAnswers(attempt.id)}
                    variant="secondary" 
                    className="font-bold bg-purple-100 text-purple-700 hover:bg-purple-200"
                  >
                    إجاباتي
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Answers Dialog */}
      <Dialog open={!!viewAttemptId} onOpenChange={(open) => !open && setViewAttemptId(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 flex flex-col overflow-hidden bg-purple-50">
          <DialogHeader className="p-6 pb-2 shrink-0 border-b border-purple-100 bg-white">
            <DialogTitle className="text-2xl font-extrabold text-purple-900">
              تفاصيل إجاباتك
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6" dir="rtl">
            {detailsLoading ? (
              <div className="flex justify-center p-12">
                <span className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-400" />
              </div>
            ) : !attemptDetails ? (
              <div className="text-center p-12 text-red-500 font-bold">تعذر جلب الإجابات</div>
            ) : (
              <div className="space-y-6">
                {attemptDetails.test.questions.map((q: any, idx: number) => {
                  let parsedAns: any[] = [];
                  try {
                    parsedAns = JSON.parse(attemptDetails.answersJson || "[]");
                  } catch {}
                  
                  const ansObj = parsedAns.find((x: any) => x.questionId === q.id);
                  const selectedIdx = ansObj?.selected;
                  
                  let parsedOptions: any[] = [];
                  try {
                    parsedOptions = JSON.parse(q.optionsJson || "[]");
                  } catch {}

                  const isCorrect = selectedIdx === q.answerIndex;
                  const isDiagnostic = attemptDetails.test.kind === "diagnostic";
                  const isPoints = attemptDetails.test.kind === "points";
                  
                  const chosenOpt = selectedIdx !== undefined ? parsedOptions[selectedIdx] : undefined;

                  return (
                    <Card key={q.id} className="border-purple-200 overflow-hidden shadow-sm">
                      <div className={`h-1.5 ${isDiagnostic ? 'bg-purple-400' : isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-purple-900 text-lg">
                            <span className="text-purple-400 ml-2">{idx + 1}.</span>
                            {q.text}
                          </h4>
                        </div>
                        <div className="text-sm font-semibold mt-2 p-2 rounded bg-white border border-purple-100">
                          <span className="text-purple-500 ml-2">الإجابة المختارة:</span>
                          <span className={isPoints ? (isCorrect ? "text-emerald-600" : "text-red-600") : "text-purple-900"}>
                            {ansObj !== undefined ? (typeof chosenOpt === "string" ? chosenOpt : (chosenOpt?.text || "غير معروف")) : "لم يجب"}
                          </span>
                          {isPoints && selectedIdx !== q.answerIndex && (
                            <div className="mt-1 text-emerald-600">
                              <span className="text-purple-500 ml-2">الإجابة الصحيحة:</span>
                              {typeof parsedOptions[q.answerIndex] === "string" ? parsedOptions[q.answerIndex] : parsedOptions[q.answerIndex]?.text}
                            </div>
                          )}
                        </div>
                        {q.passage && (
                          <div className="p-3 bg-purple-100/50 rounded-lg text-purple-800 text-sm mb-4 leading-relaxed font-medium">
                            {q.passage}
                          </div>
                        )}
                        <div className="grid gap-2">
                          {parsedOptions.map((opt, oIdx) => {
                            const isSelected = selectedIdx === oIdx;
                            const isActualCorrect = !isDiagnostic && q.answerIndex === oIdx;
                            let bgClass = "bg-purple-50 border-purple-100";
                            
                            if (isDiagnostic) {
                              if (isSelected) bgClass = "bg-purple-100 border-purple-400 font-bold";
                            } else {
                              if (isActualCorrect && isSelected) bgClass = "bg-green-100 border-green-500 font-bold";
                              else if (isActualCorrect) bgClass = "bg-green-50 border-green-300";
                              else if (isSelected) bgClass = "bg-red-100 border-red-500 font-bold";
                            }

                            return (
                              <div key={oIdx} className={`p-3 rounded-xl border-2 flex items-center justify-between ${bgClass}`}>
                                <span className="font-semibold">{typeof opt === "string" ? opt : opt.text}</span>
                                {isSelected && <span>{isDiagnostic ? '🎯' : (isActualCorrect ? '✅' : '❌')}</span>}
                                {isActualCorrect && !isSelected && <span>✅</span>}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
