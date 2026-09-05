"use client";

import React, { useRef } from "react";

export interface CertificateData {
  studentNameAr: string;
  studentNameEn: string;
  testTitle: string;
  testType?: string; // 'attendance' | 'level'
  scorePercent?: number;
  courseHours?: number;
  levelCode?: string;
  levelName?: string;
  issueDate: string;
  institutionName?: string;
  institutionLogo?: string;
  certTitleAr?: string;
  certTitleEn?: string;
  showSponsorOnCert?: boolean;
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
  const hours = data.courseHours || 30;

  // Bulletproof printing via popup window so zero blank pages occur and fits on 1 A4 page
  const handlePrintPopup = () => {
    const content = certRef.current;
    if (!content) {
      window.print();
      return;
    }
    const printWindow = window.open("", "_blank", "width=1100,height=800");
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
            box-sizing: border-box !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          #print-wrapper {
            width: 100%;
            max-width: 1020px;
            padding: 10px;
            margin: auto;
          }
        </style>
      </head>
      <body>
        <div id="print-wrapper">
          ${content.outerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
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
            padding: 12px !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>

      {/* Action Toolbar (hidden on print) */}
      <div className="w-full max-w-5xl flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-xl mb-3 shadow-2xl print:hidden border border-slate-800 cert-font">
        <div className="flex items-center gap-2">
          <span className="text-xl">📜</span>
          <h3 className="font-extrabold text-sm sm:text-base">
            معاينة الشهادة الرسمية — {data.isKhda ? "مصدقة KHDA" : "إصدار معهد السلام الثقافي (فرع)"}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrintPopup}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-5 py-2.5 rounded-lg text-sm transition flex items-center gap-2 shadow-lg cursor-pointer"
          >
            🖨️ طباعة / حفظ كـ PDF (صفحة واحدة)
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

      {/* Printable Certificate Frame (Compact 1-Page A4 Fit) */}
      <div
        ref={certRef}
        id="certificate-print-area"
        className="w-full max-w-[980px] bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden p-5 sm:p-7 border-[8px] border-amber-800/90 relative print:shadow-none print:w-full print:max-w-none print:border-[6px] print:m-0 cert-font"
      >
        {/* Inner Decorative Double Border */}
        <div className="border-2 border-amber-600/60 p-4 sm:p-6 relative flex flex-col justify-between min-h-[540px]">

          {/* Top Header Row (Bilingual Header with Official Al Salam Logo on Both Sides, Middle EMPTY) */}
          <div className="flex items-center justify-between border-b border-amber-900/20 pb-3">
            {/* Right Header - Arabic (Starts with Al Salam Logo, then Name & Permit) */}
            <div className="flex items-center gap-3 text-right">
              <img
                src="/images/al-salam-logo.png"
                alt="شعار معهد السلام الثقافي"
                className="h-12 w-auto object-contain"
              />
              <div className="text-[11px] sm:text-xs text-slate-800 leading-tight">
                <p className="font-semibold text-slate-500 text-[9px]">اسم المعهد</p>
                <p className="font-black text-slate-900">معهد السلام الثقافي (فرع)</p>
                <p className="font-semibold text-slate-500 text-[9px] mt-0.5">رقم التصريح</p>
                <p className="font-black text-amber-800">631359</p>
              </div>
            </div>

            {/* Top Center Header - EMPTY as requested */}
            <div className="flex-1 text-center"></div>

            {/* Left Header - English (Starts with Al Salam Logo, then Name & Permit) */}
            <div className="flex items-center gap-3 text-left dir-ltr" dir="ltr">
              <img
                src="/images/al-salam-logo.png"
                alt="Al Salam Cultural Institute Logo"
                className="h-12 w-auto object-contain"
              />
              <div className="text-[11px] sm:text-xs text-slate-800 leading-tight">
                <p className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">INSTITUTE NAME</p>
                <p className="font-black text-slate-900">Al Salam Cultural Institute (Branch)</p>
                <p className="font-semibold text-slate-500 uppercase tracking-wider text-[9px] mt-0.5">PERMIT NUMBER</p>
                <p className="font-black text-amber-800">631359</p>
              </div>
            </div>
          </div>

          {/* Certificate Main Body Section */}
          <div className="text-center my-3 sm:my-4 space-y-2.5">
            {/* Title (Customizable AR + EN) */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-amber-950 tracking-wide">
                {certTitleAr}
              </h1>
              <p className="text-xs sm:text-sm font-extrabold text-amber-700 uppercase tracking-widest mt-0.5">
                {certTitleEn}
              </p>
            </div>

            {/* Awarded To */}
            <div className="py-0.5">
              <p className="text-xs sm:text-sm text-slate-700 font-bold">تشهد إدارة المعهد بأن الطالب / الطالـبـة</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">This is to certify that</p>
            </div>

            {/* Student Full Name Display (AR + EN) */}
            <div className="bg-amber-50/70 border-y-2 border-amber-300 py-2.5 max-w-xl mx-auto rounded-xl shadow-inner">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {data.studentNameAr || "الاسم الكامل"}
              </h2>
              {data.studentNameEn && (
                <p className="text-sm sm:text-base font-extrabold text-amber-800 tracking-wide mt-0.5">
                  {data.studentNameEn}
                </p>
              )}
            </div>

            {/* Achievement Description */}
            <div className="max-w-2xl mx-auto space-y-1 text-xs sm:text-sm text-slate-800 font-bold leading-normal">
              <p>
                قد أكمل بنجاح اختبار <span className="font-black text-purple-900 underline decoration-amber-400">{data.testTitle}</span>
              </p>
              <p className="text-slate-500 text-[11px] font-semibold">
                Has successfully completed the assessment for <span className="font-bold text-slate-800">{data.testTitle}</span>
              </p>

              {/* Training Hours & Level Badge (NO percentage result shown) */}
              <div className="inline-flex items-center gap-3 bg-purple-50 border border-purple-200 px-4 py-1 rounded-full mt-1.5 shadow-sm">
                {data.levelName && (
                  <span className="font-black text-purple-900 text-xs">
                    المستوى: {data.levelCode ? `[${data.levelCode}] ` : ""}{data.levelName}
                  </span>
                )}
                <span className="text-xs font-black text-amber-900 bg-amber-100/90 px-3 py-0.5 rounded-md">
                  بواقع ({hours}) ساعة تدريبية / Duration: ({hours}) Training Hours
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="pt-0.5 text-xs text-slate-600 font-semibold">
              <span>تاريخ الإصدار / Issue Date:</span>{" "}
              <span className="font-black text-slate-900">{data.issueDate}</span>
            </div>
          </div>

          {/* Sponsor Badge Section (Bottom Center - Rendered only if showSponsorOnCert is true) */}
          {data.showSponsorOnCert !== false && data.institutionName && (
            <div className="my-1.5 text-center bg-amber-50/90 border border-amber-300/80 rounded-lg px-4 py-1 max-w-sm mx-auto shadow-sm">
              <div className="flex items-center justify-center gap-2">
                {data.institutionLogo && (
                  <img
                    src={data.institutionLogo}
                    alt="Sponsor Logo"
                    className="h-5 object-contain"
                  />
                )}
                <p className="text-[10px] text-amber-950 font-bold">
                  برعاية / Sponsored by: <span className="font-black text-purple-900">{data.institutionName}</span>
                </p>
              </div>
            </div>
          )}

          {/* Footer Seals & Attestation Row */}
          <div className="grid grid-cols-2 gap-4 items-end pt-2.5 border-t border-amber-900/20">
            {/* Institute Stamp Box (Left) */}
            <div className="border border-slate-300 rounded-lg p-2 h-28 flex flex-col justify-between text-center bg-slate-50/50">
              <p className="text-[9px] font-extrabold text-slate-600">ختم / توقيع المعهد (Institute Seal & Signature)</p>
              <div className="flex-1 flex items-center justify-center my-0.5">
                <div className="w-16 h-16 rounded-full border-2 border-amber-700/60 p-1 flex items-center justify-center bg-amber-100/30 text-amber-900 font-black text-[9px] text-center transform -rotate-12 shadow-sm">
                  معهد السلام الثقافي<br />
                  Al Salam Cultural<br />
                  631359
                </div>
              </div>
              <p className="text-[8px] text-slate-400 font-bold">Al Salam Cultural Institute - Dubai</p>
            </div>

            {/* KHDA Attestation Box (Right) */}
            <div className="border border-slate-300 rounded-lg p-2 h-28 flex flex-col justify-between text-right bg-slate-50/50 relative overflow-hidden">
              <p className="text-[9px] font-extrabold text-slate-600 text-center">
                {data.isKhda ? "تصديق هيئة المعرفة KHDA" : "رمز التحقق الإلكتروني"}
              </p>

              {data.isKhda ? (
                /* KHDA Official Template Details */
                <div className="text-[8px] leading-tight space-y-0.5 text-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                    <span className="font-black text-pink-900 text-[10px]">DUBAI Knowledge | المعرفة</span>
                    <span className="bg-pink-100 text-pink-900 font-bold px-1 py-0.2 rounded text-[7px]">KHDA</span>
                  </div>
                  <p className="font-bold text-slate-900">KHDA QR Attestation</p>
                  <p className="text-[7px] text-slate-600 line-clamp-1">
                    By virtue of Law No. (30) of 2006 establishing Knowledge and Human Development Authority...
                  </p>
                  <div className="text-[7px] font-extrabold text-amber-800">
                    Fees: AED 50 | Attestation Fee: AED 140
                  </div>
                </div>
              ) : (
                /* Free Certificate (Clean Box) */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-1">
                  <div className="w-10 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-300 text-[9px]">
                    تصديق KHDA
                  </div>
                  <p className="text-[8px] text-slate-400 mt-0.5">شهادة حضور صادرة مجاناً من الفرع</p>
                </div>
              )}

              <p className="text-[8px] text-slate-400 text-center font-bold">
                {data.certId ? `Ref: ${data.certId}` : "Permit 631359"}
              </p>
            </div>
          </div>

          {/* Bottom Legal Disclaimer */}
          <div className="text-center pt-2 mt-1 border-t border-slate-200 text-[8px] text-slate-500 font-bold leading-tight">
            تعد هذه الشهادة شهادة حضور أو مشاركة في دورة تدريبية، ولا تعتبر مؤهلاً مهنياً أو أكاديمياً أو درجة جامعية.
            <br />
            This certificate is a certificate of attendance or participation in a training course, and is not considered a professional or academic qualification or university degree.
          </div>
        </div>
      </div>
    </div>
  );
}
