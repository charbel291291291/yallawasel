import { Link, useLocation } from "react-router-dom";

const navItems = [
    { path: "/dashboard", icon: "fa-list-check", label: "Orders" },
    { path: "/earnings", icon: "fa-wallet", label: "Earnings" },
    { path: "/profile", icon: "fa-user", label: "Profile" },
] as const;

const DriverBottomNav = () => {
    const { pathname } = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 px-2 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            {navItems.map(({ path, icon, label }) => {
                const active = pathname === path;
                return (
                    <Link
                        key={path}
                        to={path}
                        className={`flex flex-col items-center gap-0.5 transition-colors ${active ? "text-blue-600" : "text-gray-400"}`}
                    >
                        <i className={`fa-solid ${icon} text-xl`} />
                        <span className="text-[10px] font-bold">{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default DriverBottomNav;
