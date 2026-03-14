import type { ReactNode } from "react";
import Image from "next/image";
import { Mascot, type MascotActionProp } from "@/components/mascot";

interface AuthSplitShellProps {
  badge: string;
  title: string;
  description: string;
  actionProp?: MascotActionProp;
  backgroundImageSrc?: string;
  stickerSrc?: string;
  children: ReactNode;
}

export function AuthSplitShell({
  badge,
  title,
  description,
  actionProp = "none",
  backgroundImageSrc = "/images/bg/bg_hero_cloud_learning.png",
  stickerSrc,
  children,
}: AuthSplitShellProps) {
  return (
    <section className="relative">
      <div className="grid min-h-[calc(100dvh-9.5rem)] overflow-hidden rounded-[2rem] border border-white/50 bg-white/80 shadow-[0_30px_70px_rgba(15,23,42,0.18)] backdrop-blur-sm lg:rounded-none lg:border-x-0 lg:grid-cols-[45fr_55fr]">
        <aside className="relative isolate order-1 overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <Image
            src={backgroundImageSrc}
            alt=""
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover opacity-45"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.28)_0%,transparent_48%),radial-gradient(circle_at_82%_80%,rgba(16,185,129,0.34)_0%,transparent_46%),linear-gradient(145deg,rgba(2,6,23,0.32)_0%,rgba(15,23,42,0.58)_52%,rgba(2,6,23,0.28)_100%)]"
          />
          <div className="relative z-10 flex h-full flex-col justify-center gap-6">
            <div className="inline-flex w-fit items-center rounded-full border border-white/35 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              {badge}
            </div>

            <div className="grid gap-3 text-balance">
              <h1 className="max-w-[15ch] text-3xl font-black leading-[1.08] tracking-[-0.02em] sm:text-4xl lg:text-[2.85rem]">
                {title}
              </h1>
              <p className="max-w-[38ch] text-sm font-medium leading-relaxed text-emerald-50/95 sm:text-base">{description}</p>
            </div>

            <div className="grid place-items-center pt-1 sm:pt-3 lg:pt-5">
              <Mascot
                variant="duo"
                state="happy"
                actionProp={actionProp}
                size={320}
                className="h-[220px] w-[220px] drop-shadow-[0_20px_45px_rgba(5,46,22,0.42)] sm:h-[270px] sm:w-[270px] lg:h-[320px] lg:w-[320px]"
                motionLevel="full"
                pauseWhenOffscreen
              />
            </div>
          </div>

          {stickerSrc ? (
            <Image
              src={stickerSrc}
              alt=""
              width={320}
              height={320}
              className="pointer-events-none absolute -bottom-8 -right-8 z-[1] w-[170px] opacity-90 drop-shadow-[0_10px_24px_rgba(2,6,23,0.36)] sm:w-[200px]"
            />
          ) : null}
        </aside>

        <div className="order-2 flex items-center bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:px-6 sm:py-10 lg:px-12 lg:py-12">
          <div className="mx-auto w-full max-w-[540px]">{children}</div>
        </div>
      </div>
    </section>
  );
}
