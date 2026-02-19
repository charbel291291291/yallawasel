// Core Layout Component
// This component wraps all main content and ensures consistent structure

import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = "" }) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

// Header wrapper
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
    <div>
      <h1 className="font-luxury text-3xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
    {action && <div className="mt-4 sm:mt-0">{action}</div>}
  </div>
);

// Section wrapper - always renders container
export const Section: React.FC<{
  id?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}> = ({ id, title, subtitle, children, className = "", noPadding = false }) => (
  <section id={id} className={`${noPadding ? "" : "py-8"} ${className}`}>
    {title && (
      <div className="text-center mb-8">
        <h2 className="font-luxury text-2xl font-bold text-gray-900">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
      </div>
    )}
    {children}
  </section>
);

// Empty state - always shows something
export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon = "fa-box-open", title, description, action }) => (
  <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
    <i className={`fas ${icon} text-4xl text-gray-300 mb-4`}></i>
    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    {description && (
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
        {description}
      </p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// Loading state
export const LoadingState: React.FC<{
  message?: string;
}> = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <i className="fas fa-spinner fa-spin text-3xl text-primary mb-4"></i>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  </div>
);

// Card wrapper
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}> = ({ children, className = "", hover = false, onClick }) => (
  <div
    className={`
      bg-white rounded-2xl border border-gray-100 shadow-sm
      ${
        hover
          ? "hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
          : ""
      }
      ${className}
    `}
    onClick={onClick}
  >
    {children}
  </div>
);

export default Layout;
