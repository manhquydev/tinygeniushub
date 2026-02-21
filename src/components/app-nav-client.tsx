"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { ParentalGateModal } from "./parental-gate-modal";

interface AppNavClientProps {
    hasParent: boolean;
    isAdmin: boolean;
}

export function AppNavClient({ hasParent, isAdmin }: AppNavClientProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [gateOpen, setGateOpen] = useState(false);
    const pendingHrefRef = useRef<string | null>(null);
    const pendingFormRef = useRef<HTMLFormElement | null>(null);

    const isKidUI = pathname?.startsWith("/kid");

    const handleInterceptNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (!isKidUI) return; // Only intercept if we are in the Kid UI

        // If the target is NOT within /kid, intercept it
        if (!href.startsWith("/kid")) {
            e.preventDefault();
            pendingHrefRef.current = href;
            pendingFormRef.current = null;
            setGateOpen(true);
        }
    };

    const handleInterceptLogout = (e: React.FormEvent<HTMLFormElement>) => {
        if (!isKidUI) return; // Only intercept if we are in the Kid UI

        e.preventDefault();
        pendingHrefRef.current = null;
        pendingFormRef.current = e.currentTarget;
        setGateOpen(true);
    };

    const handleGateSuccess = () => {
        setGateOpen(false);
        if (pendingHrefRef.current) {
            router.push(pendingHrefRef.current);
            pendingHrefRef.current = null;
        } else if (pendingFormRef.current) {
            pendingFormRef.current.submit();
            pendingFormRef.current = null;
        }
    };

    const handleGateCancel = () => {
        setGateOpen(false);
        pendingHrefRef.current = null;
        pendingFormRef.current = null;
    };

    return (
        <>
            <header className="app-nav">
                <div className="container nav-inner">
                    <Link
                        href="/"
                        className="brand"
                        aria-label="Trang chủ Cùng Con Tự Học"
                        onClick={(e) => handleInterceptNavigation(e, "/")}
                    >
                        <Image
                            src="/logo-cungcontuhoc-horizontal.svg"
                            alt="Cùng Con Tự Học Logo"
                            width={180}
                            height={50}
                            priority
                        />
                    </Link>

                    <nav className="nav-links">
                        <Link
                            href="/pricing"
                            className="nav-hide-mobile"
                            onClick={(e) => handleInterceptNavigation(e, "/pricing")}
                        >
                            Bảng giá
                        </Link>

                        {hasParent ? (
                            <>
                                <Link href="/parent/dashboard" onClick={(e) => handleInterceptNavigation(e, "/parent/dashboard")}>Dashboard</Link>
                                <Link href="/parent/children" onClick={(e) => handleInterceptNavigation(e, "/parent/children")}>Hồ sơ bé</Link>
                                <Link href="/parent/reports" onClick={(e) => handleInterceptNavigation(e, "/parent/reports")}>Báo cáo</Link>
                                {isAdmin ? <Link href="/admin" onClick={(e) => handleInterceptNavigation(e, "/admin")}>Admin</Link> : null}
                                <form action="/api/auth/logout" method="post" onSubmit={handleInterceptLogout}>
                                    <button type="submit" className="ghost-button">
                                        Đăng xuất
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/login" className="nav-hide-mobile" onClick={(e) => handleInterceptNavigation(e, "/auth/login")}>Đăng nhập</Link>
                                <Link href="/auth/signup" className="solid-button" onClick={(e) => handleInterceptNavigation(e, "/auth/signup")}>
                                    <span className="nav-cta-short">Dùng thử</span>
                                    <span className="nav-cta-full">Bắt đầu trial 7 ngày</span>
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            {gateOpen && (
                <ParentalGateModal
                    onSuccess={handleGateSuccess}
                    onCancel={handleGateCancel}
                />
            )}
        </>
    );
}
