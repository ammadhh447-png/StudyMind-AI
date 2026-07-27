function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type UserAvatarProps = {
  name?: string;
  avatar?: string;
  size?: "sm" | "md";
  className?: string;
};

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-10 w-10 text-sm",
};

export function UserAvatar({ name, avatar, size = "md", className = "" }: UserAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#f0d08a] via-[#c9a84c] to-[#8a6420] font-semibold text-[#1a1408] ${sizes[size]} ${className}`}
    >
      {avatar ? (
        <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials(name || "SM")
      )}
    </div>
  );
}
