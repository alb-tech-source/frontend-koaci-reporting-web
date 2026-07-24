import Image from "next/image";
import { cn } from "@/shared/lib/utils";

interface KoaciLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { box: 32, text: "text-sm", title: "text-base" },
  md: { box: 40, text: "text-base", title: "text-xl" },
  lg: { box: 56, text: "text-lg", title: "text-2xl" },
};

export function KoaciLogo({ size = "md", showText = false, className }: Readonly<KoaciLogoProps>) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Nanti kalau aset sudah ada, cukup ganti blok di bawah ini */}
      <Image
        src="/logo.svg"          // taruh file asli di public/logo.svg saat sudah ada
        alt="Koaci"
        width={s.box}
        height={s.box}
        className="rounded-xl"
        onError={(e) => {
          // fallback kalau file belum ada, sembunyikan img rusak
          e.currentTarget.style.display = "none";
        }}
      />
      {showText && (
        <div>
          <p className={cn(s.title, "font-semibold leading-none text-foreground")}>Koaci</p>
          <p className="text-xs text-muted-foreground">Reporting App</p>
        </div>
      )}
    </div>
  );
}