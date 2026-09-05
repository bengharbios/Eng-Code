"use client";

import React, { useRef } from "react";

export interface CertificateData {
  studentNameAr: string;
  studentNameEn: string;
  testTitle: string;
  testType?: string; // 'attendance' | 'level'
  scorePercent: number;
  levelCode?: string;
  levelName?: string;
  issueDate: string;
  institutionName?: string;
  institutionLogo?: string;
  certTitleAr?: string;
  certTitleEn?: string;
  isKhda: boolean;
  khdaFee?: number;
  certId?: string;
}

export default function CertificateView({
  data,
  onClose,
}: {
  data: CertificateData;
  onClose?: () => void;
}) {
  const certRef = useRef<HTMLDivElement>(null);

  const isLevel = data.testType === "level" || !!data.levelName;
  const certTitleAr = data.certTitleAr?.trim() || (isLevel ? "شهادة تحديد مستوى وإنجاز" : "شهادة حضور تدريبية");
  const certTitleEn = data.certTitleEn?.trim() || (isLevel ? "LEVEL ASSESSMENT & ACHIEVEMENT CERTIFICATE" : "CERTIFICATE OF ATTENDANCE");

  // Bulletproof printing via popup window so zero blank pages occur
  const handlePrintPopup = () => {
    const content = certRef.current;
    if (!content) {
      window.print();
      return;
    }
    const printWindow = window.open("", "_blank", "width=1100,height=850");
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>شهادة — ${data.studentNameAr || data.studentNameEn}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          * {
            font-family: 'Cairo', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            background-color: #ffffff;
            margin: 0;
            padding: 15px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; max-width: 1000px;">
          ${content.outerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto flex flex-col items-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto font-['Cairo']">
      {/* Google Font Cairo Import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        .cert-font, .cert-font * {
          font-family: 'Cairo', sans-serif !important;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #certificate-print-area, #certificate-print-area * {
            visibility: visible !important;
          }
          #certificate-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>

      {/* Action Toolbar (hidden on print) */}
      <div className="w-full max-w-5xl flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-xl mb-4 shadow-2xl print:hidden border border-slate-800 cert-font">
        <div className="flex items-center gap-2">
          <span className="text-xl">📜</span>
          <h3 className="font-extrabold text-sm sm:text-base">
            معاينة الشهادة الرسمية — {data.isKhda ? "مصدقة KHDA" : "إصدار معهد السلام"}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrintPopup}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-5 py-2.5 rounded-lg text-sm transition flex items-center gap-2 shadow-lg cursor-pointer"
          >
            🖨️ طباعة / حفظ كـ PDF
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer"
            >
              ✕ إغلاق
            </button>
          )}
        </div>
      </div>

      {/* Printable Certificate Frame */}
      <div
        ref={certRef}
        id="certificate-print-area"
        className="w-full max-w-[1000px] bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden p-6 sm:p-10 border-[10px] border-amber-700/80 relative print:shadow-none print:w-full print:max-w-none print:border-[8px] print:m-0 cert-font"
      >
        {/* Inner Decorative Double Border */}
        <div className="border-2 border-amber-600/60 p-4 sm:p-8 relative min-h-[620px] flex flex-col justify-between">
          {/* Corner Ornaments */}
          <div className="absolute top-2 left-2 text-amber-600 text-xl font-bold">⚜️</div>
          <div className="absolute top-2 right-2 text-amber-600 text-xl font-bold">⚜️</div>
          <div className="absolute bottom-2 left-2 text-amber-600 text-xl font-bold">⚜️</div>
          <div className="absolute bottom-2 right-2 text-amber-600 text-xl font-bold">⚜️</div>

          {/* Top Header Row (Bilingual Header with Official Al Salam Logo in Center) */}
          <div className="flex items-center justify-between border-b border-amber-900/20 pb-4">
            {/* Left Header - English */}
            <div className="text-left text-[11px] sm:text-xs text-slate-700 leading-tight">
              <p className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">INSTITUTE NAME</p>
              <p className="font-extrabold text-slate-900">Al Salam Cultural Institute (Branch)</p>
              <p className="font-semibold text-slate-500 uppercase tracking-wider text-[9px] mt-1">PERMIT NUMBER</p>
              <p className="font-black text-amber-800">631359</p>
            </div>

            {/* Top Center Official Al Salam Institute Logo */}
            <div className="text-center px-4">
              <div className="flex items-center justify-center gap-2">
                {/* Official Al Salam Emblem / Logo */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-800 to-amber-700 p-0.5 shadow flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-amber-800 font-black text-xs">
                    معهد السلام
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-black text-purple-900 tracking-wider mt-1">معهد السلام الثقافي (فرع)</p>
              <p className="text-[8px] font-bold text-amber-800 tracking-widest uppercase">Al Salam Cultural Institute</p>
            </div>

            {/* Right Header - Arabic */}
            <div className="text-right text-[11px] sm:text-xs text-slate-700 leading-tight">
              <p className="font-semibold text-slate-500 text-[9px]">اسم المعهد</p>
              <p className="font-extrabold text-slate-900">معهد السلام الثقافي (فرع)</p>
              <p className="font-semibold text-slate-500 text-[9px] mt-1">رقم التصريح</p>
              <p className="font-black text-amber-800">631359</p>
            </div>
          </div>

          {/* Certificate Main Body Section */}
          <div className="text-center my-4 sm:my-6 space-y-3">
            {/* Ornament Icon */}
            <div className="text-amber-600 text-2xl">⚜️</div>

            {/* Title (Customizable AR + EN) */}
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-amber-950 tracking-wide">
                {certTitleAr}
              </h1>
              <p className="text-xs sm:text-sm font-extrabold text-amber-700 uppercase tracking-widest mt-1">
                {certTitleEn}
              </p>
            </div>

            {/* Awarded To */}
            <div className="py-1">
              <p className="text-xs sm:text-sm text-slate-700 font-bold">تشهد إدارة المعهد بأن الطالب / الطالـبـة</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase">This is to certify that</p>
            </div>

            {/* Student Full Name Display (AR + EN) */}
            <div className="bg-amber-50/70 border-y-2 border-amber-300 py-3.5 max-w-2xl mx-auto rounded-xl shadow-inner">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {data.studentNameAr || "الاسم الكامل"}
              </h2>
              {data.studentNameEn && (
                <p className="text-base sm:text-lg font-extrabold text-amber-800 tracking-wide mt-0.5">
                  {data.studentNameEn}
                </p>
              )}
            </div>

            {/* Achievement Description */}
            <div className="max-w-3xl mx-auto space-y-1.5 text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
              <p>
                قد أكمل بنجاح اختبار <span className="font-black text-purple-900 underline decoration-amber-400">{data.testTitle}</span>
              </p>
              <p className="text-slate-500 text-xs font-semibold">
                Has successfully completed the assessment for <span className="font-bold text-slate-800">{data.testTitle}</span>
              </p>

              {/* Score / Level Badge */}
              <div className="inline-flex items-center gap-3 bg-purple-50 border border-purple-200 px-4 py-1.5 rounded-full mt-2">
                {data.levelName && (
                  <span className="font-black text-purple-900 text-xs sm:text-sm">
                    المستوى: {data.levelCode ? `[${data.levelCode}] ` : ""}{data.levelName}
                  </span>
                )}
                <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                  النتيجة: {data.scorePercent}%
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="pt-1 text-xs text-slate-600 font-semibold">
              <span>تاريخ الإصدار / Issue Date:</span>{" "}
              <span className="font-black text-slate-900">{data.issueDate}</span>
            </div>
          </div>

          {/* Sponsor Badge Section (Moved to Bottom Center in smaller format) */}
          {data.institutionName && (
            <div className="my-2 text-center bg-amber-50/90 border border-amber-300/80 rounded-lg px-4 py-1.5 max-w-md mx-auto shadow-sm">
              <div className="flex items-center justify-center gap-2">
                {data.institutionLogo && (
                  <img
                    src={data.institutionLogo}
                    alt="Sponsor Logo"
                    className="h-6 object-contain"
                  />
                )}
                <p className="text-[11px] text-amber-950 font-bold">
                  برعاية / Sponsored by: <span className="font-black text-purple-900">{data.institutionName}</span>
                </p>
              </div>
            </div>
          )}

          {/* Footer Seals & Attestation Row */}
          <div className="grid grid-cols-2 gap-4 items-end pt-4 border-t border-amber-900/20">
            {/* Institute Stamp Box (Left) */}
            <div className="border border-slate-300 rounded-lg p-2.5 h-36 flex flex-col justify-between text-center bg-slate-50/50">
              <p className="text-[10px] font-extrabold text-slate-600">ختم / توقيع المعهد (Institute Seal & Signature)</p>
              <div className="flex-1 flex items-center justify-center my-1">
                <div className="w-20 h-20 rounded-full border-2 border-amber-700/60 p-1 flex items-center justify-center bg-amber-100/30 text-amber-900 font-black text-[10px] text-center transform -rotate-12 shadow-sm">
                  معهد السلام الثقافي<br />
                  Al Salam Cultural<br />
                  631359
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-bold">Al Salam Cultural Institute - Dubai</p>
            </div>

            {/* KHDA Attestation Box (Right) */}
            <div className="border border-slate-300 rounded-lg p-2.5 h-36 flex flex-col justify-between text-right bg-slate-50/50 relative overflow-hidden">
              <p className="text-[10px] font-extrabold text-slate-600 text-center">
                {data.isKhda ? "تصديق هيئة المعرفة KHDA" : "رمز التحقق الإلكتروني"}
              </p>

              {data.isKhda ? (
                /* KHDA Official Template Details */
                <div className="text-[9px] leading-tight space-y-1 text-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-black text-pink-900 text-xs">DUBAI Knowledge | المعرفة</span>
                    <span className="bg-pink-100 text-pink-900 font-bold px-1.5 py-0.5 rounded text-[8px]">KHDA</span>
                  </div>
                  <p className="font-bold text-slate-900">KHDA QR Attestation</p>
                  <p className="text-[8px] text-slate-600 line-clamp-2">
                    By virtue of Law No. (30) of 2006 establishing Knowledge and Human Development Authority in Dubai...
                  </p>
                  <div className="text-[8px] font-extrabold text-amber-800 pt-0.5">
                    Fees: AED 50 | Knowledge Dirham: AED 10 | Innovation Dirham: AED 10 | Attestation Fee: AED 140
                  </div>
                </div>
              ) : (
                /* Free Certificate (Clean Box) */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
                  <div className="w-12 h-12 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-300 text-[10px]">
                    مخصص لتصديق KHDA
                  </div>
                  <p className="text-[8px] text-slate-400 mt-1">شهادة حضور صادرة مجاناً من الفرع</p>
                </div>
              )}

              <p className="text-[8px] text-slate-400 text-center font-bold">
                {data.certId ? `Ref: ${data.certId}` : "Permit 631359"}
              </p>
            </div>
          </div>

          {/* Bottom Legal Disclaimer */}
          <div className="text-center pt-3 mt-2 border-t border-slate-200 text-[9px] text-slate-500 font-bold">
            تعد هذه الشهادة شهادة حضور أو مشاركة في دورة تدريبية، ولا تعتبر مؤهلاً مهنياً أو أكاديمياً أو درجة جامعية.
            <br />
            This certificate is a certificate of attendance or participation in a training course, and is not considered a professional or academic qualification or university degree.
          </div>
        </div>
      </div>
    </div>
  );
}
