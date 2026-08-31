"use client";

import React, { useState } from "react";
import { Compass, Box, Sun, Moon, Sparkles, FolderTree, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@machi-asia/auth";
import { AuthModal, type LoginCredentials, type RegisterDetails } from "@machi-asia/ui";
import { MonorepoScanResult } from "@/lib/scanner";

interface NavbarProps {
  stats: MonorepoScanResult["stats"] | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onGoHome: () => void;
}

export function Navbar({
  stats,
  isDark,
  onToggleTheme,
  onGoHome,
}: NavbarProps) {
  const { session, logout, login, register, guestLogin } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const userEmail = session?.user?.email;
  const displayName = userEmail ? userEmail.split("@")[0] : "User";

  return (
    <header className="navbar-header">
      <div className="navbar-left">
        <button onClick={onGoHome} className="navbar-brand-btn" title="Go to Dashboard Overview">
          <div className="brand-icon-box">
            <Compass size={20} className="brand-compass" />
          </div>
          <div className="brand-text">
            <span className="brand-name">machi-asia</span>
            <span className="brand-badge">test / explorer</span>
          </div>
        </button>

        {stats && (
          <div className="navbar-stats-strip">
            <div className="stat-chip">
              <Box size={13} />
              <span>{stats.totalPackages} Packages</span>
            </div>
            <div className="stat-chip">
              <FolderTree size={13} />
              <span>{stats.totalTsxFiles} .tsx Files</span>
            </div>
            <div className="stat-chip highlight">
              <Sparkles size={13} />
              <span>Auto-Updating</span>
            </div>
          </div>
        )}
      </div>

      <div className="navbar-right">
        {session ? (
          <div className="navbar-auth-chip">
            <div className="navbar-user-badge">
              <UserIcon size={14} />
              <span className="navbar-user-name">{displayName}</span>
            </div>
            <button
              onClick={() => logout()}
              className="navbar-logout-btn"
              title="Log out of current session"
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="navbar-signin-btn"
            title="Sign in or register"
          >
            <LogIn size={15} />
            <span>Sign in</span>
          </button>
        )}

        <button
          onClick={onToggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        authError={authError}
        onLogin={async (creds: LoginCredentials) => {
          setAuthError(null);
          try {
            await login(creds.email, creds.password);
            setShowAuthModal(false);
          } catch (err) {
            setAuthError(err instanceof Error ? err.message : "Login failed");
            throw err;
          }
        }}
        onRegister={async (details: RegisterDetails) => {
          setAuthError(null);
          try {
            await register(details.email, details.password);
            setShowAuthModal(false);
          } catch (err) {
            setAuthError(err instanceof Error ? err.message : "Registration failed");
            throw err;
          }
        }}
        onGuest={async () => {
          setAuthError(null);
          try {
            await guestLogin();
            setShowAuthModal(false);
          } catch (err) {
            setAuthError(err instanceof Error ? err.message : "Guest login failed");
            throw err;
          }
        }}
      />
    </header>
  );
}

export default Navbar;
