"use client";

import { useTranslations } from "next-intl";

export function HeroSticker() {
  const t = useTranslations();

  return (
    <div className="relative hidden h-80 select-none lg:block" aria-hidden="true">
      <div className="floaty absolute top-4 left-1/2 w-64 -translate-x-1/2 rounded-lg border-2 border-ink bg-white p-5 shadow-pop">
        <p className="border-b-4 border-ink pb-1.5 text-lg font-black tracking-tight uppercase">
          {t("nutritionFacts")}
        </p>
        <div className="mt-2 flex justify-between text-[11px]">
          <span>{t("stkServe")}</span>
          <b>{t("stkServeVal")}</b>
        </div>
        <div className="mt-2 border-t-8 border-ink pt-2">
          <div className="flex justify-between py-0.5 text-xs font-bold">
            <span>{t("stkEnergy")}</span>
            <span>{t("stkCur")}</span>
          </div>
          <div className="flex justify-between border-b border-ink/20 py-0.5 text-xs">
            <span>{t("stkLang")}</span>
            <b>{t("stkLangVal")}</b>
          </div>
          <div className="flex justify-between border-b border-ink/20 py-0.5 text-xs">
            <span>{t("stkSugar")}</span>
            <b>{t("stkSugarVal")}</b>
          </div>
          <div className="flex justify-between py-0.5 text-xs font-bold">
            <span>{t("stkMood")}</span>
            <span>{t("stkMoodVal")}</span>
          </div>
        </div>
        <p className="mt-3 text-[9px] tracking-widest text-ink/50 uppercase">{t("stkFoot")}</p>
        <svg className="mt-1 h-6 w-full" viewBox="0 0 200 24" preserveAspectRatio="none">
          <g fill="#1F2D26">
            <rect x="0" width="3" height="24" />
            <rect x="6" width="1.5" height="24" />
            <rect x="10" width="4" height="24" />
            <rect x="17" width="2" height="24" />
            <rect x="22" width="1.5" height="24" />
            <rect x="27" width="5" height="24" />
            <rect x="35" width="2" height="24" />
            <rect x="40" width="3" height="24" />
            <rect x="46" width="1.5" height="24" />
            <rect x="51" width="4" height="24" />
            <rect x="58" width="2" height="24" />
            <rect x="63" width="3" height="24" />
            <rect x="69" width="1.5" height="24" />
            <rect x="74" width="5" height="24" />
            <rect x="82" width="2" height="24" />
            <rect x="87" width="3" height="24" />
            <rect x="93" width="1.5" height="24" />
            <rect x="98" width="4" height="24" />
            <rect x="105" width="2" height="24" />
            <rect x="110" width="3" height="24" />
            <rect x="116" width="1.5" height="24" />
            <rect x="121" width="5" height="24" />
            <rect x="129" width="2" height="24" />
            <rect x="134" width="3" height="24" />
            <rect x="140" width="1.5" height="24" />
            <rect x="145" width="4" height="24" />
            <rect x="152" width="2" height="24" />
            <rect x="157" width="3" height="24" />
            <rect x="163" width="1.5" height="24" />
            <rect x="168" width="5" height="24" />
            <rect x="176" width="2" height="24" />
            <rect x="181" width="3" height="24" />
            <rect x="187" width="1.5" height="24" />
            <rect x="192" width="4" height="24" />
          </g>
        </svg>
      </div>
    </div>
  );
}
