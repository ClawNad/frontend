import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import ClawNADLogo from "@/assets/logo.png";

const NAV_LINKS = [
    { label: "Agent" },
    { label: "Agent" },
    { label: "Agent" },
];

export function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="bg-background border-b sticky w-full min-h-[60px] text-white px-4 lg:px-6 py-3 flex items-center justify-between gap-2 z-[998] transition-colors duration-300 border-b-base-border top-0">
            <div className="flex items-center min-w-0 lg:space-x-8 flex-1">
                <div className="flex items-center min-w-0 shrink-0">
                    <img src={ClawNADLogo} alt="logo" className="w-10 h-10 shrink-0" />
                    <h1 className="text-xl sm:text-2xl font-semibold truncate ml-2">ClawNAD</h1>
                </div>
                <div className="hidden md:flex items-center space-x-6 text-xs uppercase font-semibold shrink-0">
                    {NAV_LINKS.map((link, i) => (
                        <div key={i} className="cursor-pointer uppercase font-semibold text-xs hover:text-primary transition-all duration-300">
                            {link.label}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Button className="bg-primary uppercase text-primary-foreground hover:bg-primary/60 ring-offset-background focus-visible:ring-ring inline-flex h-[36px] cursor-pointer items-center text-xs justify-center gap-2 px-2 py-[10.5px] font-semibold text-nowrap transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 disabled:bg-[#82360B] disabled:text-[#471903]">
                    Connect Wallet
                </Button>
                {/* Mobile hamburger */}
                <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="md:hidden p-2 -m-2 text-foreground hover:text-primary outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded"
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile menu overlay */}
            {menuOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[997] bg-black/50 md:hidden"
                        aria-hidden
                        onClick={() => setMenuOpen(false)}
                    />
                    <div className="fixed top-[60px] left-0 right-0 z-[998] bg-background border-b border-border shadow-lg md:hidden">
                        <div className="p-4 flex flex-col gap-2">
                            {NAV_LINKS.map((link, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="text-left py-2 px-3 text-sm uppercase font-semibold text-foreground hover:text-primary hover:bg-accent transition-colors"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
}