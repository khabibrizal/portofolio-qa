export function SectionHeading({
  judul,
  intro,
}: {
  judul: string
  intro?: string
}) {
  return (
    <>
      <h2 className="mb-3 font-display text-[clamp(26px,3.4vw,36px)] font-bold tracking-[-0.01em]">
        {judul}
      </h2>
      {intro ? <p className="mb-11 max-w-[560px] text-[15.5px] text-ink-soft">{intro}</p> : null}
    </>
  )
}
