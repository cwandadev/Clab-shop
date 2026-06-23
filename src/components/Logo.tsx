import clabAsset from "@/assets/clab.png.asset.json";

export function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <img
      src={clabAsset.url}
      alt="Clab from tieflab"
      className={`${className} rounded object-cover`}
    />
  );
}
