import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSidebar } from "./SidebarContext";
import { useAccountStatus, computeIsActive, computeRestricted } from "./helpers";
import { SidebarRestrictedModal } from "./SidebarRestrictedModal";
import {
  sidebarNavItemClass,
  sidebarNavIconClass,
  sidebarActiveBarClass,
} from "./sidebarStyles";
import type { NavItem } from "./types";

interface NavItemLinkProps {
  item: NavItem;
}

export function NavItemLink({ item }: NavItemLinkProps) {
  const location = useLocation();
  const { setSidebarOpen } = useSidebar();
  const accountStatus = useAccountStatus();
  const [restrictedOpen, setRestrictedOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const isMailto = item.href.startsWith("mailto:");
  const isExternal = item.target === "_blank";
  const isActive = computeIsActive(item.href, location.pathname);
  const isRestricted = computeRestricted(item.href, accountStatus);
  const isDisabled = !!item.disabled;

  const className = sidebarNavItemClass(isActive, {
    disabled: isDisabled,
    restricted: isRestricted,
  });

  const openRestricted = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerRef.current = (e.currentTarget as HTMLElement) ?? null;
    setRestrictedOpen(true);
  };
  const closeRestricted = () => {
    setRestrictedOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (isRestricted) {
      openRestricted(e);
      return;
    }
    if (!isExternal) setSidebarOpen(false);
  };

  if (isMailto && !isDisabled) {
    return (
      <a
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={className}
      >
        <NavItemInner item={item} isActive={false} />
      </a>
    );
  }

  if (isExternal && !isRestricted && !isDisabled) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${item.name} (opens in new tab)`}
        onClick={() => setSidebarOpen(false)}
        className={className}
      >
        <NavItemInner item={item} isActive={false} external />
      </a>
    );
  }

  return (
    <>
      <Link
        to={isRestricted || isDisabled ? "#" : item.href}
        onClick={handleClick}
        aria-current={isActive ? "page" : undefined}
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : 0}
        className={className}
      >
        <NavItemInner
          item={item}
          isActive={isActive}
          restricted={isRestricted}
          disabled={isDisabled}
        />
      </Link>
      {restrictedOpen && (
        <SidebarRestrictedModal status={accountStatus} onClose={closeRestricted} />
      )}
    </>
  );
}

interface NavItemInnerProps {
  item: NavItem;
  isActive: boolean;
  restricted?: boolean;
  disabled?: boolean;
  external?: boolean;
}

function NavItemInner({ item, isActive, restricted, disabled, external }: NavItemInnerProps) {
  const { t } = useTranslation();
  const Icon = item.icon;
  return (
    <>
      {isActive && (
        <span aria-hidden="true" className={sidebarActiveBarClass} />
      )}
      <span className={sidebarNavIconClass(isActive)}>
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="flex-1 truncate">{item.name}</span>

      {item.badge != null && !restricted && !disabled && (
        <span className="ml-auto rounded-full bg-accent/20 text-accent text-[11px] font-semibold px-2 py-0.5 shrink-0 ring-1 ring-accent/25">
          {item.badge}
        </span>
      )}
      {restricted && <Lock className="h-3.5 w-3.5 opacity-50 shrink-0" aria-label="Restricted" />}
      {disabled && (
        <span className="text-[10px] uppercase tracking-wide text-sidebar-foreground/40 shrink-0">
          {t("common.soon", "Soon")}
        </span>
      )}
      {external && <ArrowUpRight className="h-3 w-3 opacity-50 shrink-0" aria-hidden="true" />}
    </>
  );
}
